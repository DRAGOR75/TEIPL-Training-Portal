'use client'

import { useState } from 'react';
import { createTrainingSession } from '@/app/actions';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { HiOutlineXMark } from 'react-icons/hi2';

export default function CreateSessionModal({ trainers }: { trainers: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTrainer, setSelectedTrainer] = useState<string>('');

    // Auto-calculate Feedback Date (+25 days)
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const end = new Date(e.target.value);
        if (!isNaN(end.getTime())) {
            end.setDate(end.getDate() + 25);
            const suggestedDate = end.toISOString().split('T')[0];
            const feedbackInput = document.getElementById('feedbackCreationDate') as HTMLInputElement;
            if (feedbackInput) feedbackInput.value = suggestedDate;
        }
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold transition shadow-sm">
                + Schedule New Session
            </button>
        );
    }

    const trainerOptions = trainers.map(t => ({ label: t.name, value: t.name }));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800">New Training Session</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><HiOutlineXMark size={24} /></button>
                </div>

                <form action={async (formData) => {
                    if (!selectedTrainer) {
                        alert("Please select a trainer.");
                        return;
                    }

                    // Manually append selected trainer if needed, though hidden input is reliable if inside form
                    // But standard form action might not pick up SearchableSelect state unless we use hidden input
                    formData.set('trainerName', selectedTrainer);

                    try {
                        const result = await createTrainingSession(formData);
                        if (result.success) {
                            setIsOpen(false);
                            // Optional: Show success toast?
                            // window.location.reload(); // Server action should handle revalidation
                        } else {
                            alert(result.message || "Failed to create session.");
                        }
                    } catch (err) {
                        console.error(err);
                        alert("An unexpected error occurred.");
                    }
                }} className="p-6 space-y-4 text-left">

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Program Name</label>
                        <input name="programName" required placeholder="Training Name" className="w-full p-2.5 border border-slate-300 rounded-xl" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Trainer</label>
                        <div className="relative">
                            <SearchableSelect
                                options={trainerOptions}
                                value={selectedTrainer}
                                onChange={(val) => setSelectedTrainer(typeof val === 'string' ? val : String(val))}
                                placeholder="Select Trainer"
                                searchPlaceholder="Search trainers..."
                                className="w-full"
                            />
                        </div>
                        {trainers.length === 0 && <p className="text-xs text-red-500 mt-1">No trainers found. Add one in "Manage Trainers" first.</p>}
                        {/* Hidden input to ensure FormData picks it up if JS submit logic relies on it, or transparency */}
                        <input type="hidden" name="trainerName" value={selectedTrainer} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                            <input name="startDate" required type="date" className="w-full p-2.5 border border-slate-300 rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                            <input
                                name="endDate"
                                required
                                type="date"
                                onChange={handleEndDateChange}
                                className="w-full p-2.5 border border-slate-300 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Hidden Field for Logic Continuity */}
                    <input
                        id="feedbackCreationDate"
                        name="feedbackCreationDate"
                        required
                        type="hidden"
                    />

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium">Cancel</button>
                        <FormSubmitButton className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm hover:shadow-md">
                            Create Session
                        </FormSubmitButton>
                    </div>

                </form>
            </div>
        </div>
    );
}