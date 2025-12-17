'use server'

import { db } from "@/lib/db";
import { sendApprovalEmail } from '@/lib/email';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// ----------------------------------------------------------------------
// 1. SUBMIT NOMINATION
// ----------------------------------------------------------------------
export async function submitNomination(formData: FormData) {

    // Extract Nominator info for the EMAIL only (Not in DB schema)
    const nominatorName = formData.get('nominatorName') as string;
    const nominatorEmail = formData.get('nominatorEmail') as string;

    // Extract DB Fields
    const empId = formData.get('empId') as string;
    const employeeName = formData.get('nomineeName') as string; // Maps to employeeName
    const site = formData.get('site') as string;
    const designation = formData.get('designation') as string;
    const mobile = formData.get('mobile') as string;
    const experience = formData.get('experience') as string;

    const managerName = formData.get('managerName') as string;
    const managerEmail = formData.get('managerEmail') as string;
    const employeeEmail = formData.get('nomineeEmail') as string; // Maps to employeeEmail

    const justification = formData.get('justification') as string;
    const programName = formData.get('programName') as string;

    // Construct Email Body
    const emailDetails = `
        ${justification}
        
        --- Nomination Details ---
        Nominated By: ${nominatorName} (${nominatorEmail})
        Nominee ID: ${empId}
        Site: ${site}
        Designation: ${designation}
        Mobile: ${mobile}
        Experience: ${experience}
    `.trim();

    try {
        // 1. Save to Database
        // Note: We are NOT saving nominatorName/Email as they aren't in your schema
        const nomination = await db.nomination.create({
            data: {
                employeeName,
                employeeEmail,
                empId,
                site,
                designation,
                mobile,
                experience,
                managerName,
                managerEmail,
                programName: programName || 'General Nomination',
                justification: justification,
                status: 'PENDING',
            }
        });

        // 2. Send Approval Email to Manager
        await sendApprovalEmail(
            managerEmail,
            managerName,
            employeeName,
            emailDetails,
            nomination.id
        );

    } catch (error) {
        console.error("Failed to submit nomination:", error);
        throw new Error("Failed to submit nomination");
    }
}

// ----------------------------------------------------------------------
// 2. MANAGER ACTION (Approve/Reject)
// ----------------------------------------------------------------------
export async function updateStatus(formData: FormData) {
    const id = formData.get('id') as string;
    const action = formData.get('action') as string; // 'APPROVED' or 'REJECTED'

    if (!id || !action) {
        throw new Error("Missing ID or Action");
    }

    try {
        await db.nomination.update({
            where: { id },
            data: {
                status: action
            }
        });

        revalidatePath(`/nominations/manager/${id}`);

    } catch (error) {
        console.error("Failed to update status:", error);
        throw new Error("Failed to update status");
    }
}

// ----------------------------------------------------------------------
// 3. GET MY NOMINATIONS (For Dashboard)
// ----------------------------------------------------------------------
export async function getMyNominations(email: string) {
    try {
        const nominations = await db.nomination.findMany({
            where: {
                OR: [
                    { employeeEmail: email }, // Where I am the nominee
                    { managerEmail: email }   // Where I am the manager
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, nominations };
    } catch (error) {
        console.error("Failed to fetch nominations:", error);
        return { success: false, nominations: [], error: "Failed to load data" };
    }
}

// ----------------------------------------------------------------------
// 4. GET SINGLE NOMINATION (For Edit/View)
// ----------------------------------------------------------------------
export async function getNominationById(id: string) {
    try {
        const nomination = await db.nomination.findUnique({
            where: { id }
        });
        if (!nomination) return { success: false, error: "Not Found" };
        return { success: true, nomination };
    } catch (error) {
        return { success: false, error: "Database Error" };
    }
}

// ----------------------------------------------------------------------
// 5. UPDATE NOMINATION (For Edit Form)
// ----------------------------------------------------------------------
export async function updateNomination(id: string, formData: FormData) {

    const data = {
        employeeName: formData.get('nomineeName') as string,
        empId: formData.get('empId') as string,
        site: formData.get('site') as string,
        designation: formData.get('designation') as string,
        mobile: formData.get('mobile') as string,
        experience: formData.get('experience') as string,
        managerName: formData.get('managerName') as string,
        managerEmail: formData.get('managerEmail') as string,
        justification: formData.get('justification') as string,
        programName: formData.get('programName') as string,
    };

    try {
        await db.nomination.update({
            where: { id: id },
            data: {
                employeeName: data.employeeName,
                empId: data.empId,
                site: data.site,
                designation: data.designation,
                mobile: data.mobile,
                experience: data.experience,
                managerName: data.managerName,
                managerEmail: data.managerEmail,
                justification: data.justification,
                programName: data.programName,
            }
        });

    } catch (error) {
        console.error("Update failed:", error);
        throw new Error("Failed to update nomination");
    }

    redirect('/my-nominations');
}