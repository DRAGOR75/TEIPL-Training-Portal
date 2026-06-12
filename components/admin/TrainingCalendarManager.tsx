'use client';

import { useState, useTransition, useMemo } from 'react';
import { HiOutlineCalendar, HiOutlinePlus, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineTableCells, HiOutlineCalendarDays } from 'react-icons/hi2';
import { createCalendarEvent, confirmCalendarEvent, cancelCalendarEvent } from '@/app/actions/calendar';
import GanttCalendar from '@/components/planning/GanttCalendar';

export default function TrainingCalendarManager({ calendarEvents, programs, trainers, allSessions }: any) {
    const [isPending, startTransition] = useTransition();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

    // Form states for creating event
    const [selectedProgram, setSelectedProgram] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [proposedTrainer, setProposedTrainer] = useState('');
    const [proposedLocation, setProposedLocation] = useState('');
    const [capacity, setCapacity] = useState('20');

    // Form states for confirming event
    const [trainerName, setTrainerName] = useState('');
    const [location, setLocation] = useState('');
    const [startTime, setStartTime] = useState('8:30 am');
    const [endTime, setEndTime] = useState('6:00 pm');

    // Unified List of Events for the Table
    const unifiedEvents = useMemo(() => {
        const forming = calendarEvents.map((evt: any) => ({
            id: evt.id,
            isConfirmed: false,
            programName: evt.program.name,
            startDate: evt.proposedStartDate,
            endDate: evt.proposedEndDate,
            trainer: evt.proposedTrainer,
            location: evt.proposedLocation,
            enrolledCount: evt.nominations?.length || 0,
            capacity: evt.capacity || '∞'
        }));

        const scheduled = (allSessions || []).map((session: any) => ({
            id: session.id,
            isConfirmed: true,
            programName: session.programName,
            startDate: session.startDate,
            endDate: session.endDate,
            trainer: session.trainerName,
            location: session.location,
            enrolledCount: session.enrollments?.length || 0,
            capacity: '∞' // Training sessions don't enforce strict DB capacity here visually, but you could adjust this if needed
        }));

        return [...forming, ...scheduled].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [calendarEvents, allSessions]);

    const handleCreate = () => {
        if (!selectedProgram || !startDate || !endDate) {
            alert('Please fill in all required fields.');
            return;
        }
        
        startTransition(async () => {
            const formData = new FormData();
            formData.append('programId', selectedProgram);
            formData.append('proposedStartDate', startDate);
            formData.append('proposedEndDate', endDate);
            formData.append('proposedTrainer', proposedTrainer);
            formData.append('proposedLocation', proposedLocation);
            formData.append('capacity', capacity);
            
            const res = await createCalendarEvent(formData);
            if (res.error) {
                alert(res.error);
            } else {
                alert('Calendar event created successfully');
                setShowCreateModal(false);
                setSelectedProgram('');
                setStartDate('');
                setEndDate('');
                setProposedTrainer('');
                setProposedLocation('');
            }
        });
    };

    const handleConfirm = (batchId: string) => {
        if (!trainerName || !location) {
            alert('Please specify a trainer and location to confirm the session.');
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('trainerName', trainerName);
            formData.append('location', location);
            formData.append('startTime', startTime);
            formData.append('endTime', endTime);

            const res = await confirmCalendarEvent(batchId, formData);
            if (res.error) {
                alert(res.error);
            } else {
                alert('Event confirmed and Scheduled!');
                setShowConfirmModal(null);
                setTrainerName('');
                setLocation('');
            }
        });
    };

    const handleCancel = (batchId: string) => {
        if (confirm('Are you sure you want to cancel this event? All self-nominations will be cleared.')) {
            startTransition(async () => {
                const res = await cancelCalendarEvent(batchId);
                if (res.error) {
                    alert(res.error);
                } else {
                    alert('Event cancelled');
                }
            });
        }
    };

    return (
        <div className="space-y-12">
            <div>
                <GanttCalendar 
                    programs={programs}
                    trainers={trainers}
                    locations={[]}
                    sessions={[
                        ...(allSessions || []),
                        ...calendarEvents.map((evt: any) => ({
                            id: evt.id,
                            programName: evt.program.name + ' (Forming)',
                            trainerName: evt.proposedTrainer || 'Unassigned',
                            startDate: evt.proposedStartDate,
                            endDate: evt.proposedEndDate,
                            status: 'Forming',
                            location: evt.proposedLocation
                        }))
                    ]}
                />
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-end mb-6 px-2">
                    <h3 className="text-xl font-black text-slate-800">Pre-scheduled Events</h3>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                    >
                        <HiOutlinePlus size={18} />
                        Add Event
                    </button>
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
                                            {event.enrolledCount} / {event.capacity} Nominated
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
                                        {event.isConfirmed ? (
                                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                                <HiOutlineCheckCircle size={12} /> Scheduled
                                            </span>
                                        ) : (
                                            <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                                                <HiOutlineClock size={12} /> Pre-scheduled
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 align-middle text-right">
                                        {!event.isConfirmed ? (
                                            <div className="flex justify-end gap-1.5">
                                                <button 
                                                    onClick={() => {
                                                        setTrainerName(event.trainer || '');
                                                        setLocation(event.location || '');
                                                        setShowConfirmModal(event.id);
                                                    }}
                                                    className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors"
                                                >
                                                    <HiOutlineCheckCircle size={14} /> Confirm
                                                </button>
                                                <button 
                                                    onClick={() => handleCancel(event.id)}
                                                    className="flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
                                                >
                                                    <HiOutlineXCircle size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end pr-2">
                                                <span className="text-[10px] text-slate-400 font-bold italic">Locked</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {unifiedEvents.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                    <HiOutlineCalendar className="mx-auto text-4xl text-slate-300 mb-3" />
                                    <h3 className="text-lg font-bold text-slate-500">No Events Scheduled</h3>
                                    <p className="text-slate-400 text-sm">Click "Add Event" to propose a training date.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-800">Add Calendar Event</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Program</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                    value={selectedProgram}
                                    onChange={e => setSelectedProgram(e.target.value)}
                                >
                                    <option value="">Select a Program</option>
                                    {programs.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Proposed Trainer</label>
                                    <input 
                                        type="text"
                                        placeholder="(Optional)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                        value={proposedTrainer}
                                        onChange={e => setProposedTrainer(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Proposed Location</label>
                                    <input 
                                        type="text"
                                        placeholder="(Optional)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                        value={proposedLocation}
                                        onChange={e => setProposedLocation(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Capacity</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                        value={capacity}
                                        onChange={e => setCapacity(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreate}
                                disabled={isPending}
                                className="px-5 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md disabled:opacity-50 transition-all"
                            >
                                {isPending ? 'Publishing...' : 'Publish to Calendar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-800">Confirm & Schedule Event</h2>
                            <p className="text-sm text-slate-500 mt-1">This will lock the event and create the final training session.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Trainer Name</label>
                                <input 
                                    type="text"
                                    placeholder="Internal/External"
                                    list="trainer-list"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                    value={trainerName}
                                    onChange={e => setTrainerName(e.target.value)}
                                />
                                <datalist id="trainer-list">
                                    {trainers?.map((t: any) => (
                                        <option key={t.id} value={t.name} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Location</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowConfirmModal(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleConfirm(showConfirmModal)}
                                disabled={isPending}
                                className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 transition-all"
                            >
                                {isPending ? 'Confirming...' : 'Confirm Session'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
