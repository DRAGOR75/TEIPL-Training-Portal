'use server';

import { db } from '@/lib/prisma';
import { Grade, Gender } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Simple interface for parsed data - in reality we might validate deeper
interface EmployeeImportRow {
    id: string; // emp_id
    name: string;
    email: string;
    grade?: string;
    sectionName?: string;
    location?: string;
    gender?: string;
    manager_name?: string; // These might be empty in CSV, causing issues if not handled
    manager_email?: string;
    program_name?: string;
    start_date?: string;
    end_date?: string;
}

export async function processEmployeeUpload(rowData: EmployeeImportRow[]) {
    let successCount = 0;
    let errors: string[] = [];

    // Concurrency Control: Serial processing prevents race conditions during upsert
    for (const row of rowData) {
        try {
            // Validate basic required fields
            if (!row.id) {
                errors.push(`Row missing ID: Skipping`);
                continue;
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
                const normalizedGrade = row.grade.trim().toUpperCase() as Grade;
                if (Object.values(Grade).includes(normalizedGrade)) {
                    gradeEnum = normalizedGrade;
                }
            }

            // Validate Gender
            let genderEnum: Gender | null = null;
            if (row.gender && row.gender.trim()) {
                const normalizedGender = row.gender.trim().toUpperCase() as Gender;
                if (Object.values(Gender).includes(normalizedGender)) {
                    genderEnum = normalizedGender;
                }
            }

            // Sanitized Data Object
            const employeeData = {
                name: row.name ? row.name.toString().replace(/<[^>]*>?/gm, '').trim() : '',
                email: row.email ? row.email.toString().replace(/<[^>]*>?/gm, '').trim() : '',
                grade: gradeEnum,
                sectionName: row.sectionName ? row.sectionName.toString().replace(/<[^>]*>?/gm, '').trim() : null,
                location: row.location ? row.location.toString().replace(/<[^>]*>?/gm, '').trim() : null,
                gender: genderEnum,
                managerName: row.manager_name ? row.manager_name.toString().replace(/<[^>]*>?/gm, '').trim() : null,
                managerEmail: row.manager_email ? row.manager_email.toString().replace(/<[^>]*>?/gm, '').trim() : null,
                programName: row.program_name ? row.program_name.toString().replace(/<[^>]*>?/gm, '').trim() : null,
                startDate: parseDate(row.start_date),
                endDate: parseDate(row.end_date),
            };

            await db.employee.upsert({
                where: { id: row.id.toString() },
                update: employeeData,
                create: {
                    id: row.id.toString(),
                    ...employeeData
                }
            });
            successCount++;
        } catch (e: any) {
            errors.push(`ID ${row.id}: ${e.message}`);
        }
    }

    revalidatePath('/admin/master-data');
    return { success: true, count: successCount, errors };
}
