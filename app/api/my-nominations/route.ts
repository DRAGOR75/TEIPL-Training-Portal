
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
        const nominations = await db.nomination.findMany({
            where: {
                employeeEmail: {
                    equals: email,
                    mode: 'insensitive' // Case-insensitive search
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform data to match frontend interface
        const formattedNominations = nominations.map(nom => ({
            nomination_id: nom.id,
            nominee_name: nom.employeeName,
            category: nom.programName,
            nominee_site: nom.site,
            status: nom.status,
            submitted_at: nom.createdAt.toISOString()
        }));

        return NextResponse.json({ nominations: formattedNominations });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch nominations' }, { status: 500 });
    }
}
