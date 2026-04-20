'use server';

import { db } from '@/lib/prisma';
import { Grade, Gender, TrainingCategory } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// Interface for parsed data based on the new CSV headers
interface EmployeeImportRow {
    'Emp.Id'?: string;
    'Emp.Name'?: string;
    'Grade'?: string;
    'Designation'?: string;
    'Department'?: string;
    'Project Name'?: string; // Mapped to subDepartment
    'Site'?: string; // Mapped to location
    'Training Group'?: string;
    'Training Need Identified'?: string;
    'TNI Source'?: string;
    'Status-Completed/Cancelled/Open'?: string;
    'Separated  TNI (Technical)'?: string;
    // Fallbacks just in case headers vary slightly
    id?: string;
    name?: string;
    email?: string;
}

export async function processEmployeeUpload(rowData: EmployeeImportRow[]) {
    if (!await auth()) return { success: false, count: 0, errors: ['Unauthorized'] };
    let successCount = 0;
    let errors: string[] = [];

    // Pre-fetch all programs to avoid querying inside the loop
    const existingPrograms = await db.program.findMany({
        select: { id: true, name: true, category: true }
    });
    
    // Create a map for quick lookup (case-insensitive)
    const programMap = new Map<string, {id: string, category: TrainingCategory}>();
    existingPrograms.forEach(p => {
        programMap.set(p.name.toLowerCase().trim(), { id: p.id, category: p.category });
    });

    // Concurrency Control: Serial processing helps avoid deadlocks during bulk upserts
    for (const row of rowData) {
        try {
            // Flexible ID checking
            const empIdRaw = row['Emp.Id'] || row.id;
            if (!empIdRaw) {
                errors.push(`Row missing Employee ID: Skipping`);
                continue;
            }
            
            const empId = empIdRaw.toString().trim();
            const empName = (row['Emp.Name'] || row.name || '').toString().trim();

            // Handle Email Placeholder
            let emailRaw = row.email?.toString().trim();
            if (!emailRaw) {
                emailRaw = `${empId}@thriveni.com`; // Unique placeholder email string
            }

            // Validate Grade
            let gradeEnum: Grade | null = null;
            const gradeRaw = row['Grade'] || '';
            if (gradeRaw && gradeRaw.trim()) {
                const normalizedGrade = gradeRaw.trim().toUpperCase();
                // Map 'Executives' or similar to 'EXECUTIVE'
                if (normalizedGrade.includes('EXECUTIVE')) gradeEnum = 'EXECUTIVE';
                else if (normalizedGrade.includes('WORKMAN')) gradeEnum = 'WORKMAN';
                else if (Object.values(Grade).includes(normalizedGrade as Grade)) gradeEnum = normalizedGrade as Grade;
            }

            // Sanitized Employee Data Object
            const employeeData = {
                name: empName.substring(0, 100),
                email: emailRaw.substring(0, 100),
                grade: gradeEnum,
                designation: row['Designation'] ? row['Designation'].toString().substring(0, 100) : null,
                sectionName: row['Department'] ? row['Department'].toString().substring(0, 100) : null,
                subDepartment: row['Project Name'] ? row['Project Name'].toString().substring(0, 100) : null,
                location: row['Site'] ? row['Site'].toString().substring(0, 100) : null,
            };

            // 1. Upsert Employee
            await db.employee.upsert({
                where: { id: empId },
                update: {
                    ...employeeData,
                    // If the employee exists and has a real email, DON'T overwrite it with a placeholder.
                    // But Prisma upsert update doesn't have a direct "ignore if empty" without complex checks.
                    // So we conditionally exclude email from update if we generated a placeholder.
                    ...(row.email ? { email: employeeData.email } : {})
                },
                create: {
                    id: empId,
                    ...employeeData
                }
            });

            // 2. Process TNI Nominations
            const tniSource = row['TNI Source'] ? row['TNI Source'].toString().trim() : 'BULK';
            
            // Map Status
            const rawStatus = row['Status-Completed/Cancelled/Open'] ? row['Status-Completed/Cancelled/Open'].toString().trim().toUpperCase() : 'OPEN';
            let tniStatus = 'Pending';
            let managerApprovalStatus = 'BULK_UPLOADED';
            
            if (rawStatus === 'COMPLETED') {
                tniStatus = 'Completed';
                managerApprovalStatus = 'Approved';
            } else if (rawStatus === 'CANCELLED') {
                tniStatus = 'Cancelled';
                managerApprovalStatus = 'Rejected';
            }

            // Extract programs from 'Separated  TNI (Technical)' or 'Training Need Identified'
            let programsString = row['Separated  TNI (Technical)'] || row['Training Need Identified'] || '';
            programsString = programsString.toString();
            
            if (programsString) {
                // Split by commas or # (as seen in the sample)
                const programParts = programsString.split(/,|#/);
                
                for (let rawProgName of programParts) {
                    // Clean up string like "Additional Programs" or "(1 Days)"
                    let progName = rawProgName.trim();
                    if (!progName || progName.includes('(1 Days)') || progName.includes('(2 Days)')) continue;
                    
                    // Remove leading/trailing artifacts
                    progName = progName.replace(/["']/g, ''); // Remove quotes
                    
                    if (progName.toLowerCase().startsWith('additional programs') || progName.toLowerCase().startsWith('computer skills')) {
                        // The CSV format sometimes prefixes the category like "Additional Programs # 5S...".
                        continue;
                    }

                    // Check if Program Exists
                    const progKey = progName.toLowerCase();
                    let programId = '';
                    
                    if (programMap.has(progKey)) {
                        programId = programMap.get(progKey)!.id;
                    } else {
                        // Determine category (default to COMMON or FUNCTIONAL based on CSV)
                        let newCategory: TrainingCategory = 'COMMON';
                        const tGroup = row['Training Group'] ? row['Training Group'].toString().toLowerCase() : '';
                        if (tGroup.includes('functional') || programsString.toLowerCase().includes('technical')) {
                            newCategory = 'FUNCTIONAL';
                        }
                        
                        // Create missing program dynamically
                        const newProg = await db.program.create({
                            data: {
                                name: progName,
                                category: newCategory,
                            }
                        });
                        programId = newProg.id;
                        programMap.set(progKey, { id: programId, category: newCategory }); // cache it
                    }

                    // Check if a pending nomination already exists for this employee/program to prevent duplicates
                    const existingNomination = await db.nomination.findFirst({
                        where: {
                            empId: empId,
                            programId: programId,
                            status: tniStatus
                        }
                    });

                    if (!existingNomination) {
                        // Create the Nomination record
                        await db.nomination.create({
                            data: {
                                empId: empId,
                                programId: programId,
                                source: tniSource,
                                status: tniStatus,
                                managerApprovalStatus: managerApprovalStatus,
                                justification: "Bulk uploaded from TNI Master List"
                            }
                        });
                    }
                }
            }
            
            successCount++;
        } catch (e: any) {
            errors.push(`Row Error (${row['Emp.Id'] || 'Unknown ID'}): ${e.message}`);
        }
    }

    revalidatePath('/admin/master-data');
    revalidatePath('/admin/tni-dashboard');
    return { success: true, count: successCount, errors };
}
