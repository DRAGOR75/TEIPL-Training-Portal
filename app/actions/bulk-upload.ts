'use server';

import { db } from '@/lib/prisma';
import { Grade, Gender, TrainingCategory } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';

// Helper to parse dates robustly (handles MM/DD/YYYY and DD/MM/YYYY)
function parseFlexibleDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    dateStr = dateStr.trim();
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
        let part1 = parseInt(parts[0], 10);
        let part2 = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        if (year < 100) year += year < 50 ? 2000 : 1900;

        let month = part1;
        let day = part2;
        
        // If first part is > 12, it must be the day (DD/MM/YYYY format)
        if (part1 > 12 && part2 <= 12) {
            month = part2;
            day = part1;
        }

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return new Date(Date.UTC(year, month - 1, day));
        }
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
}

// Interface for parsed data based on the new CSV headers
interface EmployeeImportRow {
    'Emp.Id'?: string;
    'Emp.Name'?: string;
    'Grade'?: string;
    'Designation'?: string;
    'Department'?: string;
    'Section'?: string;
    'Gender'?: string;
    'Sex'?: string;
    'Project Name'?: string; // Mapped to projectLocation
    'Site'?: string; // Mapped to location
    'Training Group'?: string;
    'Training Need Identified'?: string;
    'TNI Source'?: string;
    'Status-Completed/Cancelled/Open'?: string;
    'Separated  TNI (Technical)'?: string;
    // Fallbacks just in case headers vary slightly
    id?: string;
    'Emp ID'?: string;
    'Emp.ID'?: string;
    name?: string;
    'Name'?: string;
    email?: string;
    'Subject Code'?: string;
    'DOB'?: string;
    'DOJ'?: string;
    'Date of Birth'?: string;
    'D.O'?: string;
    'D.O.J'?: string;
    'Date of Joining'?: string;
    'Mobile No'?: string;
    'Mobile'?: string;
    'Email id'?: string;
    'Email ID'?: string;
    'Reporting Manager'?: string;
    'Manager ID'?: string;
    'Manager Mobile No'?: string;
    'ManagerMobile No'?: string;
    'Manager Email ID'?: string;
    'ManagerEmail ID'?: string;
    'Mobile No '?: string;
    'Location'?: string;
    // New Fields
    'Region'?: string;
    'Organization'?: string;
    'Highest Qualification'?: string;
    'Department Group'?: string;
    'Employment Status'?: string;
    'Status'?: string;
    'Aadhar Number'?: string;
    'Employee Group M/NM/W'?: string;
    'On-Roll / Contract'?: string;
    // Newly added fallback headers
    'Email'?: string;
    'Project Location'?: string;
    'Manager Name'?: string;
    'Manager Email'?: string;
    'Manager Mobile'?: string;
    'Employee Group (M/NM/W)'?: string;
    'On Roll/Contract'?: string;
}

