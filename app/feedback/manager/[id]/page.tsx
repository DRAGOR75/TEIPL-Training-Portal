import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { submitManagerReview } from '@/app/actions';
import { FormSubmitButton } from '@/components/FormSubmitButton';

// Update Type to Promise
export default async function ManagerFeedbackPage({ params }: { params: Promise<{ id: string }> }) {

    // 1. UNWRAP THE PARAMS
    const { id } = await params;

    // 2. Use unwrapped 'id'
    const enrollment = await db.enrollment.findUnique({
        where: { id: id },
        include: { session: true },
    });

    if (!enrollment) return <div className="p-8 text-red-600">Invalid Link</div>;

    if (enrollment.status === 'Pending') return <div className="p-8 text-yellow-600">The employee has not submitted their feedback yet.</div>;
    if (enrollment.status === 'Completed') return <div className="p-8 text-green-600">You have already completed this review.</div>;

    async function submitReview(formData: FormData) {
        'use server';
        await submitManagerReview(formData);
        redirect('/feedback/success-manager');
    }

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center p-8 font-sans">
            <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Post training (30 days) performance feedback Review</h1>
                        <p className="opacity-80 text-sm">Employee Under Review: <span className="font-bold text-yellow-400">{enrollment.employeeName}</span></p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">{enrollment.averageRating?.toFixed(1)} <span className="text-sm font-normal opacity-50">/ 5</span></div>
                        <div className="text-xs uppercase tracking-wider opacity-75">Avg Score</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">

                    {/* LEFT: Employee's Answers (ReadOnly) - FOCUS ON VISIBILITY */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-indigo-900 uppercase text-xs tracking-wider border-b border-slate-300 pb-2">Employee Self-Assessment (Score / 5)</h3>

                        <RatingDisplay label="1. Relevance to Work" score={enrollment.q1_Relevance} />
                        <RatingDisplay label="2. Application of Skills" score={enrollment.q2_Application} />
                        <RatingDisplay label="3. Performance Improvement" score={enrollment.q3_Performance} />
                        <RatingDisplay label="4. Knowledge Transfer/Influence" score={enrollment.q4_Influence} />
                        <RatingDisplay label="5. Efficiency & Productivity" score={enrollment.q5_Efficiency} />
                    </div>

                    {/* RIGHT: Manager's Action */}
                    <form action={submitReview} className="bg-white p-6 rounded-xl border border-slate-200 h-fit shadow-md">
                        <h3 className="font-bold text-indigo-900 uppercase text-xs tracking-wider border-b border-slate-300 pb-2 mb-4">Manager Validation</h3>
                        {/* USE UNWRAPPED ID HERE */}
                        <input type="hidden" name="enrollmentId" value={id} />

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-800 mb-2">
                                Q1. Do you agree with the ratings of Mr. {enrollment.employeeName}?
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded border border-slate-200 hover:border-indigo-500 shadow-sm">
                                    <input required type="radio" name="agree" value="Yes" className="text-indigo-600 accent-indigo-600" />
                                    <span className="text-slate-700">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded border border-slate-200 hover:border-red-500 shadow-sm">
                                    <input required type="radio" name="agree" value="No" className="text-red-600 accent-red-600" />
                                    <span className="text-slate-700">No</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-800 mb-2">Manager Comments</label>
                            <textarea
                                required
                                name="comments"
                                rows={4}
                                className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                                placeholder="Please justify if you disagree, or add observations..."
                            ></textarea>
                        </div>

                        <FormSubmitButton className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg">
                            Submit Final Review
                        </FormSubmitButton>
                    </form>

                </div>
            </div>
        </div>
    );
}

// NEW HELPER COMPONENT FOR VISIBILITY
const RatingDisplay = ({ label, score }: { label: string, score: number | null }) => (
    <div className="flex justify-between items-center bg-white p-3 rounded border border-slate-300 shadow-sm">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
            {/* Main Score Box for High Visibility */}
            <span className={`text-lg font-extrabold px-3 py-1 rounded-full ${score === null ? 'bg-slate-300 text-slate-600' : score < 3 ? 'bg-red-100 text-red-600' : score < 5 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {score ?? 'N/A'}
            </span>
            <span className="text-xs text-slate-400">/ 5</span>
        </div>
    </div>
);