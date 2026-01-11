'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const ADMIN_PATH = '/admin/troubleshooting';

// --- 1. Product Management ---

export async function createTroubleshootingProduct(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const viewSeq = parseInt(formData.get('viewSeq') as string) || 99;

        if (!name) return { error: 'Product Name is required' };

        await db.troubleshootingProduct.create({
            data: { name, viewSeq }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to create product' };
    }
}

export async function deleteTroubleshootingProduct(id: number) {
    try {
        await db.troubleshootingProduct.delete({ where: { id } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to delete product' };
    }
}

// --- 2. Fault Library Management ---

export async function createFaultLibraryItem(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const faultCode = formData.get('faultCode') as string || null;

        if (!name) return { error: 'Fault Name is required' };

        await db.faultLibrary.create({
            data: { name, faultCode }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to create fault' };
    }
}

export async function deleteFaultLibraryItem(id: string) {
    try {
        await db.faultLibrary.delete({ where: { id } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to delete fault' };
    }
}

// --- 3. Cause Library Management ---

export async function createCauseLibraryItem(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const action = formData.get('action') as string || '';
        const symptoms = formData.get('symptoms') as string || '';
        const manualRef = formData.get('manualRef') as string || '';

        if (!name) return { error: 'Check/Cause Name is required' };

        await db.causeLibrary.create({
            data: { name, action, symptoms, manualRef }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to create cause' };
    }
}

export async function deleteCauseLibraryItem(id: string) {
    try {
        await db.causeLibrary.delete({ where: { id } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to delete cause' };
    }
}

// --- 4. Product <-> Fault Linking ---

export async function linkFaultToProduct(productId: number, faultId: string) {
    try {
        await db.productFault.create({
            data: {
                productId,
                faultId
            }
        });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to link fault' };
    }
}

export async function unlinkFaultFromProduct(productFaultId: string) {
    try {
        await db.productFault.delete({ where: { id: productFaultId } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to unlink fault' };
    }
}

// --- 5. Diagnostic Sequencing (Fault <-> Cause) ---

export async function addCauseToSequence(productFaultId: string, causeId: string, seq: number) {
    try {
        await db.faultCause.create({
            data: {
                productFaultId,
                causeId,
                seq
            }
        });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to add step to sequence' };
    }
}

export async function removeCauseFromSequence(id: string) {
    try {
        await db.faultCause.delete({ where: { id } });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to remove step' };
    }
}

export async function updateSequenceOrder(items: { id: string; seq: number }[]) {
    try {
        // Run in transaction for safety
        await db.$transaction(
            items.map((item) =>
                db.faultCause.update({
                    where: { id: item.id },
                    data: { seq: item.seq }
                })
            )
        );
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to reorder sequence' };
    }
}

// --- Fetchers for Admin UI ---

export async function getAdminData() {
    const products = await db.troubleshootingProduct.findMany({ orderBy: { viewSeq: 'asc' } });
    const faultLib = await db.faultLibrary.findMany({ orderBy: { name: 'asc' } });
    const causeLib = await db.causeLibrary.findMany({ orderBy: { name: 'asc' } });

    return { products, faultLib, causeLib };
}

export async function getProductFaults(productId: number) {
    return db.productFault.findMany({
        where: { productId },
        include: { fault: true },
        orderBy: { viewSeq: 'asc' }
    });
}

export async function getSequence(productFaultId: string) {
    return db.faultCause.findMany({
        where: { productFaultId },
        include: { cause: true },
        orderBy: { seq: 'asc' }
    });
}
