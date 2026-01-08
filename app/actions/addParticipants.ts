'use server'

import { db } from '@/lib/prisma'; // Ensure this points to your prisma client
import { revalidatePath } from "next/cache";

export type ParticipantData = {
    name: string;
    email: string;
    managerEmail: string;
};

export async function addParticipants(sessionId: string, participants: ParticipantData[]) {
    try {
        // 1. Check if session exists
        if (!sessionId) return { success: false, error: "Session ID missing" };

        // 2. Bulk Insert
        // skipDuplicates: true will ignore emails that are already in this session
        await db.enrollment.createMany({
            data: participants.map((p) => ({
                sessionId,
                employeeName: p.name,
                employeeEmail: p.email,
                managerEmail: p.managerEmail,
                status: "Pending",
            })),
            skipDuplicates: true,
        });

        // 3. Refresh the page so you see the new numbers immediately
        revalidatePath("/admin/dashboard");

        return { success: true, count: participants.length };
    } catch (error) {
        console.error("Error adding participants:", error);
        return { success: false, error: "Failed to save to database." };
    }
}