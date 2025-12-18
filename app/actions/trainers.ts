'use server'

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. Fetch All Trainers
export async function getTrainers() {
    return await db.trainer.findMany({
        orderBy: { name: 'asc' }
    });
}

// 2. Add a New Trainer
export async function addTrainer(formData: FormData) {
    const name = formData.get("name") as string;
    const expertise = formData.get("expertise") as string;

    if (!name) return { error: "Name is required" };

    try {
        await db.trainer.create({
            data: { name, expertise }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        return { error: "Failed to add trainer." };
    }
}

// 3. Delete a Trainer
export async function deleteTrainer(id: string) {
    try {
        await db.trainer.delete({ where: { id } });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete" };
    }
}