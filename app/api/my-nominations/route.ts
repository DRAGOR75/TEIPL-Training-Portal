// app/api/my-nominations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    try {
        // 1. Find the user ID for this email
        const userRes = await query('SELECT user_id FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) {
            return NextResponse.json({ nominations: [] }); // User not found, return empty list
        }

        const userId = userRes.rows[0].user_id;

        // 2. Get all nominations for this user
        const nominations = await query(
            `SELECT * FROM nominations WHERE user_id = $1 ORDER BY submitted_at DESC`,
            [userId]
        );

        return NextResponse.json({ nominations: nominations.rows });

    } catch (error) {
        console.error('Fetch Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}