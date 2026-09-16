'use client';

import { useState, useEffect } from 'react';
import { linkExistingSessionToCohortProgram, getAvailableSessionsForProgram } from '@/app/actions/cohorts';
import {
    HiOutlineXMark,
    HiOutlineLink,
    HiOutlineArrowPath,
    HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

interface LinkSessionModalProps {
    cohortProgram: any;
    cohortName: string;
    onClose: () => void;
}

export default function LinkSessionModal({ cohortProgram, cohortName, onClose }: LinkSessionModalProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const filteredSessions = sessions.filter(session => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const matchTrainer = session.trainerName?.toLowerCase().includes(q);
        const matchLoc = session.location?.toLowerCase().includes(q);
        const matchStatus = session.status?.toLowerCase().includes(q);
        const matchDates = `${session.startDate} ${session.endDate}`.toLowerCase().includes(q);
        return matchTrainer || matchLoc || matchStatus || matchDates;
    });

    useEffect(() => {
        async function fetchSessions() {
            setIsLoadingSessions(true);
            const data = await getAvailableSessionsForProgram(cohortProgram.program.name);
            setSessions(data);
            setIsLoadingSessions(false);
        }
        fetchSessions();
    }, [cohortProgram.program.name]);

    const handleSubmit = async () => {
        setError('');
        if (!selectedSessionId) {
            setError('Please select a session to link.');
            return;
        }

        setIsSubmitting(true);
        const result = await linkExistingSessionToCohortProgram(cohortProgram.id, selectedSessionId);

        if (result.success) {
            router.refresh();
            onClose();
        } else {
            setError(result.error || 'Failed to link session.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <HiOutlineLink className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Link Existing Session</h2>
                            <p className="text-xs text-slate-500">{cohortName} — {cohortProgram.program.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <HiOutlineXMark className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">{error}</div>
                    )}

                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-xl text-xs">
                        🔗 Select a past or currently running session for this program to associate it with the cohort.
                    </div>

                    {/* Session Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase">Available Sessions <span className="text-red-500">*</span></label>
                            {sessions.length > 0 && (
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {search.trim() ? `${filteredSessions.length} of ${sessions.length}` : `${sessions.length} available`}
                                </span>
                            )}
                        </div>

                        {sessions.length > 2 && (
                            <div className="relative">
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by trainer, date, location..."
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                                        title="Clear search"
                                    >
                                        <HiOutlineXMark className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {isLoadingSessions ? (
                            <div className="p-4 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                                <HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Loading sessions...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm text-center">
                                No unlinked sessions found for &quot;{cohortProgram.program.name}&quot;.
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm space-y-1 border border-slate-200 rounded-xl">
                                <p>No sessions match &quot;{search}&quot;.</p>
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                    Clear search
                                </button>
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {filteredSessions.map(session => (
                                    <label key={session.id} className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedSessionId === session.id ? 'bg-blue-50/50' : ''}`}>
                                        <input
                                            type="radio"
                                            name="sessionSelection"
                                            value={session.id}
                                            checked={selectedSessionId === session.id}
                                            onChange={() => setSelectedSessionId(session.id)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {new Date(session.startDate).toLocaleDateString()} to {new Date(session.endDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                                                <span>Status: <span className="font-semibold">{session.status}</span></span>
                                                {session.trainerName && <span>• Trainer: {session.trainerName}</span>}
                                                {session.location && <span>• Loc: {session.location}</span>}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
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
                        disabled={isSubmitting || !selectedSessionId}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        {isSubmitting ? (
                            <><HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Linking...</>
                        ) : (
                            'Link Session'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
