import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { selfEnroll } from '@/app/actions/enrollment';

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
        day: 'numeric', month: 'short', year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
            <div className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">

                {/* Header Section */}
                <div className="bg-blue-700 p-8 text-white text-center">
                    <h1 className="text-2xl font-bold mb-2">Training Feedback & Attendance</h1>
                    <p className="text-blue-100 text-sm mb-6">Please fill this form to mark your attendance.</p>

                    <div className="grid grid-cols-2 gap-4 text-left bg-blue-800/50 p-4 rounded-lg border border-blue-500/30">
                        <div>
                            <p className="text-[10px] uppercase text-blue-300 tracking-wider">Program Name</p>
                            <p className="font-semibold text-lg">{session.programName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-blue-300 tracking-wider">Trainer</p>
                            <p className="font-semibold text-lg">{session.trainerName}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] uppercase text-blue-300 tracking-wider">Session Date</p>
                            <p className="font-semibold">{dateStr}</p>
                        </div>
                    </div>
                </div>

                {/* The Form */}
                <form action={selfEnroll} className="p-8 space-y-8">
                    <input type="hidden" name="sessionId" value={sessionId} />

                    {/* SECTION 1: Personal Details */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b pb-2">1. Your Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Full Name *</label>
                                <input name="name" required type="text" className="input-field" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="label-text">Employee ID *</label>
                                <input name="empId" required type="text" className="input-field" placeholder="EMP123" />
                            </div>
                        </div>
                        <div>
                            <label className="label-text">Official Email *</label>
                            <input name="email" required type="email" className="input-field" placeholder="john@thriveni.com" />
                        </div>
                    </section>

                    {/* SECTION 2: Manager Details */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b pb-2">2. Reporting Manager</h3>
                        <p className="text-xs text-slate-500">We need this for the post-training effectiveness review.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Manager Name *</label>
                                <input name="managerName" required type="text" className="input-field" />
                            </div>
                            <div>
                                <label className="label-text">Manager Email *</label>
                                <input name="managerEmail" required type="email" className="input-field" />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: Ratings (1-5) */}
                    <section className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800 border-b pb-2">3. Feedback Ratings</h3>
                        <p className="text-xs text-slate-500 mb-4">Scale: 1 (Poor) to 5 (Excellent)</p>

                        <RatingField label="Rate your knowledge level BEFORE training" name="preTrainingRating" />
                        <RatingField label="Rate your knowledge level AFTER training" name="postTrainingRating" />
                        <RatingField label="How do you like the training?" name="trainingRating" />
                        <RatingField label="Contents covered are useful for my work" name="contentRating" />
                        <RatingField label="Trainer Knowledge and Delivery" name="trainerRating" />
                        <RatingField label="Training Material Quality" name="materialRating" />
                        <RatingField label="I will recommend this training to others" name="recommendationRating" />
                    </section>

                    {/* SECTION 4: Qualitative Feedback */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 border-b pb-2">4. Comments</h3>

                        <div>
                            <label className="label-text">Topics learned & Activities done</label>
                            <textarea name="topicsLearned" rows={2} className="input-field" placeholder="Short answer..."></textarea>
                        </div>
                        <div>
                            <label className="label-text">Action Plan (How will you use this?)</label>
                            <textarea name="actionPlan" rows={2} className="input-field" placeholder="Short answer..."></textarea>
                        </div>
                        <div>
                            <label className="label-text">Suggestions for Improvement</label>
                            <textarea name="suggestions" rows={2} className="input-field" placeholder="Short answer..."></textarea>
                        </div>
                    </section>

                    <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-lg shadow-lg transition transform hover:scale-[1.01] mt-4">
                        ✅ Submit Feedback & Enroll
                    </button>
                </form>

            </div>

            {/* 🟢 UPDATED STYLES HERE */}
            <style>{`
        .label-text { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem; }
        
        /* Added background-color and color */
        .input-field { 
            width: 100%; 
            padding: 0.75rem; 
            border: 1px solid #cbd5e1; 
            background-color: #f8fafc; /* Slight gray background */
            color: #1e293b; /* Dark text color */
            border-radius: 0.5rem; 
            outline: none; 
            transition: all 0.2s; 
        }

        /* Added explicit color for placeholders */
        .input-field::placeholder {
            color: #94a3b8; /* Lighter gray for placeholder */
        }

        .input-field:focus { border-color: #3b82f6; ring: 2px; ring-color: #3b82f6; background-color: #ffffff; }
      `}</style>
        </div>
    );
}

// Helper Component for the 1-5 Radio Buttons
function RatingField({ label, name }: { label: string, name: string }) {
    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-3">{label}</label>
            <div className="flex justify-between max-w-xs">
                {[1, 2, 3, 4, 5].map((num) => (
                    <label key={num} className="cursor-pointer flex flex-col items-center gap-1 group">
                        <input type="radio" name={name} value={num} required className="w-5 h-5 accent-blue-600 cursor-pointer" />
                        <span className="text-xs text-slate-400 group-hover:text-blue-600 font-medium">{num}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}