import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { selfEnroll } from '@/app/actions/enrollment';
import {
    Calendar,
    User,
    Briefcase,
    Mail,
    Star,
    MessageSquare,
    CheckCircle2,
    Building2,
    BookOpen,
    Circle
} from 'lucide-react';

export default async function JoinSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    // Await params in Next.js 15+
    const { sessionId } = await params;

    // 1. Fetch Session Info
    const session = await db.trainingSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) return notFound();

    // Helper to format date
    const dateStr = new Date(session.endDate).toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-800">
            <div className="max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">

                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-10 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24 pointer-events-none"></div>

                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 bg-blue-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-blue-400/30 text-blue-100 text-xs font-bold uppercase tracking-widest mb-4">
                            <CheckCircle2 size={14} /> Official Training Record
                        </div>
                        <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Training Feedback</h1>
                        <p className="text-blue-100/90 text-base max-w-lg mx-auto font-medium">
                            Complete this form to share your valuable feedback and help us do better.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <BookOpen size={18} className="text-blue-200" />
                                </div>
                                <p className="text-[10px] uppercase text-blue-200 font-bold tracking-wider">Program</p>
                            </div>
                            <p className="font-bold text-lg text-white leading-tight pl-[3.25rem]">{session.programName}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <User size={18} className="text-blue-200" />
                                </div>
                                <p className="text-[10px] uppercase text-blue-200 font-bold tracking-wider">Trainer</p>
                            </div>
                            <p className="font-bold text-lg text-white leading-tight pl-[3.25rem]">{session.trainerName}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Calendar size={18} className="text-blue-200" />
                                </div>
                                <p className="text-[10px] uppercase text-blue-200 font-bold tracking-wider">Date</p>
                            </div>
                            <p className="font-bold text-lg text-white leading-tight pl-[3.25rem]">{dateStr}</p>
                        </div>
                    </div>
                </div>

                {/* The Form */}
                <form action={selfEnroll} className="p-8 md:p-10 space-y-10">
                    <input type="hidden" name="sessionId" value={sessionId} />

                    {/* SECTION 1: Personal Details */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Your Details</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Please identify yourself</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Full Name"
                                name="name"
                                icon={<User size={16} />}
                                placeholder="e.g. John Doe"
                            />
                            <InputField
                                label="Employee ID"
                                name="empId"
                                icon={<Building2 size={16} />}
                                placeholder="e.g. EMP001"
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label="Official Email"
                                    name="email"
                                    type="email"
                                    icon={<Mail size={16} />}
                                    placeholder="e.g. john.doe@thriveni.com"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: Manager Details */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Reporting Manager</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">For effectiveness review</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Manager Name"
                                name="managerName"
                                icon={<User size={16} />}
                                placeholder="e.g. Jane Smith"
                            />
                            <InputField
                                label="Manager Email"
                                name="managerEmail"
                                type="email"
                                icon={<Mail size={16} />}
                                placeholder="e.g. jane.smith@thriveni.com"
                            />
                        </div>
                    </section>

                    {/* SECTION 3: Ratings (1-5) */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                <Circle size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Feedback Ratings</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Please rate the following parameters</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-6">
                            <NumericRatingField label="Rate your knowledge level BEFORE training" name="preTrainingRating" />
                            <NumericRatingField label="Rate your knowledge level AFTER training" name="postTrainingRating" />
                            <NumericRatingField label="How would you rate the overall training?" name="trainingRating" />
                            <NumericRatingField label="Contents covered were useful for my work" name="contentRating" />
                            <NumericRatingField label="Trainer Knowledge and Delivery" name="trainerRating" />
                            <NumericRatingField label="Quality of Training Materials" name="materialRating" />
                            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100/80 hover:border-blue-100 transition-all">
                                <label className="block text-sm font-bold text-slate-700 mb-4">I would recommend this training to others <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer relative">
                                        <input type="radio" name="recommendationRating" value="5" required className="peer sr-only" />
                                        <div className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold transition-all peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm">
                                            Yes
                                        </div>
                                    </label>
                                    <label className="cursor-pointer relative">
                                        <input type="radio" name="recommendationRating" value="1" required className="peer sr-only" />
                                        <div className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold transition-all peer-checked:bg-slate-600 peer-checked:text-white peer-checked:border-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm">
                                            No
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 4: Qualitative Feedback */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Additional Comments</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your thoughts matter</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <TextAreaField
                                label="Topics learned & Activities done"
                                name="topicsLearned"
                                placeholder="What were the key takeaways from this session?"
                            />
                            <TextAreaField
                                label="Action Plan (How will you use this?)"
                                name="actionPlan"
                                placeholder="How do you plan to apply this knowledge in your daily work?"
                            />
                            <TextAreaField
                                label="Suggestions for Improvement"
                                name="suggestions"
                                placeholder="Any ideas on how we can make this training better?"
                            />
                        </div>
                    </section>

                    <button type="submit" className="w-full group bg-blue-700 hover:bg-blue-800 text-white font-bold py-5 rounded-xl shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-0.5 mt-8 flex items-center justify-center gap-3">
                        <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-lg">Submit Feedback & Enroll</span>
                    </button>
                </form>

            </div>
        </div>
    );
}

// --- Helper Components ---

function InputField({ label, name, type = "text", placeholder, icon }: { label: string, name: string, type?: string, placeholder?: string, icon?: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">{label} <span className="text-red-500">*</span></label>
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    {icon}
                </div>
                <input
                    name={name}
                    required
                    type={type}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-slate-100/50"
                    placeholder={placeholder}
                />
            </div>
        </div>
    )
}

function TextAreaField({ label, name, placeholder }: { label: string, name: string, placeholder?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">{label}</label>
            <textarea
                name={name}
                rows={3}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-slate-100/50 resize-y min-h-[100px]"
                placeholder={placeholder}
            ></textarea>
        </div>
    )
}

function NumericRatingField({ label, name }: { label: string, name: string }) {
    return (
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100/80 hover:border-blue-100 transition-all">
            <label className="block text-sm font-bold text-slate-700 mb-4">{label} <span className="text-red-500">*</span></label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="relative">
                            <input
                                type="radio"
                                name={name}
                                id={`${name}-${num}`}
                                value={num}
                                required
                                className="peer sr-only"
                            />
                            <label
                                htmlFor={`${name}-${num}`}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 font-bold cursor-pointer transition-all peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 hover:bg-slate-50 hover:border-slate-300"
                            >
                                {num}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between w-full sm:w-auto sm:gap-12 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Poor</span>
                    <span>Excellent</span>
                </div>
            </div>
        </div>
    );
}
