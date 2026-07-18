'use server';

import { db } from '@/lib/prisma';
import { revalidateTag, revalidatePath } from 'next/cache';

export interface CalendarUploadRecord {
    slNo?: string;
    month?: string;
    programName: string;
    altProgramName?: string | null;
    programId?: string;
    startDate: string;
    endDate: string;
    days?: string;
    targetedGrade?: string;
    section?: string;
    trainerName?: string;
    location?: string;
}

// Robust date parser
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    // Remove day abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    // Matches word boundaries so it doesn't accidentally remove parts of other words
    const cleanedDateStr = dateStr.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi, '').trim();
    
    const parsed = new Date(cleanedDateStr);
    if (isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
};

export async function processCalendarBatch(records: CalendarUploadRecord[]) {
    try {
        let successCount = 0;
        let errors = [];

        for (const [index, record] of records.entries()) {
            if (!record.programName || !record.startDate || !record.endDate) {
                errors.push(`Row ${index + 1}: Missing required fields (Program Name, Start Date, End Date).`);
                continue;
            }

            const start = parseDate(record.startDate);
            const end = parseDate(record.endDate);

            if (!start || !end) {
                errors.push(`Row ${index + 1}: Invalid date format for "${record.altProgramName || record.programName}".`);
                continue;
            }

            // Ensure end date is not before start date
            if (end < start) {
                errors.push(`Row ${index + 1}: End date is before start date for "${record.altProgramName || record.programName}".`);
                continue;
            }

            // Find Program by exact name or ID
            let program = null;
            if (record.programId) {
                program = await db.program.findUnique({
                    where: { id: record.programId.trim() }
                });
            }
            if (!program) {
                program = await db.program.findFirst({
                    where: { name: record.programName.trim() }
                });
            }

            // Create a stub program if it doesn't exist
            if (!program) {
                program = await db.program.create({
                    data: {
                        name: record.programName.trim(),
                        category: 'OTHER_PROGRAMS', // Default
                    }
                });
            }

            // Map Location to the Location table to ensure it exists for Gantt chart mapping
            if (record.location && record.location.trim()) {
                const locName = record.location.trim();
                await db.location.upsert({
                    where: { name: locName },
                    update: {},
                    create: { name: locName }
                });
            }

            // Map Section to the Program (DO NOT map it to Location)
            if (record.section && record.section.trim()) {
                const sectionName = record.section.trim();
                let sectionObj = await db.section.findUnique({
                    where: { name: sectionName }
                });

                if (!sectionObj) {
                    sectionObj = await db.section.create({
                        data: { name: sectionName }
                    });
                }

                // Link the section to the program
                await db.program.update({
                    where: { id: program.id },
                    data: {
                        sections: {
                            connect: { id: sectionObj.id }
                        }
                    }
                });
            }

            // Upsert Trainers to ensure they exist for Gantt chart mapping
            if (record.trainerName && record.trainerName.trim()) {
                // Split by comma, ampersand, or the word 'and'
                const sessionTrainers = record.trainerName
                    .split(/,|&|\band\b/i)
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                
                for (const tName of sessionTrainers) {
                    await db.trainer.upsert({
                        where: { name: tName },
                        update: {},
                        create: { name: tName }
                    });
                }
            }

            // Check for existing session to prevent duplicates
            const existingBatch = await db.nominationBatch.findFirst({
                where: {
                    programId: program.id,
                    proposedStartDate: start,
                    proposedEndDate: end,
                    status: 'Scheduled'
                }
            });

            if (existingBatch) {
                // If a session for this program already exists on these exact dates, skip it
                // To avoid duplicate calendar blocks.
                errors.push(`Row ${index + 1}: Skipped duplicate session for "${record.altProgramName || record.programName}" on ${start.toISOString().split('T')[0]}`);
                continue;
            }

            // Use transaction to ensure both batch and session are created together
            await db.$transaction(async (tx) => {
                const batch = await tx.nominationBatch.create({
                    data: {
                        name: `${program.name} - ${start.toISOString().split('T')[0]}`,
                        programId: program.id,
                        status: 'Scheduled',
                        publishToCalendar: true,
                        proposedStartDate: start,
                        proposedEndDate: end,
                        proposedTrainer: record.trainerName?.trim() || 'TBD',
                        proposedLocation: record.location?.trim() || 'TBD',
                    }
                });

                await tx.trainingSession.create({
                    data: {
                        programName: program.name,
                        trainerName: record.trainerName?.trim() || 'TBD',
                        startDate: start,
                        endDate: end,
                        location: record.location?.trim() || 'TBD',
                        nominationBatchId: batch.id,
                        requireManagerApproval: false,
                    }
                });
            });

            successCount++;
        }

        // Invalidate caches
        // @ts-ignore
        revalidateTag('sessions-list');
        // @ts-ignore
        revalidateTag('admin-sessions');
        // @ts-ignore
        revalidateTag('calendar');
        
        revalidatePath('/admin/tni-dashboard');
        revalidatePath('/admin/dashboard');

        return { success: true, count: successCount, errors: errors.length > 0 ? errors : undefined };
    } catch (error: any) {
        console.error('Batch Calendar Upload Error:', error);
        return { success: false, error: error.message };
    }
}
