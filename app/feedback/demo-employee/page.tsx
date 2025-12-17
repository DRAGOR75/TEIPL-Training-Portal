'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmployeeDemo() {
    const router = useRouter();
    const [relevant, setRelevant] = useState<string | null>(null);
    const [rating, setRating] = useState<number | null>(null);

    const handleSubmit = () => {
        // Validation: Force them to click buttons before submitting
        if (!relevant || !rating) {
            alert("Please answer all questions before submitting.");
            return;
        }

        const confirm = window.confirm("Are you sure you want to submit your feedback?");

        if (confirm) {
            alert("✅ Feedback Submitted Successfully! \n\nRedirecting to Manager View...");
            router.push('/feedback/demo-manager');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4 font-sans">
            <div className="bg-white max-w-lg w-full rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-600">

                {/* Header */}
                <div className="p-8 border-b bg-slate-50">
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Training Feedback</div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Advanced Hydraulic Systems</h1>
                    <p className="text-sm text-slate-500">Trainer: <span className="font-semibold text-slate-700">Rajesh Kumar</span> • Date: <span className="font-semibold text-slate-700">Nov 15, 2025</span></p>
                </div>

                {/* Form Body */}
                <div className="p-8 space-y-8">

                    {/* Question 1: Yes / No (Replaced Text Area) */}
                    <div className="space-y-3">
                        <label className="block font-semibold text-slate-800 text-lg">1. Was this training relevant to your current project?</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setRelevant('Yes')}
                                className={`flex-1 py-3 rounded-lg border font-bold transition-all ${relevant === 'Yes'
                                        ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-green-50 hover:border-green-400'
                                    }`}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setRelevant('No')}
                                className={`flex-1 py-3 rounded-lg border font-bold transition-all ${relevant === 'No'
                                        ? 'bg-red-500 text-white border-red-500 shadow-md transform scale-105'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-red-50 hover:border-red-400'
                                    }`}
                            >
                                No
                            </button>
                        </div>
                    </div>

                    {/* Question 2: Scale 1-5 */}
                    <div className="space-y-3">
                        <label className="block font-semibold text-slate-800 text-lg">2. Rate the technical depth of the content.</label>
                        <div className="flex justify-between gap-2">
                            {[1, 2, 3, 4, 5].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setRating(num)}
                                    className={`w-12 h-12 rounded-full border font-bold text-lg transition-all ${rating === num
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-110'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-blue-50 hover:border-blue-400'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 px-1">
                            <span>Poor</span>
                            <span>Excellent</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg transform active:scale-[0.98] transition-all text-lg mt-4"
                    >
                        Submit Feedback
                    </button>

                    <p className="text-center text-xs text-slate-400">
                        No typing required. Takes less than 10 seconds.
                    </p>
                </div>
            </div>
        </div>
    );
}