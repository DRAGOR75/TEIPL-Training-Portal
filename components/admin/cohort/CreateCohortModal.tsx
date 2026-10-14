'use client';

import { useState, useEffect } from 'react';
import { createCohort } from '@/app/actions/cohorts';
import { getFinancialYear } from '@/lib/date-utils';
import {
    HiOutlineXMark,
    HiOutlineAcademicCap,
    HiOutlineArrowPath,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineTrash,
    HiOutlinePlusCircle,
    HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

interface CreateCohortModalProps {
    programs: { id: string; name: string; category: string }[];
    onClose: () => void;
}

export default function CreateCohortModal({ programs, onClose }: CreateCohortModalProps) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [cohortId, setCohortId] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [cohortYear, setCohortYear] = useState('');
    const [cohortGroup, setCohortGroup] = useState('');
    const [location, setLocation] = useState('');
    const [totalParticipants, setTotalParticipants] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedPrograms, setSelectedPrograms] = useState<{ id: string; name: string; displayName?: string; category: string; linkedSessionId?: string; availableSessions?: any[]; isLoadingSessions?: boolean }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [availableSessions, setAvailableSessions] = useState<any[]>([]);
    const [isLoadingAvailableSessions, setIsLoadingAvailableSessions] = useState(false);
    const [sessionSearch, setSessionSearch] = useState('');

    const filteredAvailableSessions = availableSessions.filter(session => {
        if (!sessionSearch.trim()) return true;
        const q = sessionSearch.toLowerCase();
        const displayName = session.altProgramName || session.programName;
        const matchProgram = displayName?.toLowerCase().includes(q) || session.programName?.toLowerCase().includes(q);
        const matchTrainer = session.trainerName?.toLowerCase().includes(q);
        const matchLocation = session.location?.toLowerCase().includes(q);
        const matchStatus = session.status?.toLowerCase().includes(q);
        return matchProgram || matchTrainer || matchLocation || matchStatus;
    });

    useEffect(() => {
        if (startDate) {
            setCohortYear(getFinancialYear(startDate));
        } else {
            setCohortYear('');
        }
    }, [startDate]);

    useEffect(() => {
        async function fetchSessions() {
            setIsLoadingAvailableSessions(true);
            try {
                const { getAllAvailableSessionsForCohort } = await import('@/app/actions/cohorts');
                const sessions = await getAllAvailableSessionsForCohort();
                setAvailableSessions(sessions);
            } catch (err) {
                console.error(err);
            }
            setIsLoadingAvailableSessions(false);
        }
        fetchSessions();
    }, []);

    // availablePrograms and addProgram were removed since standalone program selection is removed

    const addSession = async (session: any) => {
        // Find matching program
        const sessionDisplayName = session.altProgramName || session.programName;
        const programMatch = programs.find(p => p.name === session.programName || (session.altProgramName && p.name === session.altProgramName));
        if (!programMatch) {
            setError(`Program ${sessionDisplayName} not found in master catalog.`);
            return;
        }
        // Avoid adding the same program twice
        if (selectedPrograms.some(sp => sp.id === programMatch.id)) {
            setError(`Program ${sessionDisplayName} is already in the sequence.`);
            return;
        }

        setSelectedPrograms(prev => [...prev, {
            ...programMatch,
            displayName: sessionDisplayName,
            linkedSessionId: session.id,
            isLoadingSessions: true,
            availableSessions: [session]
        }]);

        setAvailableSessions(prev => prev.filter(s => s.id !== session.id));

        try {
            const { getAvailableSessionsForProgram } = await import('@/app/actions/cohorts');
            const sessions = await getAvailableSessionsForProgram(programMatch.name);
            setSelectedPrograms(prev => prev.map(p => p.id === programMatch.id ? { 
                ...p, 
                availableSessions: [session, ...sessions.filter((s: any) => s.id !== session.id)], 
                isLoadingSessions: false 
            } : p));
        } catch (err) {
            setSelectedPrograms(prev => prev.map(p => p.id === programMatch.id ? { ...p, isLoadingSessions: false } : p));
        }
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
            id: cohortId.trim() || undefined,
            name: name.trim(),
            description: description.trim() || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            cohortYear: cohortYear.trim() || (startDate ? getFinancialYear(startDate) : undefined),
            cohortGroup: cohortGroup.trim() || undefined,
            location: location.trim() || undefined,
            duration: duration ? parseInt(duration, 10) : undefined,
            totalParticipants: totalParticipants ? parseInt(totalParticipants, 10) : undefined,
            programs: selectedPrograms.map(p => ({
                id: p.id,
                sessionId: p.linkedSessionId
            })),
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
            case 'MINING_PROGRAMS': return 'bg-emerald-50 text-emerald-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Create Training Cohort</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Build a structured learning journey across multiple programs</p>
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

                    {/* Name, Cohort ID & Description */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Cohort Name <span className="text-red-500">*</span></label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Inplant Batch 2026, Technicians Batch"
                                    className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                                    <span>Cohort ID</span>
                                    <span className="text-[10px] text-slate-400 font-normal lowercase">optional</span>
                                </label>
                                <input
                                    value={cohortId}
                                    onChange={e => setCohortId(e.target.value)}
                                    placeholder="e.g. CH-2026-001"
                                    className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition-all"
                                />
                            </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                                <span>Financial Year</span>
                                <span className="text-[10px] text-blue-600 font-semibold lowercase">auto</span>
                            </label>
                            <input
                                type="text"
                                value={cohortYear}
                                onChange={e => setCohortYear(e.target.value)}
                                placeholder="e.g. 24-25"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 transition-all font-mono"
                                title="Auto-calculated from Start Date in YY-YY format"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Cohort Group</label>
                            <input
                                type="text"
                                value={cohortGroup}
                                onChange={e => setCohortGroup(e.target.value)}
                                placeholder="e.g. Inplant Trainees, GETs, Technicians"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g. TRC, Regional Office"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Total No. of Participants</label>
                            <input
                                type="number"
                                min="1"
                                value={totalParticipants}
                                onChange={e => setTotalParticipants(e.target.value)}
                                placeholder="e.g. 50"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Duration (in days)</label>
                            <input
                                type="number"
                                min="1"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                placeholder="e.g. 5"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
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
                                {selectedPrograms.map((program, index) => {
                                    const linkedSession = program.availableSessions?.find((s: any) => s.id === program.linkedSessionId);
                                    const displayName = linkedSession?.altProgramName || linkedSession?.programName || program.displayName || program.name;
                                    return (
                                        <div
                                            key={program.id}
                                            className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3"
                                        >
                                            <span className="text-xs font-black text-blue-400 w-6 text-center">{index + 1}</span>
                                            <div className="flex-1">
                                                <span className="text-sm font-semibold text-slate-800">{displayName}</span>
                                                <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getCategoryColor(program.category)}`}>
                                                    {program.category}
                                                </span>
                                                <div className="mt-2 text-xs">
                                                    {program.isLoadingSessions ? (
                                                        <span className="text-slate-500 flex items-center gap-1">
                                                            <HiOutlineArrowPath className="w-3 h-3 animate-spin" /> Loading sessions...
                                                        </span>
                                                    ) : program.availableSessions && program.availableSessions.length > 0 ? (
                                                        <select
                                                            className="w-full p-2 border border-slate-200 rounded outline-none text-slate-700"
                                                            value={program.linkedSessionId || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const chosen = program.availableSessions?.find((s: any) => s.id === val);
                                                                setSelectedPrograms(prev => prev.map(p => p.id === program.id ? { 
                                                                    ...p, 
                                                                    linkedSessionId: val,
                                                                    displayName: chosen?.altProgramName || chosen?.programName || p.name
                                                                } : p));
                                                            }}
                                                        >
                                                            <option value="">-- No session linked (Pending) --</option>
                                                            {program.availableSessions.map((s: any) => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.altProgramName || s.programName ? `${s.altProgramName || s.programName} — ` : ''}{new Date(s.startDate).toLocaleDateString()} - {s.trainerName || 'No Trainer'} ({s.status})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-slate-400">No available sessions to link.</span>
                                                    )}
                                                </div>
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
                                );
                            })}
                            </div>
                        )}
                    </div>

                    {/* Available Sessions to Link */}
                    <div className="space-y-4">
                        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase">Link Existing Sessions</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Select a session to automatically add its program to the cohort.</p>
                            </div>
                            {availableSessions.length > 0 && (
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                    {sessionSearch.trim() ? `${filteredAvailableSessions.length} of ${availableSessions.length}` : `${availableSessions.length} available`}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {/* Search Box */}
                            {availableSessions.length > 0 && (
                                <div className="relative">
                                    <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={sessionSearch}
                                        onChange={e => setSessionSearch(e.target.value)}
                                        placeholder="Search by program, trainer, location, or status..."
                                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                    {sessionSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setSessionSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                                            title="Clear search"
                                        >
                                            <HiOutlineXMark className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="max-h-[200px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {isLoadingAvailableSessions ? (
                                    <div className="p-4 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Loading sessions...
                                    </div>
                                ) : availableSessions.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-sm">
                                        No active sessions available to link.
                                    </div>
                                ) : filteredAvailableSessions.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm space-y-1">
                                        <p>No sessions match &quot;{sessionSearch}&quot;.</p>
                                        <button
                                            type="button"
                                            onClick={() => setSessionSearch('')}
                                            className="text-xs text-blue-600 hover:underline font-medium"
                                        >
                                            Clear search
                                        </button>
                                    </div>
                                ) : (
                                    filteredAvailableSessions.map(session => (
                                        <button
                                            key={session.id}
                                            onClick={() => addSession(session)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left group"
                                        >
                                            <HiOutlinePlusCircle className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-slate-800">{session.altProgramName || session.programName}</div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(session.startDate).toLocaleDateString()} - {session.trainerName || 'No Trainer'}
                                                    {session.location ? ` • ${session.location}` : ''}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600`}>
                                                {session.status}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
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
