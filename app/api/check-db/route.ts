import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const totalCount = await db.qualifications.count();
        const emptyMaxMarks = await db.qualifications.count({ where: { maxMarks: null } });
        const emptyObtainedMarks = await db.qualifications.count({ where: { obtainedMarks: null } });
        const emptyDates = await db.qualifications.count({ where: { testDate: null } });
        
        return NextResponse.json({
            totalCount,
            emptyMaxMarks,
            emptyObtainedMarks,
            emptyDates
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
