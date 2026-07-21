import { db } from '@/lib/prisma';
import { submitEmployeeFeedback } from '@/app/actions';
import { redirect } from 'next/navigation';
import { verifySecureToken } from '@/lib/security';
import { EmployeeFeedbackClient } from './EmployeeFeedbackClient';

export default async function EmployeeFeedbackPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string }>;
}) {

    const { id } = await params;
    const { token } = await searchParams;

    // 1. SECURITY CHECK (HMAC Token Verification)
    if (!token || !verifySecureToken(token, id)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
                <div className="max-w-md bg-white p-8 rounded-xl shadow-lg border-t-4 border-red-500">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
                    <p className="text-slate-600">Invalid or expired security token. Please use the link provided in your email.</p>
                </div>
            </div>
        );
    }

    const enrollment = await db.enrollment.findUnique({
        where: { id: id },
        include: { session: true },
    });

    if (!enrollment) return <div className="p-8 text-red-500">Invalid Link.</div>;
    if (enrollment.status !== 'Pending') return <div className="p-8 text-green-600">Feedback already submitted.</div>;

    async function saveFeedback(formData: FormData) {
        'use server';
        await submitEmployeeFeedback(formData);
        redirect('/feedback/success');
    }

    return (
        <EmployeeFeedbackClient 
            enrollmentId={id} 
            token={token} 
            programName={enrollment.session.altProgramName || enrollment.session.programName} 
            saveFeedback={saveFeedback} 
        />
    );
}