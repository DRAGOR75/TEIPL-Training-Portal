'use client';

import { useState, useRef } from 'react';
import { createProgram, deleteProgram } from '@/app/actions/master-data';
import { Trash2, BookOpen, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { TrainingCategory, Grade } from '@prisma/client';

interface Program {
    id: string;
    name: string;
    category: TrainingCategory;
    targetGrades: Grade[];
    sections: { id: string, name: string }[];
}

export default function ProgramManager({ programs, allSections }: { programs: Program[], allSections: { id: string, name: string }[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createProgram(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else formRef.current?.reset();
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Training Programs</h3>
                        <p className="text-xs text-slate-500">{programs.length} Active Courses</p>
                    </div>
                </div>
                <div className="text-blue-600">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
                    <form ref={formRef} action={handleAdd} className="mt-4 bg-slate-50 p-4 rounded-lg space-y-4">
                        <h4 className="text-sm font-bold text-slate-700">Add New Program</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Program Name</label>
                                <input name="name" required placeholder="Safety First Level 1" className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                                <select name="category" className="w-full p-2 border border-slate-300 rounded text-sm outline-none bg-white">
                                    <option value="FUNCTIONAL">Functional</option>
                                    <option value="BEHAVIOURAL">Behavioural</option>
                                    <option value="COMMON">Common</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Grades</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded border border-slate-300 cursor-pointer">
                                        <input type="checkbox" name="targetGrades" value="EXECUTIVE" className="accent-emerald-600" /> Executive
                                    </label>
                                    <label className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded border border-slate-300 cursor-pointer">
                                        <input type="checkbox" name="targetGrades" value="WORKMAN" className="accent-emerald-600" /> Workman
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Applicable Sections (Hold Ctrl to Select Multiple)</label>
                                <select name="sectionIds" multiple className="w-full p-2 border border-slate-300 rounded text-sm outline-none bg-white h-20 text-slate-700">
                                    {allSections.map(sec => (
                                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button disabled={loading} className="w-full py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                            <Plus size={16} /> Create Program
                        </button>
                    </form>

                    <div className="mt-6 space-y-3">
                        {programs.map((prog) => (
                            <div key={prog.id} className="p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition bg-white gap-4">
                                <div>
                                    <h4 className="font-bold text-slate-800">{prog.name}</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{prog.category}</span>
                                        {prog.targetGrades.map(g => (
                                            <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{g}</span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Sections: {prog.sections.map(s => s.name).join(', ') || 'All'}</p>
                                </div>

                                <button
                                    onClick={() => { if (confirm('Delete program?')) deleteProgram(prog.id) }}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
