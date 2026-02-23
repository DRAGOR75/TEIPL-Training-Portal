
import { db } from "@/lib/prisma";

/**
 * Checks if a specific action key has exceeded the rate limit.
 * Uses a database-backed Token Bucket / Fixed Window approach.
 * 
 * @param key Unique key for the limiter (e.g., "approve:managerId:ip")
 * @param limit Max allowed requests in the window
 * @param windowSeconds Window duration in seconds
 * @returns { success: boolean }
 */
export async function checkRateLimit(key: string, limit: number = 5, windowSeconds: number = 60) {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

    try {
        // Simple Fixed Window Counter in DB
        // 1. Clean up expired limits (OPTIONAL - handled by overwrite or cron, keeping it simple here)
        // For simplicity in "just add code", we upsert.

        // Transaction to ensure atomicity
        const result = await db.$transaction(async (tx) => {
            // Check existing
            let record = await tx.rateLimit.findUnique({
                where: { key }
            });

            // If not exists or expired, reset
            if (!record || record.expiresAt < now) {
                record = await tx.rateLimit.upsert({
                    where: { key },
                    update: {
                        count: 1,
                        expiresAt: windowEnd
                    },
                    create: {
                        key,
                        count: 1,
                        expiresAt: windowEnd
                    }
                });
                return { success: true, count: 1 };
            }

            // If exists and valid, increment
            if (record.count >= limit) {
                return { success: false, count: record.count };
            }

            const updated = await tx.rateLimit.update({
                where: { key },
                data: {
                    count: { increment: 1 }
                }
            });

            return { success: true, count: updated.count };
        });

        return result;

    } catch (error) {
        console.warn(`[RateLimit] Failed to check limit for ${key}:`, error);
        // Fail open to avoid blocking legit users on DB error
        return { success: true, count: 0 };
    }
}