export async function processEmployeeUpload(rowData: EmployeeImportRow[]) {
    if (!await auth()) return { success: false, count: 0, errors: ['Unauthorized'] };
    let successCount = 0;
    let errors: string[] = [];

    // Pre-fetch all programs to avoid querying inside the loop
    const existingPrograms = await db.program.findMany({
        select: { id: true, name: true, category: true }
    });

    // Create a map for quick lookup (case-insensitive by name and ID)
    const programMap = new Map<string, { id: string, category: TrainingCategory }>();
    existingPrograms.forEach(p => {
        programMap.set(p.name.toLowerCase().trim(), { id: p.id, category: p.category });
        programMap.set(p.id.toLowerCase().trim(), { id: p.id, category: p.category });
    });

    // Concurrency Control: Serial processing helps avoid deadlocks during bulk upserts
    for (const row of rowData) {
        try {
            // Flexible ID checking
            const empIdRaw = row['Emp.Id'] || row.id || row['Emp ID'] || row['Emp.ID'];
            if (!empIdRaw) {
                errors.push(`Row missing Employee ID: Skipping`);
                continue;
            }

            const empId = empIdRaw.toString().trim();
            const empName = (row['Emp.Name'] || row.name || row['Name'] || '').toString().trim();

            // Handle Email Placeholder
            let emailRaw = (row.email || row['Email'] || row['Email id'] || row['Email ID'])?.toString().trim();
            if (!emailRaw) {
                emailRaw = `${empId}@thriveni.com`; // Unique placeholder email string
            }

            // Validate Gender
            let genderEnum: Gender | null = null;
            const genderRaw = row['Gender'] || row['Sex'] || '';
            if (genderRaw && genderRaw.trim()) {
                const normalizedGender = genderRaw.trim().toUpperCase();
                if (normalizedGender.startsWith('M')) genderEnum = 'MALE';
                else if (normalizedGender.startsWith('F')) genderEnum = 'FEMALE';
                else genderEnum = 'OTHER';
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

            // Parse Dates
            const dobRaw = row['DOB'] || row['Date of Birth'] || '';
            const dob = parseFlexibleDate(dobRaw);

            const dojRaw = row['DOJ'] || row['D.O'] || row['D.O.J'] || row['Date of Joining'] || '';
            const doj = parseFlexibleDate(dojRaw);

            const mobile = (row['Mobile No'] || row['Mobile'] || '')?.toString().trim();
            const managerName = (row['Reporting Manager'] || row['Manager Name'] || '')?.toString().trim();
            const managerId = (row['Manager ID'] || '')?.toString().trim();
            const managerEmail = (row['Manager Email ID'] || row['ManagerEmail ID'] || row['Manager Email'] || '')?.toString().trim();
            const managerMobile = (row['Manager Mobile No'] || row['ManagerMobile No'] || row['Manager Mobile'] || '')?.toString().trim();

            // Sanitized Employee Data Object (excluding email)
            const employeeData = {
                name: empName.substring(0, 100),
                grade: gradeEnum,
                gender: genderEnum,
                designation: row['Designation']?.toString().substring(0, 100) || null,
                sectionName: (row['Section'] || row['Department'])?.toString().substring(0, 100) || null,
                projectLocation: (row['Project Name'] || row['Project Location'])?.toString().substring(0, 100) || null,
                location: (row['Site'] || row['Location'])?.toString().substring(0, 100) || null,
                dob: dob,
                doj: doj,
                mobile: mobile || null,
                managerName: managerName || null,
                managerId: managerId || null,
                managerEmail: managerEmail || null,
                managerMobile: managerMobile || null,
                region: row['Region']?.toString().substring(0, 100) || null,
                organization: row['Organization']?.toString().substring(0, 100) || null,
                highestQualification: row['Highest Qualification']?.toString().substring(0, 100) || null,
                department: row['Department']?.toString().substring(0, 100) || null,
                departmentGroup: row['Department Group']?.toString().substring(0, 100) || null,
                aadharNumber: row['Aadhar Number']?.toString().substring(0, 50) || null,
                employeeGrouupMNmw: (row['Employee Group M/NM/W'] || row['Employee Group (M/NM/W)'])?.toString().substring(0, 50) || null,
                onRollContract: (row['On-Roll / Contract'] || row['On Roll/Contract'])?.toString().substring(0, 50) || null,
                status: (row['Employment Status'] || row['Status'])?.toString().substring(0, 50) || 'Active',
            };

            // Dynamically build update data to allow partial bulk uploads without wiping existing fields
            const hasValue = (val: any) => val !== undefined && val !== null && String(val).trim() !== '';

            const updateData: any = {};
            if (hasValue(row['Emp.Name']) || hasValue(row['name']) || hasValue(row['Name'])) updateData.name = employeeData.name;
            if (hasValue(row['Grade'])) updateData.grade = employeeData.grade;
            if (hasValue(row['Gender']) || hasValue(row['Sex'])) updateData.gender = employeeData.gender;
            if (hasValue(row['Designation'])) updateData.designation = employeeData.designation;
            if (hasValue(row['Section']) || hasValue(row['Department'])) updateData.sectionName = employeeData.sectionName;
            if (hasValue(row['Project Name']) || hasValue(row['Project Location'])) updateData.projectLocation = employeeData.projectLocation;
            if (hasValue(row['Site']) || hasValue(row['Location'])) updateData.location = employeeData.location;
            if (hasValue(row['DOB']) || hasValue(row['Date of Birth'])) updateData.dob = employeeData.dob;
            if (hasValue(row['DOJ']) || hasValue(row['D.O']) || hasValue(row['D.O.J']) || hasValue(row['Date of Joining'])) updateData.doj = employeeData.doj;
            if (hasValue(row['Mobile No']) || hasValue(row['Mobile'])) updateData.mobile = employeeData.mobile;
            if (hasValue(row['Reporting Manager']) || hasValue(row['Manager Name'])) updateData.managerName = employeeData.managerName;
            if (hasValue(row['Manager ID'])) updateData.managerId = employeeData.managerId;
            if (hasValue(row['Manager Email ID']) || hasValue(row['ManagerEmail ID']) || hasValue(row['Manager Email'])) updateData.managerEmail = employeeData.managerEmail;
            if (hasValue(row['Manager Mobile No']) || hasValue(row['ManagerMobile No']) || hasValue(row['Manager Mobile'])) updateData.managerMobile = employeeData.managerMobile;
            if (hasValue(row['Region'])) updateData.region = employeeData.region;
            if (hasValue(row['Organization'])) updateData.organization = employeeData.organization;
            if (hasValue(row['Highest Qualification'])) updateData.highestQualification = employeeData.highestQualification;
            if (hasValue(row['Department'])) updateData.department = employeeData.department;
            if (hasValue(row['Department Group'])) updateData.departmentGroup = employeeData.departmentGroup;
            if (hasValue(row['Aadhar Number'])) updateData.aadharNumber = employeeData.aadharNumber;
            if (hasValue(row['Employee Group M/NM/W']) || hasValue(row['Employee Group (M/NM/W)'])) updateData.employeeGrouupMNmw = employeeData.employeeGrouupMNmw;
            if (hasValue(row['On-Roll / Contract']) || hasValue(row['On Roll/Contract'])) updateData.onRollContract = employeeData.onRollContract;
            if (hasValue(row['Employment Status']) || hasValue(row['Status'])) updateData.status = employeeData.status;
            if (hasValue(row['email']) || hasValue(row['Email id']) || hasValue(row['Email ID']) || hasValue(row['Email'])) updateData.email = emailRaw.substring(0, 100);

            // 1. Upsert Employee
            try {
                await db.employee.upsert({
                    where: { id: empId },
                    update: updateData,
                    create: {
                        id: empId,
                        email: emailRaw.substring(0, 100),
                        ...employeeData
                    }
                });
            } catch (upsertError: any) {
                if (upsertError.code === 'P2002') {
                    throw new Error(`Duplicate email '${emailRaw}' for employee '${empName}'. This email is already in use.`);
                }
                throw upsertError;
            }

            // 2. Process TNI Nominations
            const tniSource = row['TNI Source'] ? row['TNI Source'].toString().trim() : 'BULK';

            // Map Status
            const rawStatus = row['Status-Completed/Cancelled/Open'] ? row['Status-Completed/Cancelled/Open'].toString().trim().toUpperCase() : 'OPEN';
            let tniStatus = 'Pending';
            let managerApprovalStatus = 'Approved'; // Always approve manager status for bulk uploads

            if (rawStatus === 'COMPLETED') {
                tniStatus = 'Completed';
                managerApprovalStatus = 'Approved';
            } else if (rawStatus === 'CANCELLED') {
                tniStatus = 'Absent';
                managerApprovalStatus = 'Rejected';
            }

            // Extract programs from 'Subject Code' or 'Separated  TNI (Technical)'
            let subjectCodesString = row['Subject Code'] ? row['Subject Code'].toString().trim() : '';
            let programsString = row['Separated  TNI (Technical)'] || row['Training Need Identified'] || '';
            programsString = programsString.toString().trim();

            let programIdsToLink = new Set<string>();
            const combinedString = `${subjectCodesString} ${programsString}`;

            // Regex to find standard UUIDs
            const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
            const matches = combinedString.match(uuidRegex);

            if (matches && matches.length > 0) {
                // Scenario A: We found specific Program IDs (UUIDs)
                // We ONLY link these IDs, completely ignoring any extra text/names to prevent fragments.
                for (const code of matches) {
                    const key = code.toLowerCase();
                    if (programMap.has(key)) {
                        programIdsToLink.add(programMap.get(key)!.id);
                    } else {
                        errors.push(`Row Error (${empId}): Program ID '${code}' not found in database.`);
                    }
                }
            } else if (programsString) {
                // Scenario B: No IDs found. Fallback to parsing names separated by comma or hash.
                const programParts = programsString.split(/,|#/);

                for (let rawProgName of programParts) {
                    let progName = rawProgName.trim();
                    if (!progName || progName.includes('(1 Days)') || progName.includes('(2 Days)')) continue;

                    progName = progName.replace(/["']/g, ''); // Remove quotes

                    if (progName.toLowerCase().startsWith('additional programs') || progName.toLowerCase().startsWith('computer skills')) {
                        continue;
                    }

                    const progKey = progName.toLowerCase();

                    if (programMap.has(progKey)) {
                        programIdsToLink.add(programMap.get(progKey)!.id);
                    } else {
                        // Create missing program dynamically
                        let newCategory: TrainingCategory = 'OTHER_PROGRAMS';
                        const programCategory = row['Training Group'] ? row['Training Group'].toString() : '';

                        if (programCategory.toUpperCase().includes('MINING')) {
                            newCategory = 'MINING_PROGRAMS';
                        } else if (programCategory.toUpperCase().includes('HEMM') || programCategory.toUpperCase().includes('FUNCTIONAL')) {
                            newCategory = 'HEMM_PROGRAMS';
                        }

                        const newProg = await db.program.create({
                            data: {
                                name: progName,
                                category: newCategory,
                            }
                        });
                        programMap.set(progKey, { id: newProg.id, category: newCategory });
                        programIdsToLink.add(newProg.id);
                    }
                }
            }

            // Create Nominations for all collected Program IDs
            for (const programId of programIdsToLink) {
                const existingNomination = await db.nomination.findFirst({
                    where: {
                        empId: empId,
                        programId: programId,
                        status: tniStatus
                    }
                });

                if (!existingNomination) {
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

            successCount++;
        } catch (e: any) {
            errors.push(`Row Error (${row['Emp.Id'] || 'Unknown ID'}): ${e.message}`);
        }
    }

    revalidateTag('employee-profile', 'max' as any);
    revalidatePath('/', 'layout');
    return { success: true, count: successCount, errors };
}

