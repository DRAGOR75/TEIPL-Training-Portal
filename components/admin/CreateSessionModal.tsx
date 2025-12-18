'use client'

import { useState } from 'react';
import { createTrainingSession } from '@/app/actions'; // Ensure this action exists in app/actions/index.ts or similar

export default function CreateSessionModal({ trainers }: { trainers: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

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
            <button onClick={() => setIsOpen(true)} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold transition shadow-sm">
                + Schedule New Session
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800">New Training Session</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form action={async (formData) => {
                    await createTrainingSession(formData);
                    setIsOpen(false);
                    window.location.reload();
                }} className="p-6 space-y-4 text-left">

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Program Name</label>
                        <input name="programName" required placeholder="e.g. Advanced Java" className="w-full p-2.5 border border-slate-300 rounded-lg" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Trainer</label>
                        <select name="trainerName" required className="w-full p-2.5 border border-slate-300 rounded-lg bg-white">
                            <option value="">-- Select Trainer --</option>
                            {trainers.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                        {trainers.length === 0 && <p className="text-xs text-red-500 mt-1">No trainers found. Add one in "Manage Trainers" first.</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                            <input name="startDate" required type="date" className="w-full p-2.5 border border-slate-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                            <input
                                name="endDate"
                                required
                                type="date"
                                onChange={handleEndDateChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <label className="block text-xs font-bold text-blue-800 mb-1">
                            Feedback Trigger Date (Level 3)
                        </label>
                        <input
                            id="feedbackCreationDate"
                            name="feedbackCreationDate"
                            required
                            type="date"
                            className="w-full p-2 border border-blue-200 rounded text-sm"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm">Create Session</button>
                    </div>

                </form>
            </div>
        </div>
    );
}