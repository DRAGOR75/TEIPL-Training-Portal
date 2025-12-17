import { google } from 'googleapis';

// --- 1. SETUP AUTHENTICATION ---
async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

// --- 2. APPEND (CREATE NEW) ---
export async function appendToSheet(data) {
    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet1!A:L', // Expanded to L to include Status
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    data.nomination_id,      // Col A: ID
                    data.empId,              // Col B: Emp ID
                    data.nomineeName,        // Col C: Name
                    data.site,               // Col D: Site
                    data.designation,        // Col E: Designation
                    data.nomineeEmail,       // Col F: Email
                    data.mobile,             // Col G: Mobile
                    data.experience,         // Col H: Experience
                    data.justification,      // Col I: Justification
                    data.nominator_email,    // Col J: Nominator
                    new Date().toISOString(),// Col K: Time
                    'Pending Manager'        // Col L: Initial Status (Default)
                ]],
            },
        });
        return response.data;
    } catch (error) {
        console.error('Google Sheets Append Error:', error);
    }
}

// --- 3. HELPER: FIND ROW BY ID ---
async function findRowById(sheets, id) {
    try {
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet1!A:A',
        });

        const rows = result.data.values;
        if (!rows || rows.length === 0) return null;

        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] == id) {
                return i + 1;
            }
        }
        return null;
    } catch (error) {
        console.error('Error finding row:', error);
        return null;
    }
}

// --- 4. UPDATE EXISTING ROW (For Edits) ---
export async function updateNominationInSheet(id, newData) {
    try {
        const sheets = await getSheetsClient();
        const rowNumber = await findRowById(sheets, id);

        if (!rowNumber) {
            console.error(`Row with ID ${id} not found in Sheet.`);
            return;
        }

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Sheet1!B${rowNumber}:I${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    newData.empId,
                    newData.nomineeName,
                    newData.site,
                    newData.designation,
                    newData.nomineeEmail,
                    newData.mobile,
                    newData.experience,
                    newData.justification
                ]],
            },
        });

        return response.data;
    } catch (error) {
        console.error('Google Sheets Update Error:', error);
        throw error;
    }
}

// --- 5. NEW: UPDATE STATUS (Robust Match) ---
export async function updateSheetStatus(nomineeName, newStatus) {
    try {
        const sheets = await getSheetsClient();

        // 1. Fetch all names from Column C
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet1!C:C',
        });

        const rows = result.data.values;
        if (!rows || rows.length === 0) {
            console.warn(`⚠️ Sheet is empty or Column C has no data.`);
            return;
        }

        let rowNumber = null;

        // 2. Clean the input name (remove spaces, make lowercase)
        // This fixes the "Baibhav Gorai" vs "Baibhav Gorai " issue
        const searchName = nomineeName.trim().toLowerCase();

        // 3. Loop through rows to find a fuzzy match
        for (let i = 0; i < rows.length; i++) {
            // Safety check: ensure the row has a name
            const sheetName = rows[i][0] ? rows[i][0].toString() : '';

            // Clean the sheet name too
            const cleanSheetName = sheetName.trim().toLowerCase();

            if (cleanSheetName === searchName) {
                rowNumber = i + 1; // Found it!
                console.log(`🎯 Found match at Row ${rowNumber}: "${sheetName}"`);
                break;
            }
        }

        if (!rowNumber) {
            console.warn(`❌ Could not find nominee "${nomineeName}" in Column C. Check spelling!`);
            return;
        }

        // 4. Update Status (Column L)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: `Sheet1!L${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[newStatus]]
            }
        });

        console.log(`✅ Google Sheet status updated to "${newStatus}" for ${nomineeName}`);

    } catch (error) {
        console.error('❌ Google Sheets Status Update Error:', error);
        throw error;
    }
}