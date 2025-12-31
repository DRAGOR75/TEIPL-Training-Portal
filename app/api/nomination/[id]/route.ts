import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Standard Next.js 15+ async params
) {
    try {
        const { id } = await params;

        const nomination = await db.nomination.findUnique({
            where: { id },
        });

        if (!nomination) {
            return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
        }

        // Map Prisma fields to frontend expectations
        const data = {
            nominee_emp_id: nomination.empId,
            nominee_name: nomination.employeeName,
            nominee_site: nomination.site,
            nominee_designation: nomination.designation,
            nominee_email: nomination.employeeEmail,
            nominee_mobile: nomination.mobile,
            nominee_experience: nomination.experience,
            justification: nomination.justification,
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching nomination:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updatedNomination = await db.nomination.update({
            where: { id },
            data: {
                empId: body.empId,
                employeeName: body.nomineeName,
                site: body.site,
                designation: body.designation,
                employeeEmail: body.nomineeEmail,
                mobile: body.mobile,
                experience: body.experience,
                justification: body.justification,
            },
        });

        revalidatePath('/my-nominations');
        return NextResponse.json({ success: true, nomination: updatedNomination });
    } catch (error) {
        console.error("Error updating nomination:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
