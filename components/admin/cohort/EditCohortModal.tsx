'use client';

import { useState, useEffect } from 'react';
import { updateCohort } from '@/app/actions/cohorts';
import { getFinancialYear } from '@/lib/date-utils';
import {
    HiOutlineXMark,
    HiOutlinePencilSquare,
    HiOutlineArrowPath,
    HiOutlineTrash,
    HiOutlinePlusCircle,
    HiOutlineMagnifyingGlass,
    HiOutlineAcademicCap,
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

interface EditCohortModalProps {
    cohort: any;
    programs: { id: string; name: string; category: string }[];
    onClose: () => void;
}

interface SelectedProgramItem {
    tempId: string;
    id: string; // master program ID
    name: string;
    displayName?: string;
    category: string;
    linkedSessionId?: string;
    availableSessions?: any[];
    isLoadingSessions?: boolean;
}

const generateTempId = () => `stage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function EditCohortModal({ cohort, programs, onClose }: EditCohortModalProps) {
    const router = useRouter();
    const [name, setName] = useState(cohort.name || '');
    const [description, setDescription] = useState(cohort.description || '');
    const [startDate, setStartDate] = useState(cohort.cohortStartDate ? new Date(cohort.cohortStartDate).toISOString().split('T')[0] : '');
    const [endDate, setEndDate] = useState(cohort.cohortEndDate ? new Date(cohort.cohortEndDate).toISOString().split('T')[0] : '');
    const [cohortYear, setCohortYear] = useState(cohort.cohortYear || (cohort.cohortStartDate ? getFinancialYear(cohort.cohortStartDate) : ''));
    const [cohortGroup, setCohortGroup] = useState(cohort.cohortGroup || '');
    const [location, setLocation] = useState(cohort.cohortRegion || '');
    const [duration, setDuration] = useState(cohort.cohortDuration?.toString() || '');
    const [totalParticipants, setTotalParticipants] = useState(cohort.totalParticipants?.toString() || '');

    // Helper: auto-sort programs strictly by start date (ascending)
    const sortProgramsByStartDate = <T extends { linkedSessionId?: string; availableSessions?: any[] }>(items: T[]): T[] => {
        return [...items].sort((a, b) => {
            const sessionA = a.availableSessions?.find((s: any) => s.id === a.linkedSessionId);
            const sessionB = b.availableSessions?.find((s: any) => s.id === b.linkedSessionId);
            const dateA = sessionA?.startDate ? new Date(sessionA.startDate).getTime() : null;
            const dateB = sessionB?.startDate ? new Date(sessionB.startDate).getTime() : null;

            if (dateA !== null && dateB !== null) {
                return dateA - dateB;
            }
            if (dateA !== null) return -1;
            if (dateB !== null) return 1;
            return 0;
        });
    };

    // Initialize selected programs from cohort.programs, ordered by start date
    const [selectedPrograms, setSelectedPrograms] = useState<SelectedProgramItem[]>(
        () => {
            const rawPrograms = cohort.programs || [];
            const mapped = rawPrograms.map((cp: any, idx: number) => {
                const programName = cp.program?.name || cp.session?.programName || '';
                const catalogMatch = programs.find(p =>
                    (cp.program?.id && p.id === cp.program.id) ||
                    p.name.trim().toLowerCase() === programName.trim().toLowerCase()
                );
                return {
                    tempId: cp.id || `stage-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    id: cp.program?.id || catalogMatch?.id || cp.programId || cp.id,
                    name: programName,
                    displayName: cp.session?.altProgramName || cp.session?.programName || programName,
                    category: cp.program?.category || catalogMatch?.category || 'OTHER_PROGRAMS',
                    linkedSessionId: cp.session?.id || cp.sessionId || undefined,
                    isLoadingSessions: true,
                    availableSessions: cp.session ? [cp.session] : [],
                };
            }).filter((p: any) => Boolean(p.id));

            return sortProgramsByStartDate(mapped);
        }
    );

    const [availableSessions, setAvailableSessions] = useState<any[]>([]);
    const [isLoadingAvailableSessions, setIsLoadingAvailableSessions] = useState(false);
    const [sessionSearch, setSessionSearch] = useState('');
    const [selectedCatalogProgramId, setSelectedCatalogProgramId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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

    // Load available sessions for prepopulated programs in parallel without state overwrite race conditions
    useEffect(() => {
        let isMounted = true;
        const loadProgramSessions = async () => {
            const { getAvailableSessionsForProgram } = await import('@/app/actions/cohorts');

            const unLoaded = selectedPrograms.filter(p => p.isLoadingSessions);
            if (unLoaded.length === 0) return;

            await Promise.all(
                unLoaded.map(async (prog) => {
                    try {
                        const sessions = await getAvailableSessionsForProgram(prog.name);
                        if (!isMounted) return;

                        setSelectedPrograms(prev => prev.map(item => {
                            if (item.tempId !== prog.tempId) return item;
                            const existingSessionId = item.linkedSessionId;
                            const existingSessionObj = item.availableSessions?.[0];
                            let allSessions = [...sessions];
                            if (existingSessionId && existingSessionObj && !allSessions.find(s => s.id === existingSessionId)) {
                                allSessions = [existingSessionObj, ...allSessions];
                            }
                            return {
                                ...item,
                                availableSessions: allSessions,
                                isLoadingSessions: false,
                            };
                        }));
                    } catch (err) {
                        if (!isMounted) return;
                        setSelectedPrograms(prev => prev.map(item => item.tempId === prog.tempId ? { ...item, isLoadingSessions: false } : item));
                    }
                })
            );
        };
        loadProgramSessions();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addProgramFromCatalog = async (programId: string) => {
        if (!programId) return;
        setError('');
        const programMatch = programs.find(p => p.id === programId);
        if (!programMatch) return;

        const newTempId = generateTempId();
        const newProgram: SelectedProgramItem = {
            tempId: newTempId,
            id: programMatch.id,
            name: programMatch.name,
            displayName: programMatch.name,
            category: programMatch.category,
            linkedSessionId: undefined,
            isLoadingSessions: true,
            availableSessions: []
        };

        setSelectedPrograms(prev => sortProgramsByStartDate([...prev, newProgram]));
        setSelectedCatalogProgramId('');

        try {
            const { getAvailableSessionsForProgram } = await import('@/app/actions/cohorts');
            const sessions = await getAvailableSessionsForProgram(programMatch.name);
            setSelectedPrograms(prev => prev.map(p => p.tempId === newTempId ? {
                ...p,
                availableSessions: sessions,
                isLoadingSessions: false
            } : p));
        } catch (err) {
            setSelectedPrograms(prev => prev.map(p => p.tempId === newTempId ? { ...p, isLoadingSessions: false } : p));
        }
    };

    const addSession = async (session: any) => {
        setError('');
        const sessionDisplayName = session.altProgramName || session.programName;
        const programMatch = programs.find(p =>
            p.name.trim().toLowerCase() === session.programName?.trim().toLowerCase() ||
            (session.altProgramName && p.name.trim().toLowerCase() === session.altProgramName?.trim().toLowerCase())
        );

        if (!programMatch) {
            setError(`Program "${sessionDisplayName}" not found in master catalog.`);
            return;
        }

        // Check if this exact session is already linked to any stage
        if (selectedPrograms.some(sp => sp.linkedSessionId === session.id)) {
            setError(`Session "${sessionDisplayName}" is already linked to a stage in this cohort.`);
            return;
        }

        // Check if there is an unlinked placeholder stage for this program
        const unlinkedStage = selectedPrograms.find(sp => sp.id === programMatch.id && !sp.linkedSessionId);

        if (unlinkedStage) {
            setSelectedPrograms(prev => sortProgramsByStartDate(prev.map(p => {
                if (p.tempId !== unlinkedStage.tempId) return p;
                const existingList = p.availableSessions || [];
                const hasSession = existingList.some((s: any) => s.id === session.id);
                return {
                    ...p,
                    displayName: sessionDisplayName,
                    linkedSessionId: session.id,
                    availableSessions: hasSession ? existingList : [session, ...existingList]
                };
            })));
            setAvailableSessions(prev => prev.filter(s => s.id !== session.id));
            return;
        }

        // Otherwise create a new stage for this program and link the session
        const newTempId = generateTempId();
        const newProgram: SelectedProgramItem = {
            tempId: newTempId,
            id: programMatch.id,
            name: programMatch.name,
            displayName: sessionDisplayName,
            category: programMatch.category,
            linkedSessionId: session.id,
            isLoadingSessions: true,
            availableSessions: [session]
        };

        setSelectedPrograms(prev => sortProgramsByStartDate([...prev, newProgram]));
        setAvailableSessions(prev => prev.filter(s => s.id !== session.id));

        try {
            const { getAvailableSessionsForProgram } = await import('@/app/actions/cohorts');
            const sessions = await getAvailableSessionsForProgram(programMatch.name);
            setSelectedPrograms(prev => sortProgramsByStartDate(prev.map(p => p.tempId === newTempId ? {
                ...p,
                availableSessions: [session, ...sessions.filter((s: any) => s.id !== session.id)],
                isLoadingSessions: false
            } : p)));
        } catch (err) {
            setSelectedPrograms(prev => prev.map(p => p.tempId === newTempId ? { ...p, isLoadingSessions: false } : p));
        }
    };

    const removeProgram = (tempId: string) => {
        const itemToRemove = selectedPrograms.find(p => p.tempId === tempId);
        if (itemToRemove?.linkedSessionId) {
            const linked = itemToRemove.availableSessions?.find((s: any) => s.id === itemToRemove.linkedSessionId);
            if (linked) {
                setAvailableSessions(prev => {
                    if (prev.some(s => s.id === linked.id)) return prev;
                    return [linked, ...prev];
                });
            }
        }
        setSelectedPrograms(prev => prev.filter(p => p.tempId !== tempId));
    };

    const handleSubmit = async () => {
        setError('');
        if (!name.trim()) { setError('Please enter a cohort name.'); return; }
        if (selectedPrograms.length < 2) { setError('Please add at least 2 programs.'); return; }

        setIsSubmitting(true);
        const result = await updateCohort(cohort.id, {
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
            setError(result.error || 'Failed to update cohort.');
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <HiOutlinePencilSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Edit Cohort</h2>
                            <p className="text-xs text-slate-500">Update metadata and programs for {cohort.name}</p>
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Cohort Name <span className="text-red-500">*</span></label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Inplant Batch 2026"
                                    className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Cohort ID</label>
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600 truncate select-all flex items-center h-[46px]" title={cohort.id}>
                                    {cohort.id}
                                </div>
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
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase">
                                Program Sequence ({selectedPrograms.length} selected)
                            </label>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                📅 Auto-ordered by Start Date
                            </span>
                        </div>
                        {selectedPrograms.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
                                Add programs from the catalog or available sessions below. They will automatically be ordered by start date.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedPrograms.map((program, index) => {
                                    const linkedSession = program.availableSessions?.find((s: any) => s.id === program.linkedSessionId);
                                    const displayName = linkedSession?.altProgramName || linkedSession?.programName || program.displayName || program.name;
                                    return (
                                        <div
                                            key={program.tempId}
                                            className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3"
                                        >
                                            <span className="text-xs font-black text-blue-400 w-6 text-center">{index + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-slate-800">{displayName}</span>
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getCategoryColor(program.category)}`}>
                                                        {program.category}
                                                    </span>
                                                    {linkedSession?.startDate && (
                                                        <span className="text-[11px] font-bold bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                                                            📅 {new Date(linkedSession.startDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
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
                                                                const oldSessionId = program.linkedSessionId;
                                                                const chosen = program.availableSessions?.find((s: any) => s.id === val);

                                                                // Return old session to available list
                                                                if (oldSessionId && oldSessionId !== val) {
                                                                    const oldSessionObj = program.availableSessions?.find((s: any) => s.id === oldSessionId);
                                                                    if (oldSessionObj) {
                                                                        setAvailableSessions(prev => {
                                                                            if (prev.some(s => s.id === oldSessionObj.id)) return prev;
                                                                            return [oldSessionObj, ...prev];
                                                                        });
                                                                    }
                                                                }
                                                                // Remove new session from available list
                                                                if (val) {
                                                                    setAvailableSessions(prev => prev.filter(s => s.id !== val));
                                                                }

                                                                setSelectedPrograms(prev => sortProgramsByStartDate(prev.map(p => p.tempId === program.tempId ? {
                                                                    ...p,
                                                                    linkedSessionId: val || undefined,
                                                                    displayName: chosen?.altProgramName || chosen?.programName || p.name
                                                                } : p)));
                                                            }}
                                                        >
                                                            <option value="">-- No session linked (Pending) --</option>
                                                            {program.availableSessions.map((s: any) => {
                                                                const isUsedElsewhere = selectedPrograms.some(other => other.tempId !== program.tempId && other.linkedSessionId === s.id);
                                                                return (
                                                                    <option key={s.id} value={s.id} disabled={isUsedElsewhere}>
                                                                        {s.altProgramName || s.programName ? `${s.altProgramName || s.programName} — ` : ''}{s.startDate ? new Date(s.startDate).toLocaleDateString() : 'No Date'} - {s.trainerName || 'No Trainer'} ({s.status || 'Active'}){isUsedElsewhere ? ' (Linked to another stage)' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    ) : (
                                                        <span className="text-slate-400">No available sessions to link.</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => removeProgram(program.tempId)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-400 hover:text-red-600" title="Remove stage">
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add Program from Master Catalog */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                                <HiOutlineAcademicCap className="w-4 h-4 text-blue-600" />
                                Add Program from Catalog
                            </h3>
                            <span className="text-[10px] text-slate-400">Add planned stages (same program can be added multiple times)</span>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedCatalogProgramId}
                                onChange={(e) => setSelectedCatalogProgramId(e.target.value)}
                                className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                            >
                                <option value="">-- Choose a program from catalog to add --</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.category})
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                disabled={!selectedCatalogProgramId}
                                onClick={() => addProgramFromCatalog(selectedCatalogProgramId)}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                            >
                                <HiOutlinePlusCircle className="w-4 h-4" /> Add Program
                            </button>
                        </div>
                    </div>

                    {/* Available Sessions to Link */}
                    <div className="space-y-4">
                        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase">Link Existing Sessions</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Select a session to automatically add its program stage to the cohort.</p>
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
                                            type="button"
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
                            <><HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
