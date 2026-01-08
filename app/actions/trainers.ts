'use server'

import { db } from '@/lib/prisma';
import { revalidatePath } from "next/cache";

// 1. Fetch All Trainers
export async function getTrainers() {
    return await db.trainer.findMany({
        orderBy: { name: 'asc' }
    });
}

// 2. Add a New Trainer (Updated for new schema)
export async function addTrainer(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    // Validation
    if (!name || !email) {
        return { error: "Name and Email are required." };
    }

    try {
        await db.trainer.create({
            data: {
                name,
                email,
                phone
            }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error: any) {
        // Handle unique constraint error for email
        if (error.code === 'P2002') {
            return { error: "A trainer with this email already exists." };
        }
        return { error: "Failed to add trainer." };
    }
}

// 3. Delete a Trainer
export async function deleteTrainer(id: string) {
    try {
        await db.trainer.delete({
            where: { id }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete trainer." };
    }
}