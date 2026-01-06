'use server';

import { db } from '@/lib/db';
import { Grade } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Simple interface for parsed data - in reality we might validate deeper
interface EmployeeImportRow {
    id: string; // emp_id
    name: string;
    email: string;
    grade: string;
    sectionName?: string;
    location?: string;
    manager_name?: string; // These might be empty in CSV, causing issues if not handled
    manager_email?: string;
}

export async function processEmployeeUpload(rowData: EmployeeImportRow[]) {
    let successCount = 0;
    let errors: string[] = [];

    // Process in chunks or one by one. For safety and error reporting, one by one is slower but clearer.
    // Given usage scale, < 500 records likely, so sequential promises (or parallel w/ limit) is fine.

    // We will use Promise.allSettled for parallel execution to speed it up
    const results = await Promise.allSettled(rowData.map(async (row, index) => {
        try {
            // Validate basic required fields
            if (!row.id || !row.name || !row.email || !row.grade) {
                throw new Error(`Row ${index + 1}: Missing required fields (id, name, email, grade)`);
            }

            // Normalize grade enum
            const gradeEnum = row.grade.toUpperCase() === 'EXECUTIVE' ? Grade.EXECUTIVE :
                row.grade.toUpperCase() === 'WORKMAN' ? Grade.WORKMAN : undefined;

            if (!gradeEnum) {
                throw new Error(`Row ${index + 1}: Invalid grade (Must be EXECUTIVE or WORKMAN)`);
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
                }
            });
            return "success";
        } catch (e: any) {
            throw new Error(e.message || `Row ${index + 1}: Failed to import`);
        }
    }));

    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            successCount++;
        } else {
            errors.push(result.reason.message);
        }
    });

    revalidatePath('/admin/master-data');
    return { success: true, count: successCount, errors };
}
