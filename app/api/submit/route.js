import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { appendToSheet } from '@/lib/sheets';
import { sendApprovalEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            nominatorName, nominatorEmail,
            empId, nomineeName, site, designation,
            managerName, managerEmail,
            nomineeEmail, mobile, experience,
            justification
        } = body;

        // 1. Basic Validation
        if (!nominatorEmail || !managerEmail || !nomineeName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Database: Check or Create User (Nominator)
        let userRes = await query('SELECT user_id FROM users WHERE email = $1', [nominatorEmail]);
        let userId;

        if (userRes.rows.length === 0) {
            const newUser = await query(
                'INSERT INTO users (email, full_name) VALUES ($1, $2) RETURNING user_id',
                [nominatorEmail, nominatorName]
            );
            userId = newUser.rows[0].user_id;
        } else {
            userId = userRes.rows[0].user_id;
        }

        // 3. Database: Insert Nomination
        const insertRes = await query(
            `INSERT INTO nominations (
          user_id, nominee_emp_id, nominee_name, nominee_site, nominee_designation,
          manager_name, manager_email, nominee_email, nominee_mobile, nominee_experience,
          justification, status, category
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending Manager', 'General')
       RETURNING nomination_id`, // <--- Added RETURNING to get ID
            [userId, empId, nomineeName, site, designation, managerName, managerEmail, nomineeEmail, mobile, experience, justification]
        );

        const newNominationId = insertRes.rows[0].nomination_id;

        // 4. Google Sheets: Append Row (CORRECTED KEYS to match lib/sheets.js)
        await appendToSheet({
            nomination_id: newNominationId,
            empId,              // was missing
            nomineeName,        // was nominee_name
            site,               // was missing
            designation,        // was missing
            nomineeEmail,       // was missing
            mobile,             // was missing
            experience,         // was missing
            justification,
            nominator_email: nominatorEmail,
        });

        // 5. Send Email to Manager
        // This function needs to be checked next!
        await sendApprovalEmail(managerEmail, managerName, nomineeName, justification);

        return NextResponse.json({ message: 'Success' }, { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}