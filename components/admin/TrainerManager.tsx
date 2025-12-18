'use client'

import { useState, useRef } from 'react';
import { addTrainer, deleteTrainer } from '@/app/actions/trainers';

type Trainer = {
    id: string;
    name: string;
    expertise: string | null;
};

export default function TrainerManager({ trainers }: { trainers: Trainer[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleAddTrainer(formData: FormData) {
        const result = await addTrainer(formData);
        if (result.error) {
            alert(result.error);
        } else {
            formRef.current?.reset();
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h3 className="text-lg font-bold text-slate-800">👨‍🏫 Manage Trainers</h3>
                <button className="text-blue-600 text-sm font-semibold hover:underline">
                    {isExpanded ? "Hide Section" : "Show / Add Trainers"}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-6 space-y-6 animate-in slide-in-from-top-2">

                    {/* Add Form */}
                    <form ref={formRef} action={handleAddTrainer} className="flex gap-3 items-end bg-slate-50 p-4 rounded-lg">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Name</label>
                            <input name="name" required placeholder="e.g. Mr. Amit" className="w-full p-2 border rounded text-sm" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Expertise</label>
                            <input name="expertise" placeholder="e.g. Java" className="w-full p-2 border rounded text-sm" />
                        </div>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 text-sm">
                            + Add
                        </button>
                    </form>

                    {/* List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {trainers.map((t) => (
                            <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                                    <p className="text-xs text-slate-500">{t.expertise || "General"}</p>
                                </div>
                                <button
                                    onClick={() => deleteTrainer(t.id)}
                                    className="text-red-400 hover:text-red-600 text-xs px-2"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {trainers.length === 0 && <p className="text-slate-400 text-sm italic">No trainers added yet.</p>}
                    </div>

                </div>
            )}
        </div>
    );
}