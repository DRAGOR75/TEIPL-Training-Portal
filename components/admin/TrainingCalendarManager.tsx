'use client';

import { useState, useMemo, useTransition } from 'react';
import { HiOutlineCalendar, HiOutlinePlus, HiOutlineCheckCircle, HiOutlineTableCells, HiOutlineCalendarDays, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import GanttCalendar from '@/components/planning/GanttCalendar';
import CreateSessionModal from '@/components/admin/CreateSessionModal';
import EditSessionModal from '@/components/admin/EditSessionModal';
import { deleteTrainingSession } from '@/app/actions/delete-session';

export default function TrainingCalendarManager({ programs, trainers, allSessions, locations }: any) {
    const [isPending, startTransition] = useTransition();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this scheduled session? This action cannot be undone.")) {
            startTransition(async () => {
                const res = await deleteTrainingSession(id);
                if (!res.success) {
                    alert(res.error || "Failed to delete session.");
                }
            });
        }
    };

    const unifiedEvents = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const startOfMonth = new Date(year, month, 1).getTime();
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

        const scheduled = (allSessions || []).filter((session: any) => {
            if (selectedTrainer) {
                if (selectedTrainer === 'Unassigned') {
                    return !session.trainerName || session.trainerName === 'Unassigned' || session.trainerName === 'TBD';
                }
                if (!session.trainerName) return false;
                const sessionTrainers = session.trainerName.split(/,|&|\band\b/i).map((t: string) => t.trim());
                return sessionTrainers.includes(selectedTrainer);
            }

            const sStart = new Date(session.startDate).getTime();
            const sEnd = new Date(session.endDate).getTime();
            return sStart <= endOfMonth && sEnd >= startOfMonth;
        }).map((session: any) => ({
            id: session.id,
            isConfirmed: true,
            programName: session.programName,
            startDate: session.startDate,
            endDate: session.endDate,
            trainer: session.trainerName,
            location: session.location,
            enrolledCount: session.enrollments?.length || 0,
            capacity: '∞',
            originalSession: session
        }));

        return scheduled.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [allSessions, viewDate, selectedTrainer]);

    return (
        <div className="space-y-12">
            <div>
                <GanttCalendar
                    programs={programs}
                    trainers={trainers}
                    locations={locations || []}
                    sessions={allSessions || []}
                    viewDate={viewDate}
                    onViewDateChange={setViewDate}
                />
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-end mb-6 px-2">
                    <h3 className="text-xl font-black text-slate-800">
                        Scheduled Programs {selectedTrainer ? `- ${selectedTrainer}` : `- ${viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`}
                    </h3>
                    <CreateSessionModal
                        trainers={trainers}
                        programs={programs}
                        locations={locations || []}
                        triggerComponent={
                            <button
                                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                            >
                                <HiOutlinePlus size={18} />
                                Add Program
                            </button>
                        }
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                            <tr className="border-b border-slate-200">
                                <th className="px-4 py-3">Program Name</th>
                                <th className="px-4 py-3">Dates</th>
                                <th className="px-4 py-3">Trainer</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {unifiedEvents.map((event: any) => {
                                const startDate = new Date(event.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                const endDate = new Date(event.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                                return (
                                    <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-2 align-middle">
                                            <div className="font-bold text-slate-900 text-[11px] truncate">{event.programName}</div>
                                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                                                {event.enrolledCount} Nominated
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            <div className="font-medium text-slate-600 text-[11px]">{startDate} - {endDate}</div>
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            <div className="font-medium text-slate-600 text-[11px]">
                                                {event.trainer ? (
                                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200">{event.trainer}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic">TBD</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            <div className="font-medium text-slate-600 text-[11px]">
                                                {event.location ? (
                                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200">{event.location}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic">TBD</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                                <HiOutlineCheckCircle size={12} /> Scheduled
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 align-middle text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <EditSessionModal
                                                    session={event.originalSession}
                                                    trainers={trainers}
                                                    locations={locations || []}
                                                    triggerComponent={
                                                        <button
                                                            className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors"
                                                            title="Edit Session"
                                                        >
                                                            <HiOutlinePencilSquare size={14} />
                                                        </button>
                                                    }
                                                />
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    disabled={isPending}
                                                    className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors disabled:opacity-50"
                                                >
                                                    <HiOutlineTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {unifiedEvents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                        <HiOutlineCalendar className="mx-auto text-4xl text-slate-300 mb-3" />
                                        <h3 className="text-lg font-bold text-slate-500">No Events Scheduled</h3>
                                        <p className="text-slate-400 text-sm">Click "Schedule Event" to create a new session.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
