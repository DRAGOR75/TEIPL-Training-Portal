'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// Removed logging for performance

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
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') {
            return { error: 'Machine with this name already exists.' };
        }
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

export async function updateTroubleshootingProduct(id: number, data: { name: string; viewSeq: number }) {
    try {
        if (!data.name) return { error: 'Product Name is required' };

        await db.troubleshootingProduct.update({
            where: { id },
            data: {
                name: data.name,
                viewSeq: data.viewSeq
            }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') {
            return { error: 'Machine with this name already exists.' };
        }
        return { error: 'Failed to update product' };
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


export async function updateFaultLibraryItem(id: string, data: { name: string; faultCode: string; viewSeq: number }) {
    try {
        if (!data.name) return { error: 'Fault Name is required' };

        await db.faultLibrary.update({
            where: { id },
            data: {
                name: data.name,
                faultCode: data.faultCode || null,
                viewSeq: data.viewSeq
            }
        });

        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to update fault' };
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

export async function updateProductFault(id: string, data: { viewSeq: number }) {
    try {
        await db.productFault.update({
            where: { id },
            data: {
                viewSeq: data.viewSeq
            }
        });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to update fault sequence' };
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

export async function toggleFaultCauseStatus(id: string, isActive: boolean) {
    try {
        await db.faultCause.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath(ADMIN_PATH);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to update status' };
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
    const faultLib = await db.faultLibrary.findMany({ orderBy: { viewSeq: 'asc' } });
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

// --- 6. Bulk Upload ---

export type BulkUploadRow = {
    machineName: string;
    productSeq?: number;
    keywords?: string;

    faultName?: string;
    faultId?: string;      // New: Legacy Fault ID (FaultID) from CSV
    faultCode?: string;
    faultViewSeq?: number; // New
    notes?: string;        // New

    productId?: string;    // New: Legacy Product ID (ProdID)

    causeName?: string;
    action?: string;
    symptoms?: string;
    manualRef?: string;
    seq?: number;
};

export async function bulkUploadTroubleshooting(rows: BulkUploadRow[]) {
    try {
        let count = 0;
        // Map to track the next sequence number for each ProductFault (Key: ProductFaultID, Value: NextSeq)
        const sequenceMap = new Map<string, number>();

        // CACHE: Track IDs we've already processed/created in this batch to avoid redundant DB calls
        // CACHE: Track IDs we've already processed/created in this batch to avoid redundant DB calls
        const processedProducts = new Map<string, number>(); // Key: Name/LegacyID -> Value: DB_ID (Int)
        const processedFaults = new Map<string, { id: string, legacyId?: string }>(); // Key: Name/LegacyID -> Value: Object

        // OPTIMIZATION: Pre-fetch existing data to minimize DB lookups
        const [allProducts, allFaults] = await Promise.all([
            db.troubleshootingProduct.findMany({ select: { id: true, name: true, legacyId: true } }),
            db.faultLibrary.findMany({ select: { id: true, name: true, legacyId: true } })
        ]);

        // Populate Cache
        allProducts.forEach(p => {
            processedProducts.set(p.name, p.id);
            if (p.legacyId) processedProducts.set(p.legacyId, p.id);
        });

        allFaults.forEach(f => {
            const fObj = { id: f.id, legacyId: f.legacyId || undefined };
            processedFaults.set(f.name, fObj);
            if (f.legacyId) processedFaults.set(f.legacyId, fObj);
        });

        for (const row of rows) {
            // --- Step 1: Determine Target Context (Which Product-Faults?) ---
            let targetProductFaults: any[] = [];
            let fault: any = null;

            if (row.machineName || row.productId) {
                // A. Specific Machine Context
                let product: any = null;
                const prodKey = row.productId || row.machineName;

                if (prodKey && processedProducts.has(prodKey)) {
                    // CACHE HIT: Use existing ID without DB Call
                    product = { id: processedProducts.get(prodKey) };
                } else {
                    // CACHE MISS: Perform DB Upsert/Lookup
                    if (row.machineName) {
                        product = await db.troubleshootingProduct.upsert({
                            where: { name: row.machineName },
                            update: {
                                viewSeq: row.productSeq ?? undefined,
                                keywords: row.keywords && !row.faultName ? row.keywords : undefined,
                                legacyId: row.productId ? String(row.productId) : undefined
                            },
                            create: {
                                name: row.machineName,
                                viewSeq: row.productSeq || 99,
                                keywords: row.keywords,
                                legacyId: row.productId ? String(row.productId) : undefined
                            }
                        });
                    } else if (row.productId) {
                        product = await db.troubleshootingProduct.findUnique({ where: { legacyId: String(row.productId) } });
                    }

                    // Update Cache
                    if (product) {
                        if (row.machineName) processedProducts.set(row.machineName, product.id);
                        if (row.productId) processedProducts.set(row.productId, product.id);
                    }
                }

                if (product && (row.faultName || row.faultId)) {
                    const faultKey = row.faultId || row.faultName;

                    if (faultKey && processedFaults.has(faultKey)) {
                        // CACHE HIT
                        fault = processedFaults.get(faultKey);
                    } else {
                        // CACHE MISS
                        // Try finding fault by ID first (more precise), then Name
                        if (row.faultId) {
                            fault = await db.faultLibrary.findUnique({ where: { legacyId: String(row.faultId) } });
                        }
                        if (!fault && row.faultName) {
                            fault = await db.faultLibrary.upsert({
                                where: { name: row.faultName },
                                update: {
                                    faultCode: row.faultCode || undefined,
                                    legacyId: row.faultId ? String(row.faultId) : undefined
                                },
                                create: {
                                    name: row.faultName,
                                    faultCode: row.faultCode,
                                    legacyId: row.faultId ? String(row.faultId) : undefined
                                }
                            });
                        }

                        // Update Cache
                        if (fault) {
                            const faultObj = { id: fault.id, legacyId: fault.legacyId };
                            if (row.faultName) processedFaults.set(row.faultName, faultObj);
                            if (row.faultId) processedFaults.set(row.faultId, faultObj);
                            if (fault.legacyId) processedFaults.set(fault.legacyId, faultObj);
                        }
                    }

                    if (fault) {
                        // Link Product <-> Fault (Ideally cache this too, but upsert is relatively fast for join table if indexed)
                        // For now, keeping upsert to ensure 'viewSeq' updates are captured if they change row-to-row
                        const pf = await db.productFault.upsert({
                            where: { productId_faultId: { productId: product.id, faultId: fault.id } },
                            update: {
                                viewSeq: row.faultViewSeq ?? undefined,
                                notes: row.notes ?? undefined,
                                keywords: row.keywords ?? undefined
                            },
                            create: {
                                productId: product.id,
                                faultId: fault.id,
                                viewSeq: row.faultViewSeq || 99,
                                notes: row.notes,
                                keywords: row.keywords
                            }
                        });
                        targetProductFaults.push(pf);
                    }
                }
            } else if (row.faultId) {
                // B. Broadcast Context
                const faultKey = row.faultId;
                if (processedFaults.has(faultKey)) {
                    fault = processedFaults.get(faultKey);
                } else {
                    fault = await db.faultLibrary.findUnique({ where: { legacyId: String(row.faultId) } });
                    if (fault) {
                        const faultObj = { id: fault.id, legacyId: fault.legacyId };
                        processedFaults.set(row.faultId, faultObj);
                        if (fault.name) processedFaults.set(fault.name, faultObj);
                    }
                }

                if (fault) {
                    targetProductFaults = await db.productFault.findMany({
                        where: { faultId: fault.id }
                    });
                }
            }

            // If we found no targets so far, skip
            if (targetProductFaults.length === 0) {
                // Try counting it if it was just a Product update
                if (row.machineName && !row.faultName) count++;
                continue;
            }

            // --- Step 2: Ensure Cause Exists (Once) ---
            if (!row.causeName) {
                count++; // Valid processing for Product/Fault only rows
                continue;
            }

            const cause = await db.causeLibrary.upsert({
                where: { name: row.causeName },
                update: {
                    action: row.action,
                    symptoms: row.symptoms,
                    manualRef: row.manualRef
                },
                create: {
                    name: row.causeName,
                    action: row.action,
                    symptoms: row.symptoms,
                    manualRef: row.manualRef
                }
            });

            // --- Step 3: Link Cause to ALL Targets ---
            for (const pf of targetProductFaults) {
                // Determine sequence: Use explicitly provided seq, or auto-increment based on ProductFault context
                const nextSeq = sequenceMap.get(pf.id) ?? 1;
                const finalSeq = row.seq ?? nextSeq;

                // Update map for next time this ProductFault is encountered
                sequenceMap.set(pf.id, finalSeq + 1);

                await db.faultCause.upsert({
                    where: { productFaultId_causeId: { productFaultId: pf.id, causeId: cause.id } },
                    update: { seq: finalSeq },
                    create: {
                        productFaultId: pf.id,
                        causeId: cause.id,
                        seq: finalSeq
                    }
                });
            }

            count++;
        }

        revalidatePath(ADMIN_PATH);
        return { success: true, count };
    } catch (e) {
        console.error('Bulk upload error:', e);
        return { error: 'Failed to process bulk upload. Check server logs.' };
    }
}
