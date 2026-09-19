'use server';

import { db } from '@/lib/prisma';
import { cookies, headers } from 'next/headers';
import { randomUUID } from 'crypto';

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

export async function logTroubleshootingEvent(type: string) {
    try {
        await db.troubleshootingEvent.create({
            data: {
                type
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log event:", error);
        return { success: false, error: "Failed to log event" };
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

export async function logTroubleshootingVisit(params: {
    path?: string;
    productId?: number;
    productName?: string;
    faultId?: string;
    faultName?: string;
}) {
    try {
        const cookieStore = await cookies();
        let sessionId = cookieStore.get('hemmts_visitor_id')?.value;
        if (!sessionId) {
            sessionId = randomUUID();
            cookieStore.set('hemmts_visitor_id', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 60, // 60 days
                path: '/',
            });
        }

        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';
        
        let device = 'Desktop';
        if (/mobile/i.test(userAgent)) device = 'Mobile';
        else if (/tablet|ipad/i.test(userAgent)) device = 'Tablet';

        let browser = 'Other';
        if (/chrome|crios/i.test(userAgent) && !/edge|edg|opr/i.test(userAgent)) browser = 'Chrome';
        else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browser = 'Safari';
        else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
        else if (/edg/i.test(userAgent)) browser = 'Edge';

        await db.troubleshootingVisit.create({
            data: {
                sessionId,
                path: params.path || '/',
                productId: params.productId || null,
                productName: params.productName || null,
                faultId: params.faultId || null,
                faultName: params.faultName || null,
                device,
                browser
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Telemetry logging error:", error);
        return { success: false };
    }
}

export async function getTroubleshootingAnalytics() {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalVisits,
            visitsToday,
            visits7Days,
            visits30Days,
            rawUniqueAll,
            rawUniqueToday,
            rawUnique7Days,
            topProductsRaw,
            topFaultsRaw,
            deviceStatsRaw,
            recentVisits,
            feedbackStats
        ] = await Promise.all([
            db.troubleshootingVisit.count(),
            db.troubleshootingVisit.count({ where: { createdAt: { gte: startOfToday } } }),
            db.troubleshootingVisit.count({ where: { createdAt: { gte: startOf7Days } } }),
            db.troubleshootingVisit.count({ where: { createdAt: { gte: startOf30Days } } }),
            db.troubleshootingVisit.findMany({ select: { sessionId: true }, distinct: ['sessionId'] }),
            db.troubleshootingVisit.findMany({ where: { createdAt: { gte: startOfToday } }, select: { sessionId: true }, distinct: ['sessionId'] }),
            db.troubleshootingVisit.findMany({ where: { createdAt: { gte: startOf7Days } }, select: { sessionId: true }, distinct: ['sessionId'] }),
            db.troubleshootingVisit.groupBy({
                by: ['productName'],
                _count: { _all: true },
                where: { productName: { not: null } },
                orderBy: { _count: { productName: 'desc' } },
                take: 6
            }),
            db.troubleshootingVisit.groupBy({
                by: ['faultName'],
                _count: { _all: true },
                where: { faultName: { not: null } },
                orderBy: { _count: { faultName: 'desc' } },
                take: 6
            }),
            db.troubleshootingVisit.groupBy({
                by: ['device'],
                _count: { _all: true },
                orderBy: { _count: { device: 'desc' } }
            }),
            db.troubleshootingVisit.findMany({
                take: 25,
                orderBy: { createdAt: 'desc' }
            }),
            db.troubleshootingFeedback.aggregate({
                _count: { _all: true },
                _avg: { rating: true }
            })
        ]);

        return {
            success: true,
            data: {
                totalVisits,
                visitsToday,
                visits7Days,
                visits30Days,
                uniqueAll: rawUniqueAll.length,
                uniqueToday: rawUniqueToday.length,
                unique7Days: rawUnique7Days.length,
                topProducts: topProductsRaw.map(p => ({ name: p.productName || 'Unknown', count: p._count._all })),
                topFaults: topFaultsRaw.map(f => ({ name: f.faultName || 'Unknown', count: f._count._all })),
                deviceStats: deviceStatsRaw.map(d => ({ device: d.device || 'Desktop', count: d._count._all })),
                recentVisits,
                feedbackCount: feedbackStats._count._all,
                feedbackRating: feedbackStats._avg.rating ? Number(feedbackStats._avg.rating.toFixed(1)) : 5.0
            }
        };
    } catch (error) {
        console.error("Error fetching troubleshooting analytics:", error);
        return { success: false, error: 'Failed to fetch analytics' };
    }
}
