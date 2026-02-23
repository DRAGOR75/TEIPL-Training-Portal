import { db } from '@/lib/prisma';
import { submitEmployeeFeedback } from '@/app/actions';
import { redirect } from 'next/navigation';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { verifySecureToken } from '@/lib/security';


const RatingQuestion = ({ label, name }: { label: string; name: string }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <label className="block text-slate-800 font-medium mb-3">{label}</label>
        <div className="flex justify-between items-center px-2">
            {[1, 2, 3, 4, 5].map((num) => (
                <label key={num} className="cursor-pointer group flex flex-col items-center gap-1">
                    <input required type="radio" name={name} value={num} className="peer w-5 h-5 text-blue-600 accent-blue-600" />
                    <span className="text-xs text-slate-400 group-hover:text-blue-600 peer-checked:font-bold peer-checked:text-blue-700">{num}</span>
                </label>
            ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-2 uppercase tracking-wide">
            <span>Strongly Disagree</span>
            <span>Strongly Agree</span>
        </div>
    </div>
);


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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-6 text-white">
                    <h1 className="text-2xl font-bold">Post training (30 days) performance feedback</h1>
                    <p className="opacity-80 text-sm mt-1">Please rate the impact of: <span className="font-bold text-blue-300">{enrollment.session.programName}</span></p>
                </div>

                <form action={saveFeedback} className="p-8 space-y-6">
                    <input type="hidden" name="enrollmentId" value={id} />
                    <input type="hidden" name="token" value={token} />

                    <div className="space-y-4">

                        <RatingQuestion name="q1" label="Q1. This program was relevant and useful for my current work." />
                        <RatingQuestion name="q2" label="Q2. I am able to apply most of the knowledge/skills at my workplace." />
                        <RatingQuestion name="q3" label="Q3. I am able to do my job better after the training." />
                        <RatingQuestion name="q4" label="Q4. The training has influenced my way of daily working." />
                        <RatingQuestion name="q5" label="Q5. The program has improved my efficiency and productivity." />
                    </div>

                    <FormSubmitButton className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow transition mt-4">
                        Submit Effectiveness Rating
                    </FormSubmitButton>
                </form>
            </div>
        </div>
    );
}