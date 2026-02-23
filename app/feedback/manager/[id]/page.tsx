import { db } from '@/lib/prisma';
import { verifySecureToken } from '@/lib/security';
import { redirect } from 'next/navigation';
import { submitManagerReview } from '@/app/actions';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import {
    HiOutlineBookOpen,
    HiOutlineUser,
    HiOutlineCalendar,
    HiOutlineMapPin,
    HiOutlineLightBulb,
    HiOutlineBriefcase,
    HiOutlineAcademicCap,
    HiOutlineArrowTrendingUp,
    HiOutlineCheckCircle
} from 'react-icons/hi2';

export default async function ManagerFeedbackPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string }>;
}) {

    // 1. UNWRAP THE PARAMS
    const { id } = await params;
    const { token } = await searchParams;

    // SECURITY CHECK
    if (!token || !verifySecureToken(token, id)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md border-t-4 border-red-500">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
                    <p className="text-slate-600">Invalid or expired security token.</p>
                </div>
            </div>
        );
    }

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

    const growth = (enrollment.postTrainingRating || 0) - (enrollment.preTrainingRating || 0);

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center p-3 md:p-8 font-sans">
            <div className="max-w-6xl w-full bg-white rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="bg-indigo-950 p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight">Post Training (30 days) Effectiveness Review</h1>
                                <p className="opacity-80 text-sm md:text-base">Reviewing performance impact for <span className="font-bold text-yellow-400">{enrollment.employeeName}</span></p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center">
                                <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1 font-bold">Effectiveness Score</div>
                                <div className="text-3xl font-black text-yellow-400">{enrollment.averageRating?.toFixed(1)} <span className="text-sm font-medium text-white/50">/ 5</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8 space-y-8">

                    {/* SECTION 1: CONTEXT DASHBOARD */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Training Overview */}
                        <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                                <HiOutlineBookOpen className="text-indigo-600 text-2xl" />
                                <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wider">Training Context</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <ContextItem icon={<HiOutlineAcademicCap className="text-indigo-500" />} label="Program Name" value={enrollment.session.programName} />
                                    <ContextItem icon={<HiOutlineUser className="text-indigo-500" />} label="Trainer" value={enrollment.session.trainerName || 'N/A'} />
                                    <ContextItem icon={<HiOutlineMapPin className="text-indigo-500" />} label="Location" value={enrollment.session.location || 'N/A'} />
                                </div>
                                <div className="space-y-4">
                                    <ContextItem
                                        icon={<HiOutlineCalendar className="text-indigo-500" />}
                                        label="Duration"
                                        value={`${new Date(enrollment.session.startDate).toLocaleDateString()} - ${new Date(enrollment.session.endDate).toLocaleDateString()}`}
                                    />
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Official Topics Covered</p>
                                        <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">{enrollment.session.topics || 'Standard Curriculum'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Knowledge Growth */}
                        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 flex flex-col justify-between">
                            <div className="flex items-center gap-3 border-b border-indigo-200 pb-4">
                                <HiOutlineArrowTrendingUp className="text-indigo-600 text-2xl" />
                                <h2 className="font-bold text-indigo-900 uppercase text-sm tracking-wider">Skill Growth</h2>
                            </div>

                            <div className="py-6 flex justify-around items-center">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Pre Training</p>
                                    <p className="text-2xl font-bold text-slate-700">{enrollment.preTrainingRating}<span className="text-xs opacity-50">/5</span></p>
                                </div>
                                <div className="w-12 h-[2px] bg-indigo-200 relative">
                                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400"></div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase">Post Training</p>
                                    <p className="text-3xl font-black text-indigo-700">{enrollment.postTrainingRating}<span className="text-xs opacity-50">/5</span></p>
                                </div>
                            </div>

                            <div className={`mt-2 p-3 rounded-xl text-center font-bold text-sm ${growth > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {growth > 0 ? `Self-reported +${growth.toFixed(1)} improvement` : 'No significant change reported'}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: QUALITATIVE DATA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <HiOutlineLightBulb size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">Topics Learned</h3>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed italic border-l-4 border-blue-400">
                                "{enrollment.topicsLearned || 'No comments provided'}"
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <HiOutlineBriefcase size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">How will you apply this learning in your role? </h3>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed italic border-l-4 border-emerald-400">
                                "{enrollment.actionPlan || 'No commitment provided'}"
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* SECTION 3: RATING & VALIDATION */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT: Employee's Answers (ReadOnly) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Employee Self-Assessment</h3>
                                <span className="text-[10px] text-slate-400 font-bold uppercase italic">30-Day Post Review</span>
                            </div>

                            <div className="space-y-3">
                                <RatingDisplay label="Q1. This program was relevant and useful for my current work." score={enrollment.q1_Relevance} />
                                <RatingDisplay label="Q2. I am able to apply most of the knowledge/skills at my workplace." score={enrollment.q2_Application} />
                                <RatingDisplay label="Q3. I am able to do my job better after the training." score={enrollment.q3_Performance} />
                                <RatingDisplay label="Q4. The training has influenced my way of daily working." score={enrollment.q4_Influence} />
                                <RatingDisplay label="Q5. The program has improved my efficiency and productivity." score={enrollment.q5_Efficiency} />
                            </div>
                        </div>

                        {/* RIGHT: Manager's Action */}
                        <form action={submitReview} className="bg-white p-6 md:p-8 rounded-3xl border-2 border-indigo-100 h-fit shadow-xl relative">
                            <div className="absolute -top-3 left-8 bg-indigo-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full shadow-lg">
                                Manager Action Required
                            </div>

                            <h3 className="font-extrabold text-indigo-900 text-lg mb-6 pt-2">Validation Decision</h3>
                            <input type="hidden" name="enrollmentId" value={id} />
                            <input type="hidden" name="token" value={token} />

                            <div className="mb-8">
                                <p className="text-sm font-bold text-slate-800 mb-4 leading-relaxed">
                                    Based on the training  and employee commitments above, do you agree with the ratings of Mr. {enrollment.employeeName}?
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center justify-center gap-2 cursor-pointer bg-white px-6 py-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm group has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-600 has-[:checked]:text-white">
                                        <input required type="radio" name="agree" value="Yes" className="hidden" />
                                        <span className="font-bold uppercase tracking-wider">Yes, Agree</span>
                                    </label>
                                    <label className="flex items-center justify-center gap-2 cursor-pointer bg-white px-6 py-4 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all shadow-sm group has-[:checked]:border-red-600 has-[:checked]:bg-red-600 has-[:checked]:text-white">
                                        <input required type="radio" name="agree" value="No" className="hidden" />
                                        <span className="font-bold uppercase tracking-wider">No, Disagree</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-800 mb-2">Manager Comments / Observations</label>
                                <textarea
                                    required
                                    name="comments"
                                    rows={4}
                                    className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-800 transition-all placeholder:text-slate-300"
                                    placeholder="Please provide specific observations regarding performance improvement or justify your disagreement..."
                                ></textarea>
                            </div>

                            <FormSubmitButton className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                                <HiOutlineCheckCircle size={20} />
                                <span>Complete Final Review</span>
                            </FormSubmitButton>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}

// HELPER COMPONENTS
const ContextItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-700 leading-tight">{value}</p>
        </div>
    </div>
);

const RatingDisplay = ({ label, score }: { label: string, score: number | null }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
        <p className="text-sm font-medium text-slate-700 mb-3">{label}</p>
        <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${score === null ? 'w-0 bg-slate-200' :
                        score < 3 ? 'bg-red-500' :
                            score < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                    style={{ width: `${(score || 0) * 20}%` }}
                ></div>
            </div>
            <div className={`text-xl font-black px-4 py-1 rounded-xl shrink-0 ${score === null ? 'bg-slate-100 text-slate-400' :
                score < 3 ? 'bg-red-50 text-red-600 border border-red-100' :
                    score < 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                {score ?? 'N/A'} <span className="text-xs font-normal opacity-50">/ 5</span>
            </div>
        </div>
    </div>
);
