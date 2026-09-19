'use server';

import { db } from '@/lib/prisma';
import { revalidateTag, revalidatePath } from 'next/cache';
import { parseFlexibleDate } from '@/lib/date-utils';

export interface CalendarUploadRecord {
    slNo?: string;
    month?: string;
    programName: string;
    altProgramName?: string | null;
    programId?: string;
    progCategory?: string;
    startDate: string;
    endDate: string;
    days?: string;
    trainingHours?: string;
    sessionCategory?: string;
    sessionId?: string;
    targetedGrade?: string;
    section?: string;
    trainerName?: string;
    location?: string;
}

// Robust date parser
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    // Normalize narrow non-breaking space (from AM/PM like 12:00:00 AM) and other whitespace
    let cleanedDateStr = dateStr.replace(/[\u202f\u00a0]/g, ' ').trim();

    // Remove day abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    cleanedDateStr = cleanedDateStr.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi, '').trim();
    
    let parsed = new Date(cleanedDateStr);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    // Fallback to parseFlexibleDate (e.g. DD-MMM-YY, DD/MM/YYYY, etc.)
    const flex = parseFlexibleDate(cleanedDateStr);
    if (flex) {
        parsed = new Date(flex);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return null;
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

            // If custom sessionId is provided, check if it already exists
            const customSessionId = record.sessionId?.trim();
            if (customSessionId) {
                const existingSession = await db.trainingSession.findUnique({
                    where: { id: customSessionId }
                });
                if (existingSession) {
                    errors.push(`Row ${index + 1}: Session ID "${customSessionId}" already exists in the system.`);
                    continue;
                }
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

            // Reject if program does not exist in master catalog
            if (!program) {
                errors.push(`Row ${index + 1}: Program "${record.programName}" not found in catalog.`);
                continue;
            }

            // Map Section to the Program (DO NOT map it to Location)
            if (record.section && record.section.trim()) {
                const sectionName = record.section.trim();
                let sectionObj = await db.section.findUnique({
                    where: { name: sectionName }
                });

                if (sectionObj) {
                    // Link the section to the program if not already connected
                    await db.program.update({
                        where: { id: program.id },
                        data: {
                            sections: {
                                connect: { id: sectionObj.id }
                            }
                        }
                    }).catch(() => {});
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

            // Auto-calculate Assessment Date (+30 days)
            const feedbackCreationDate = new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000);

            // Parse numeric days and hours if present
            const parsedDays = record.days ? parseFloat(record.days.toString()) : undefined;
            const parsedHours = record.trainingHours ? parseFloat(record.trainingHours.toString()) : undefined;

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
                        ...(customSessionId ? { id: customSessionId } : {}),
                        programName: program.name,
                        trainerName: record.trainerName?.trim() || 'TBD',
                        startDate: start,
                        endDate: end,
                        location: record.location?.trim() || 'TBD',
                        trainingDays: isNaN(parsedDays as number) ? undefined : parsedDays,
                        trainingHours: isNaN(parsedHours as number) ? undefined : parsedHours,
                        sessionCategory: record.sessionCategory?.trim() || undefined,
                        nominationBatchId: batch.id,
                        requireManagerApproval: false,
                        feedbackCreationDate: feedbackCreationDate,
                        assessmentDate: feedbackCreationDate,
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
