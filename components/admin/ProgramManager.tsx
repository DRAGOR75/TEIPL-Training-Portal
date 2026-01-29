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



import { updateProgramSections } from '@/app/actions/master-data';
import { FormSubmitButton } from '@/components/FormSubmitButton';

export default function ProgramManager({ programs, allSections }: { programs: Program[], allSections: { id: string, name: string }[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
    const [editSectionIds, setEditSectionIds] = useState<string[]>([]);

    const formRef = useRef<HTMLFormElement>(null);

    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createProgram(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else formRef.current?.reset();
    }

    async function handleSaveSections() {
        if (!editingProgramId) return;
        setLoading(true);
        const result = await updateProgramSections(editingProgramId, editSectionIds);
        setLoading(false);
        if (result?.error) {
            alert(result.error);
        } else {
            setEditingProgramId(null);
        }
    }

    function startEditing(prog: Program) {
        setEditingProgramId(prog.id);
        const currentIds = prog.sections.map(s => s.id);
        setEditSectionIds(currentIds);
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
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
                    <form ref={formRef} action={handleAdd} className="mt-4 bg-slate-50 p-6 rounded-2xl space-y-4">
                        <h4 className="text-sm font-bold text-slate-700">Add New Program</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Program Name</label>
                                <input name="name" required placeholder="Safety First Level 1" className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 text-slate-800" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                                <select name="category" className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none bg-white text-slate-800">
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
                                    <label className="flex items-center gap-2 text-sm bg-white px-4 py-3 rounded-xl border border-slate-300 cursor-pointer text-slate-600 shadow-sm hover:border-emerald-500 transition-colors">
                                        <input type="checkbox" name="targetGrades" value="EXECUTIVE" className="accent-emerald-600" /> Executive
                                    </label>
                                    <label className="flex items-center gap-2 text-sm bg-white px-4 py-3 rounded-xl border border-slate-300 cursor-pointer text-slate-600 shadow-sm hover:border-emerald-500 transition-colors">
                                        <input type="checkbox" name="targetGrades" value="WORKMAN" className="accent-emerald-600" /> Workman
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Applicable Sections (Hold Ctrl to Select Multiple)</label>
                                <select name="sectionIds" multiple className="w-full p-3 border border-slate-300 rounded-xl text-sm outline-none bg-white h-24 text-slate-700">
                                    {allSections.map(sec => (
                                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <FormSubmitButton className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                            <Plus size={16} /> Create Program
                        </FormSubmitButton>
                    </form>

                    <div className="mt-6 space-y-3">
                        {programs.map((prog) => (
                            <div key={prog.id} className="p-5 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition bg-white gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-800">{prog.name}</h4>
                                        <button
                                            onClick={() => startEditing(prog)}
                                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium border border-slate-200"
                                        >
                                            Edit Sections
                                        </button>
                                    </div>

                                    {editingProgramId === prog.id ? (
                                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in zoom-in-95">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Edit Applicable Sections</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {allSections.map(sec => (
                                                    <label key={sec.id} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${editSectionIds.includes(sec.id) ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={editSectionIds.includes(sec.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setEditSectionIds([...editSectionIds, sec.id]);
                                                                else setEditSectionIds(editSectionIds.filter(id => id !== sec.id));
                                                            }}
                                                        />
                                                        {sec.name}
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveSections} disabled={loading} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700">Save</button>
                                                <button onClick={() => setEditingProgramId(null)} className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-50">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-1">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{prog.category}</span>
                                                {prog.targetGrades.map(g => (
                                                    <span key={g} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{g}</span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Sections: {prog.sections.map(s => s.name).join(', ') || 'All'}</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => { if (confirm('Delete program?')) deleteProgram(prog.id) }}
                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
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
