'use client';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { GoogleTranslateWidget } from '@/components/GoogleTranslateWidget';

const RatingQuestion = ({ label, name, leftLabel, rightLabel }: { label: string; name: string, leftLabel: string, rightLabel: string }) => (
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
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
        </div>
    </div>
);

export function EmployeeFeedbackClient({ 
    enrollmentId, 
    token, 
    programName, 
    saveFeedback 
}: { 
    enrollmentId: string, 
    token: string, 
    programName: string,
    saveFeedback: (formData: FormData) => Promise<void>
}) {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="max-w-2xl w-full flex justify-end mb-4 gap-2">
                <GoogleTranslateWidget />
            </div>

            <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-6 text-white">
                    <h1 className="text-2xl font-bold">Post training (30 days) performance feedback</h1>
                    <p className="opacity-80 text-sm mt-1">Please rate the impact of: <span className="font-bold text-blue-300">{programName}</span></p>
                </div>

                <form action={saveFeedback} className="p-8 space-y-6">
                    <input type="hidden" name="enrollmentId" value={enrollmentId} />
                    <input type="hidden" name="token" value={token} />

                    <div className="space-y-4">
                        <RatingQuestion name="q1" label="Q1. This program was relevant and useful for my current work." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" />
                        <RatingQuestion name="q2" label="Q2. I am able to apply most of the knowledge/skills at my workplace." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" />
                        <RatingQuestion name="q3" label="Q3. I am able to do my job better after the training." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" />
                        <RatingQuestion name="q4" label="Q4. The training has influenced my way of daily working." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" />
                        <RatingQuestion name="q5" label="Q5. The program has improved my efficiency and productivity." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" />
                    </div>

                    <FormSubmitButton className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow transition mt-4">
                        Submit Effectiveness Rating
                    </FormSubmitButton>
                </form>
            </div>
        </div>
    );
}
