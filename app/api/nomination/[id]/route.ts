import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
// We don't import the sheet helper here anymore because we aren't using it
// import { updateNominationInSheet } from '@/lib/sheets'; 

// 1. GET: Fetch a single nomination by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const res = await query('SELECT * FROM nominations WHERE nomination_id = $1', [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json(res.rows[0]);
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// 2. PUT: Update the nomination details
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();

    console.log(`[API] 🟡 Received UPDATE request for ID: ${id}`);

    const {
        empId, nomineeName, site, designation,
        nomineeEmail, mobile, experience, justification
    } = body;

    try {
        // STEP A: Update Database ONLY
        console.log(`[DB] ⏳ Executing SQL UPDATE for ID: ${id}...`);

        const result = await query(
            `UPDATE nominations 
             SET nominee_emp_id = $1, 
                 nominee_name = $2, 
                 nominee_site = $3, 
                 nominee_designation = $4, 
                 nominee_email = $5, 
                 nominee_mobile = $6, 
                 nominee_experience = $7, 
                 justification = $8
             WHERE nomination_id = $9`,
            [empId, nomineeName, site, designation, nomineeEmail, mobile, experience, justification, id]
        );

        if (result.rowCount === 0) {
            console.warn(`[DB] ⚠️ Update ran, but NO row was found with ID: ${id}`);
            return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
        } else {
            console.log(`[DB] ✅ Database updated successfully.`);
        }

        // ❌ REMOVED: We are NOT updating the Google Sheet here. 
        // We assume the sheet is either not created yet, or you don't want edits synced.

        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        console.error(`[DB] ❌ CRITICAL ERROR updating ID ${id}:`, error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}