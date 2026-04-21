'use client';

import { useState } from 'react';
import { selfEnroll } from '@/app/actions/enrollment';
import { HiOutlineUser, HiOutlineEnvelope, HiOutlineBriefcase, HiOutlineInformationCircle, HiOutlineChatBubbleLeftRight, HiOutlineCheckCircle } from 'react-icons/hi2';
import { FormSubmitButton } from '@/components/FormSubmitButton';

interface Participant {
    empId: string;
    name: string;
    email: string;
    managerName: string | null;
    managerEmail: string | null;
    hasSubmitted: boolean;
}

interface Props {
    sessionId: string;
    participants: Participant[];
    allowWalkIns: boolean;
}

export default function JoinFormClient({ sessionId, participants, allowWalkIns }: Props) {
    const [selectedEmpId, setSelectedEmpId] = useState<string>('');
    const isWalkIn = selectedEmpId === 'WALKIN';

    return (
        <form action={selfEnroll} className="p-5 md:p-10 space-y-8 md:space-y-10">
            <input type="hidden" name="sessionId" value={sessionId} />

            {/* SECTION 1: Identity Selection */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <HiOutlineUser size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Your Identity</h3>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Please select your name from the batch</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 ml-1">Select Your Name <span className="text-red-500">*</span></label>
                    <select
                        name="empId"
                        required
                        value={selectedEmpId}
                        onChange={(e) => setSelectedEmpId(e.target.value)}
                        className="w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        <option value="" disabled>-- Choose Participant --</option>
                        {participants.map(p => (
                            <option key={p.empId} value={p.empId} disabled={p.hasSubmitted}>
                                {p.name} {p.hasSubmitted ? '(Feedback Completed)' : ''}
                            </option>
                        ))}
                        {allowWalkIns && (
                            <option value="WALKIN" className="font-bold text-blue-600 bg-blue-50">
                                + Other / Walk-In (Not on list)
                            </option>
                        )}
                    </select>
                </div>

                {/* Walk-In Manual Fields */}
                {isWalkIn && (
                    <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 mt-6 space-y-6 animate-in slide-in-from-top-2 fade-in">
                        <div className="flex items-center gap-2 text-orange-800 font-bold text-sm mb-2">
                            <HiOutlineInformationCircle size={18} /> You are registering as a Walk-In participant.
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Full Name" name="name" icon={<HiOutlineUser size={16} />} placeholder="Your Full Name" />
                            <div className="md:col-span-2">
                                <InputField label="Official Email" name="email" type="email" icon={<HiOutlineEnvelope size={16} />} placeholder="e.g. jod@thriveni.com" />
                            </div>
                            <InputField label="Manager Name" name="managerName" icon={<HiOutlineUser size={16} />} placeholder="Your Reporting Manager's Name" />
                            <InputField label="Manager Email" name="managerEmail" type="email" icon={<HiOutlineEnvelope size={16} />} placeholder="Your Reporting Manager's Official Email" />
                        </div>
                    </div>
                )}
            </section>

            {/* SECTION 3: Ratings (1-5) */}
            <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <HiOutlineInformationCircle size={20} />
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
                        <HiOutlineChatBubbleLeftRight size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Additional Comments</h3>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your thoughts matter</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <TextAreaField label="Topics learned & Activities done" name="topicsLearned" required={true} placeholder="What were the key takeaways from this session?" />
                    <TextAreaField label="Action Plan (How will you use this?)" name="actionPlan" required={true} placeholder="How do you plan to apply this knowledge in your daily work?" />
                    <TextAreaField label="Suggestions if any" name="suggestions" placeholder="Any ideas on how we can make this training better?" />
                </div>
            </section>

            <FormSubmitButton className="w-full group bg-blue-700 hover:bg-blue-800 text-white font-bold py-5 rounded-xl shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-0.5 mt-8 flex items-center justify-center gap-3">
                <HiOutlineCheckCircle size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-lg">Submit Feedback</span>
            </FormSubmitButton>
        </form>
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
                <input name={name} required type={type} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-slate-100/50" placeholder={placeholder} />
            </div>
        </div>
    )
}

function TextAreaField({ label, name, placeholder, required = false }: { label: string, name: string, placeholder?: string, required?: boolean }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <textarea name={name} required={required} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-slate-100/50 resize-y min-h-[100px]" placeholder={placeholder}></textarea>
        </div>
    )
}

function NumericRatingField({ label, name }: { label: string, name: string }) {
    return (
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100/80 hover:border-blue-100 transition-all">
            <label className="block text-sm font-bold text-slate-700 mb-4">{label} <span className="text-red-500">*</span></label>
            <div className="inline-block max-w-full">
                <div className="flex items-center gap-1 md:gap-3 mb-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="relative">
                            <input type="radio" name={name} id={`${name}-${num}`} value={num} required className="peer sr-only" />
                            <label htmlFor={`${name}-${num}`} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 font-bold cursor-pointer transition-all peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm text-sm md:text-base">
                                {num}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between w-full px-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-8 md:w-10">Poor</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-8 md:w-10">Excellent</span>
                </div>
            </div>
        </div>
    );
}
