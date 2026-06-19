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

        revalidatePath(`/admin/sessions/${sessionId}/manage`);
        revalidateTag('session-details', 'max');
        return { success: true };
    } catch (error) {
        console.error("Failed to update class dates", error);
        return { success: false, error: "Database Error" };
    }
}
