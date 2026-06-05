'use server';

import { db } from '@/lib/prisma';
import { revalidateTag, unstable_cache } from 'next/cache';
import { auth } from '@/auth';

export const getSystemSetting = unstable_cache(
    async (key: string, defaultValue: string) => {
        try {
            const setting = await db.systemSetting.findUnique({ where: { key } });
            return setting ? setting.value : defaultValue;
        } catch (error) {
            console.error('Failed to get system setting:', error);
            return defaultValue;
        }
    },
    ['system-settings'],
    { tags: ['system-settings'] }
);

export async function updateSystemSetting(key: string, value: string) {
    const session = await auth();
    // Verify admin privileges
    if (session?.user?.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await db.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        
        revalidateTag('system-settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update system setting:', error);
        return { success: false, error: 'Failed to update setting' };
    }
}
