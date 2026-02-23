'use client';

import { useState } from 'react';
import { createCohort } from '@/app/actions/cohorts';
import {
    HiOutlineXMark,
    HiOutlineAcademicCap,
    HiOutlineArrowPath,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineTrash,
    HiOutlinePlusCircle,
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

interface CreateCohortModalProps {
    programs: { id: string; name: string; category: string }[];
    onClose: () => void;
}

export default function CreateCohortModal({ programs, onClose }: CreateCohortModalProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPrograms, setSelectedPrograms] = useState<{ id: string; name: string; category: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const availablePrograms = programs.filter(p =>
        !selectedPrograms.find(sp => sp.id === p.id) &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const addProgram = (program: { id: string; name: string; category: string }) => {
        setSelectedPrograms(prev => [...prev, program]);
    };

    const removeProgram = (id: string) => {
        setSelectedPrograms(prev => prev.filter(p => p.id !== id));
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newList = [...selectedPrograms];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        setSelectedPrograms(newList);
    };

    const moveDown = (index: number) => {
        if (index === selectedPrograms.length - 1) return;
        const newList = [...selectedPrograms];
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        setSelectedPrograms(newList);
    };

    const handleSubmit = async () => {
        setError('');
        if (!name.trim()) { setError('Please enter a cohort name.'); return; }
        if (selectedPrograms.length < 2) { setError('Please add at least 2 programs.'); return; }

        setIsSubmitting(true);
        const result = await createCohort({
            name: name.trim(),
            description: description.trim() || undefined,
            programIds: selectedPrograms.map(p => p.id),
        });

        if (result.success) {
            router.refresh();
            onClose();
        } else {
            setError(result.error || 'Failed to create cohort.');
            setIsSubmitting(false);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'FOUNDATIONAL': return 'bg-purple-50 text-purple-600';
            case 'FUNCTIONAL': return 'bg-blue-50 text-blue-600';
            case 'BEHAVIOURAL': return 'bg-amber-50 text-amber-600';
            case 'COMMON': return 'bg-slate-100 text-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <HiOutlineAcademicCap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Create Cohort</h2>
                            <p className="text-xs text-slate-500">Design a multi-program learning journey</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <HiOutlineXMark className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">{error}</div>
                    )}

                    {/* Name & Description */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Cohort Name <span className="text-red-500">*</span></label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Inplant Batch 2026, Technicians Batch"
                                className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Optional description for this cohort..."
                                rows={2}
                                className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Selected Programs (Ordered) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">
                            Program Sequence ({selectedPrograms.length} selected)
                        </label>
                        {selectedPrograms.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
                                Add programs from the list below. You can reorder them.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedPrograms.map((program, index) => (
                                    <div
                                        key={program.id}
                                        className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3"
                                    >
                                        <span className="text-xs font-black text-blue-400 w-6 text-center">{index + 1}</span>
                                        <div className="flex-1">
                                            <span className="text-sm font-semibold text-slate-800">{program.name}</span>
                                            <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getCategoryColor(program.category)}`}>
                                                {program.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 hover:bg-blue-100 rounded disabled:opacity-30 transition-colors">
                                                <HiOutlineChevronUp className="w-4 h-4 text-blue-600" />
                                            </button>
                                            <button onClick={() => moveDown(index)} disabled={index === selectedPrograms.length - 1} className="p-1 hover:bg-blue-100 rounded disabled:opacity-30 transition-colors">
                                                <HiOutlineChevronDown className="w-4 h-4 text-blue-600" />
                                            </button>
                                            <button onClick={() => removeProgram(program.id)} className="p-1 hover:bg-red-100 rounded transition-colors">
                                                <HiOutlineTrash className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Available Programs (Searchable) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase">
                                Available Programs ({availablePrograms.length})
                            </label>
                            <div className="relative w-48">
                                <input
                                    type="text"
                                    placeholder="Search programs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full text-xs p-2 pl-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                            {availablePrograms.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    {searchQuery ? 'No programs match your search.' : 'All programs have been added.'}
                                </div>
                            ) : (
                                availablePrograms.map(program => (
                                    <button
                                        key={program.id}
                                        onClick={() => addProgram(program)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left group"
                                    >
                                        <HiOutlinePlusCircle className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                        <span className="text-sm font-medium text-slate-700 flex-1">{program.name}</span>
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getCategoryColor(program.category)}`}>
                                            {program.category}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        {isSubmitting ? (
                            <><HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Creating...</>
                        ) : (
                            'Create Cohort'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
