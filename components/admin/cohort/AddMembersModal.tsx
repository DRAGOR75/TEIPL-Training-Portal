'use client';

import { useState, useEffect } from 'react';
import { searchEmployeesForCohort, addMembersToCohort } from '@/app/actions/cohorts';
import {
    HiOutlineXMark,
    HiOutlineMagnifyingGlass,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineUserPlus,
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

interface AddMembersModalProps {
    cohortId: string;
    onClose: () => void;
}

export default function AddMembersModal({ cohortId, onClose }: AddMembersModalProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addResult, setAddResult] = useState<{ added?: number; error?: string } | null>(null);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const employees = await searchEmployeesForCohort(query, cohortId);
            setResults(employees);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, cohortId]);

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleAdd = async () => {
        if (selectedIds.size === 0) return;
        setIsAdding(true);
        setAddResult(null);

        const result = await addMembersToCohort(cohortId, Array.from(selectedIds));

        if (result.success) {
            setAddResult({ added: result.added });
            setSelectedIds(new Set());
            // Re-search to update "already in cohort" badges
            if (query.length >= 2) {
                const employees = await searchEmployeesForCohort(query, cohortId);
                setResults(employees);
            }
            router.refresh();
        } else {
            setAddResult({ error: result.error });
        }
        setIsAdding(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <HiOutlineUserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Add Members</h2>
                            <p className="text-xs text-slate-500">Search employees by name, ID, or email</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <HiOutlineXMark className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search by name, ID, or email..."
                            autoFocus
                            className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                        />
                        {isSearching && (
                            <HiOutlineArrowPath className="absolute right-3 top-3 text-slate-400 w-5 h-5 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                    {addResult && (
                        <div className={`mx-4 mt-3 p-3 rounded-xl text-sm font-medium ${addResult.added !== undefined ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {addResult.added !== undefined ? `✓ Added ${addResult.added} member(s) to cohort.` : addResult.error}
                        </div>
                    )}

                    {results.length === 0 && query.length >= 2 && !isSearching && (
                        <div className="p-8 text-center text-slate-400 text-sm">No employees found.</div>
                    )}

                    {results.length === 0 && query.length < 2 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            Type at least 2 characters to search.
                        </div>
                    )}

                    <div className="divide-y divide-slate-100">
                        {results.map(emp => {
                            const isInCohort = emp.isInCohort;
                            const isSelected = selectedIds.has(emp.id);

                            return (
                                <button
                                    key={emp.id}
                                    onClick={() => !isInCohort && toggleSelect(emp.id)}
                                    disabled={isInCohort}
                                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${isInCohort
                                        ? 'opacity-50 cursor-not-allowed bg-slate-50'
                                        : isSelected
                                            ? 'bg-blue-50/50'
                                            : 'hover:bg-slate-50 cursor-pointer'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isInCohort
                                        ? 'border-green-300 bg-green-100'
                                        : isSelected
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-slate-300'
                                        }`}>
                                        {(isInCohort || isSelected) && <HiOutlineCheckCircle className={`w-4 h-4 ${isInCohort ? 'text-green-600' : 'text-white'}`} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {emp.id} · {emp.email} {emp.sectionName ? `· ${emp.sectionName}` : ''}
                                        </div>
                                    </div>
                                    {isInCohort && (
                                        <span className="text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                                            In Cohort
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-medium">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Done
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={selectedIds.size === 0 || isAdding}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAdding ? (
                                <><HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Adding...</>
                            ) : (
                                `Add ${selectedIds.size} Member(s)`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
