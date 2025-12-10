import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { updateSheetStatus } from '@/lib/sheets';

// Helper for nice HTML
function getHtmlResponse(title: string, message: string, color: string, icon: string) {
  return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9fafb; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border-top: 6px solid ${color}; }
            h1 { color: ${color}; margin-bottom: 10px; font-size: 24px; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            p { color: #374151; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">${icon}</div>
            <h1>${title}</h1>
            <p>${message}</p>
          </div>
        </body>
      </html>
    `;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const managerEmail = searchParams.get('email');
  const nomineeName = searchParams.get('nominee');
  const action = searchParams.get('action');

  if (!managerEmail || !nomineeName || !action) {
    return new NextResponse('Invalid Request', { status: 400 });
  }

  let newStatus = action === 'approve' ? 'Approved' : 'Rejected';
  let responseHtml = '';

  if (action === 'approve') {
    responseHtml = getHtmlResponse('Nomination Approved', `You have successfully <strong>approved</strong> the nomination for ${nomineeName}.`, '#166534', '✅');
  } else {
    responseHtml = getHtmlResponse('Nomination Rejected', `You have <strong>rejected</strong> the nomination for ${nomineeName}.`, '#dc2626', '❌');
  }

  try {
    // 1. Update Database (FIXED: Removed updated_at)
    const result = await query(
      `UPDATE nominations 
             SET status = $1 
             WHERE manager_email = $2 
               AND nominee_name = $3 
               AND status = 'Pending Manager'`,
      [newStatus, managerEmail, nomineeName]
    );

    // 2. Check if link is expired
    if (result.rowCount === 0) {
      return new NextResponse(getHtmlResponse('Link Expired', 'This nomination has already been processed.', '#ca8a04', '⚠️'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // 3. Update Google Sheet
    try {
      await updateSheetStatus(nomineeName, newStatus);
    } catch (sheetError) {
      console.error('Sheet Sync Error:', sheetError);
    }

    // 4. Show Success Page
    return new NextResponse(responseHtml, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('System Error:', error);
    return new NextResponse('System Error', { status: 500 });
  }
}