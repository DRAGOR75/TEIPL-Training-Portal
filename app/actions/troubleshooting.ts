'use server';

import { db } from '@/lib/prisma';

export async function getTroubleshootingProducts() {
    try {
        const products = await db.troubleshootingProduct.findMany({
            where: { userView: 1 },
            orderBy: { viewSeq: 'asc' },
        });
        return { success: true, data: products };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: 'Failed to fetch products' };
    }
}

export async function getFaultsForProduct(productId: number) {
    try {
        const productFaults = await db.productFault.findMany({
            where: { productId },
            include: {
                fault: true, // Include the base FaultLibrary details
            },
            orderBy: { viewSeq: 'asc' },
        });

        // Flatten the result for easier consumption? Or just return as is.
        // Returning structured data is better.
        return { success: true, data: productFaults };
    } catch (error) {
        console.error(`Error fetching faults for product ${productId}:`, error);
        return { success: false, error: 'Failed to fetch faults' };
    }
}

export async function getCausesForFault(productFaultId: string) {
    try {
        // 1. Get the ProductFault details first (for "Machine Notes")
        const productFault = await db.productFault.findUnique({
            where: { id: productFaultId },
            include: {
                product: true,
                fault: true,
            }
        });

        if (!productFault) {
            return { success: false, error: 'Fault context not found' };
        }

        // 2. Get the Causes ordered by sequence
        const faultCauses = await db.faultCause.findMany({
            where: { productFaultId },
            include: {
                cause: true, // Include the remedy details
            },
            orderBy: { seq: 'asc' },
        });

        return {
            success: true,
            data: {
                context: productFault,
                sequence: faultCauses
            }
        };
    } catch (error) {
        console.error(`Error fetching causes for fault ${productFaultId}:`, error);
        return { success: false, error: 'Failed to fetch diagnostic sequence' };
    }
}
