'use server';

import { db } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';

export async function saveDailyAttendance(sessionId: string, empId: string, date: Date, status: string) {
    const session = await auth();
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Strip time from date to avoid timezone matching issues
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        await db.attendanceRecord.upsert({
            where: {
                sessionId_empId_date: {
                    sessionId,
                    empId,
                    date: dateOnly
                }
            },
            update: { status },
            create: {
                sessionId,
                empId,
                date: dateOnly,
                status
            }
        });

        revalidatePath(`/admin/sessions/${sessionId}/manage`);
        revalidateTag('session-details', 'max');
        return { success: true };
    } catch (error) {
        console.error("Failed to save attendance", error);
        return { success: false, error: "Database Error" };
    }
}

export async function updateSessionClassDates(sessionId: string, classDates: Date[]) {
    const session = await auth();
    if (!session?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const existingSession = await db.trainingSession.findUnique({
            where: { id: sessionId },
            select: { classDates: true, nominationBatchId: true }
        });

        // Strip time to keep dates consistent
        const cleanDates = classDates.map(d => {
            const newD = new Date(d);
            newD.setHours(0, 0, 0, 0);
            return newD;
        });

        await db.trainingSession.update({
            where: { id: sessionId },
            data: { classDates: cleanDates }
        });

        if (existingSession && existingSession.nominationBatchId) {
            const existingDatesStr = existingSession.classDates.map((d: any) => d.toISOString().split('T')[0]);
            const addedDates = cleanDates.filter(d => !existingDatesStr.includes(d.toISOString().split('T')[0]));

            if (addedDates.length > 0) {
                // Fetch active participants
                const nominations = await db.nomination.findMany({
                    where: {
                        batchId: existingSession.nominationBatchId,
                        status: { not: 'Absent' }
                    },
                    select: { empId: true }
                });

                if (nominations.length > 0) {
                    const attendanceRecordsData = [];
                    for (const date of addedDates) {
                        for (const nom of nominations) {
                            attendanceRecordsData.push({
                                sessionId: sessionId,
                                empId: nom.empId,
                                date: date,
                                status: 'Present'
                            });
                        }
                    }

                    await db.attendanceRecord.createMany({
                        data: attendanceRecordsData,
                        skipDuplicates: true
                    });
                }
            }
        }

        revalidatePath(`/admin/sessions/${sessionId}/manage`);
        revalidateTag('session-details', 'max');
        return { success: true };
} catch (error) {
        console.error("Failed to update class dates", error);
        return { success: false, error: "Database Error" };
    }
}

export async function finalizeParticipantTraining(
    sessionId: string,
    batchId: string,
    empId: string,
    finalStatus: 'Completed' | 'Absent',
    attendancePercentage: number
) {
    const sessionUser = await auth();
    if (!sessionUser?.user?.email && process.env.NODE_ENV !== 'development') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const session = await db.trainingSession.findUnique({
            where: { id: sessionId },
            include: { nominationBatch: true }
        });

        if (!session) return { success: false, error: "Session not found" };

        const emp = await db.employee.findUnique({ where: { id: empId } });
        if (!emp) return { success: false, error: "Employee not found" };

        const prog = await db.program.findUnique({ where: { name: session.programName }, select: { category: true } });
        const progCategory = prog?.category ?? null;

        const start = new Date(session.startDate);
        const end = new Date(session.endDate);
        const trainingDays = session.trainingDays || Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

        // Mark Nomination as finalStatus (Completed or Absent)
        await db.nomination.updateMany({
            where: { empId, batchId },
            data: { status: finalStatus }
        });

        // Create or update System Training History
        const existingHistory = await db.systemTrainingHistory.findFirst({
            where: { empId, sessionId }
        });

        const monthStr = start.toLocaleString('en-US', { month: 'short' });
        const fullYear = start.getFullYear();
        const currentMonth = start.getMonth(); // 0-11
        
        let startYear, endYear;
        if (currentMonth < 3) { // Jan, Feb, Mar belong to previous financial year
            startYear = fullYear - 1;
            endYear = fullYear;
        } else { // Apr-Dec belong to current financial year
            startYear = fullYear;
            endYear = fullYear + 1;
        }
        
        const yearStr = `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;

        if (!existingHistory) {
            await db.systemTrainingHistory.create({
                data: {
                    empId: empId,
                    employeeName: emp.name,
                    programName: session.programName,
                    startDate: session.startDate,
                    endDate: session.endDate,
                    trainingDays: trainingDays > 0 ? trainingDays : null,
                    trainingHours: session.trainingHours || null,
                    employeeRegion: emp.region,
                    employeeLocation: emp.location,
                    progCategory: progCategory,

                    organization: emp.organization,
                    onRollContract: emp.onRollContract,
                    department: emp.department,
                    departmentGroup: emp.departmentGroup,
                    employeeGroup: emp.departmentGroup, // keeping for backwards compatibility if needed
                    employeeGrouupMNmw: emp.employeeGrouupMNmw,
                    aadharNumber: emp.aadharNumber,
                    designation: emp.designation,
                    section: emp.sectionName,
                    month: monthStr,
                    year: yearStr,
                    gender: emp.gender,
                    location: session.location || emp.location,
                    programRegion: session.region,
                    programAddress: session.trainingLocationAddress,
                    sessionId: sessionId,
                    trainerName: session.trainerName,
                    attendancePercentage: attendancePercentage,
                    status: finalStatus,
                    sessionCategory: session.sessionCategory,
                    altProgramName: session.altProgramName
                }
            });
        } else {
            await db.systemTrainingHistory.update({
                where: { id: existingHistory.id },
                data: { 
                    attendancePercentage: attendancePercentage,
                    status: finalStatus,
                    trainingHours: session.trainingHours || null,
                    programName: session.programName,
                    sessionCategory: session.sessionCategory,
                    progCategory: progCategory,
                    altProgramName: session.altProgramName
                }
            });
        }

        revalidatePath(`/admin/sessions/${sessionId}/manage`);
        revalidateTag('session-details', 'max');
        return { success: true };
    } catch (error) {
        console.error("Failed to finalize participant", error);
        return { success: false, error: "Database Error" };
    }
}
