'use server';

import { db } from '@/lib/db';
import { Grade } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Simple interface for parsed data - in reality we might validate deeper
interface EmployeeImportRow {
    id: string; // emp_id
    name: string;
    email: string;
    grade?: string;
    sectionName?: string;
    location?: string;
    manager_name?: string; // These might be empty in CSV, causing issues if not handled
    manager_email?: string;
    program_name?: string;
    start_date?: string;
    end_date?: string;
}

export async function processEmployeeUpload(rowData: EmployeeImportRow[]) {
    let successCount = 0;
    let errors: string[] = [];

    // Concurrency Control: Process the received batch in smaller chunks to avoid overwhelming the DB
    const BATCH_SIZE = 50; // number of concurrent DB operations

    for (let i = 0; i < rowData.length; i += BATCH_SIZE) {
        const batch = rowData.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(batch.map(async (row, batchIndex) => {
            const globalIndex = i + batchIndex;
            try {
                // Validate basic required fields
                if (!row.id) {
                    throw new Error(`Row ${globalIndex + 1}: Missing required fields (id)`);
                }


                // Helper to parse date strictly
                const parseDate = (dateStr: string | undefined) => {
                    if (!dateStr) return null;
                    const d = new Date(dateStr);
                    return isNaN(d.getTime()) ? null : d;
                };

                // Validate Grade
                let gradeEnum: Grade | null = null;
                if (row.grade && row.grade.trim()) {
                    const normalizedGrade = row.grade.trim().toUpperCase();
                    if (!Object.values(Grade).includes(normalizedGrade as Grade)) {
                        throw new Error(`Row ${globalIndex + 1}: Invalid grade '${row.grade}'. Must be one of: ${Object.values(Grade).join(', ')}`);
                    }
                    gradeEnum = normalizedGrade as Grade;
                }

                await db.employee.upsert({
                    where: { id: row.id.toString() },
                    update: {
                        name: row.name,
                        email: row.email,
                        grade: gradeEnum,
                        sectionName: row.sectionName || null,
                        location: row.location || null,
                        manager_name: row.manager_name || null,
                        manager_email: row.manager_email || null,
                        program_name: row.program_name || null,
                        start_date: parseDate(row.start_date),
                        end_date: parseDate(row.end_date),
                    },
                    create: {
                        id: row.id.toString(),
                        name: row.name,
                        email: row.email,
                        grade: gradeEnum,
                        sectionName: row.sectionName || null,
                        location: row.location || null,
                        manager_name: row.manager_name || null,
                        manager_email: row.manager_email || null,
                        program_name: row.program_name || null,
                        start_date: parseDate(row.start_date),
                        end_date: parseDate(row.end_date),
                    }
                });
                return "success";
            } catch (e: any) {
                throw new Error(e.message || `Row ${globalIndex + 1}: Failed to import`);
            }
        }));

        batchResults.forEach((result) => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                errors.push(result.reason.message);
            }
        });
    }

    revalidatePath('/admin/master-data');
    return { success: true, count: successCount, errors };
}
