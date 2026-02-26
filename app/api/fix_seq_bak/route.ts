import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET() {
    try {
        const productResult = await db.$queryRawUnsafe(`SELECT MAX(id) FROM troubleshooting_products;`);
        const productMaxId = Number((productResult as any)[0].max) || 0;

        let msg = '';
        if (productMaxId > 0) {
            await db.$executeRawUnsafe(`SELECT setval('troubleshooting_products_id_seq', ${productMaxId})`);
            msg += `troubleshooting_products_id_seq set to ${productMaxId}. `;
        }

        const fbResult = await db.$queryRawUnsafe(`SELECT MAX(id) FROM troubleshooting_feedback;`);
        const fbMaxId = Number((fbResult as any)[0].max) || 0;

        if (fbMaxId > 0) {
            await db.$executeRawUnsafe(`SELECT setval('troubleshooting_feedback_id_seq', ${fbMaxId})`);
            msg += `troubleshooting_feedback_id_seq set to ${fbMaxId}.`;
        }

        return NextResponse.json({ success: true, message: msg || 'No updates needed.' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
