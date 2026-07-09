'use client';

import { useState, useTransition } from 'react';
import { HiOutlineCalendarDays, HiOutlineCheckCircle } from 'react-icons/hi2';
import { selfNominateCalendar } from '@/app/actions/calendar';

export default function EmployeeCalendarClient({ events, empId }: { events: any[], empId: string | null }) {
    const [isPending, startTransition] = useTransition();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [justification, setJustification] = useState('');

    const handleNominate = () => {
        if (!empId) {
            alert('Missing Employee ID session');
            return;
        }

        startTransition(async () => {
            const res = await selfNominateCalendar(selectedEventId!, empId, justification);
            if (res.error) {
                alert(res.error);
            } else {
                alert('Successfully nominated for event!');
                setSelectedEventId(null);
                setJustification('');
            }
        });
    };

    return (
        <div className="space-y-6">

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <HiOutlineCalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Upcoming Sessions</h3>

                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-3 py-2 font-bold text-slate-500 text-xs tracking-wider uppercase">Program Name</th>
                                <th className="px-3 py-2 font-bold text-slate-500 text-xs tracking-wider uppercase">Start Date</th>
                                <th className="px-3 py-2 font-bold text-slate-500 text-xs tracking-wider uppercase">End Date</th>
                                <th className="px-3 py-2 font-bold text-slate-500 text-xs tracking-wider uppercase">Trainer</th>
                                <th className="px-3 py-2 font-bold text-slate-500 text-xs tracking-wider uppercase">Region</th>
                                <th className="px-3 py-2 font-bold text-slate-500 text-xs tracking-wider uppercase">Enrolled persons</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.map((event) => {
                                const isFull = event.capacity && event.nominations.length >= event.capacity;
                                const startDate = new Date(event.proposedStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                const endDate = new Date(event.proposedEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                                return (
                                    <tr
                                        key={event.id}
                                        onClick={() => empId && !isFull && setSelectedEventId(event.id)}
                                        className={`transition-colors ${empId && !isFull ? 'hover:bg-emerald-50 cursor-pointer' : 'hover:bg-slate-50/80 cursor-not-allowed opacity-70'}`}
                                    >
                                        <td className="px-3 py-2 align-middle">
                                            <div className="font-bold text-slate-800 text-sm">{event.program.name}</div>
                                        </td>
                                        <td className="px-3 py-2 align-middle">
                                            <div className="font-medium text-slate-600 text-sm">{startDate}</div>
                                        </td>
                                        <td className="px-3 py-2 align-middle">
                                            <div className="font-medium text-slate-600 text-sm">{endDate}</div>
                                        </td>
                                        <td className="px-3 py-2 align-middle">
                                            <div className="font-medium text-slate-600">
                                                {event.proposedTrainer ? (
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs">{event.proposedTrainer}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">TBD</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 align-middle">
                                            <div className="font-medium text-slate-600">
                                                {event.proposedLocation ? (
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs">{event.proposedLocation}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">TBD</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 align-middle">
                                            <span className={`text-[11px] font-bold px-2 py-1 rounded-full border shadow-sm inline-flex items-center whitespace-nowrap ${isFull ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                                {event.nominations.length} / {event.capacity || '∞'} Seats
                                            </span>
                                        </td>

                                    </tr>
                                );
                            })}

                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <HiOutlineCalendarDays className="mx-auto text-5xl text-slate-300 mb-4" />
                                        <h3 className="text-xl font-black text-slate-700">No Events Scheduled</h3>
                                        <p className="text-slate-500 font-medium mt-2">There are no upcoming  training programs at the moment.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* NOMINATION MODAL */}
            {selectedEventId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-emerald-50/50">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <HiOutlineCheckCircle className="text-emerald-500" />
                                Confirm Nomination
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Please verify your Employee ID to register for this event.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Employee ID</label>
                                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-500">
                                    {empId}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Justification (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Why do you want to attend this training?"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedEventId(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNominate}
                                disabled={isPending || !empId}
                                className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {isPending ? 'Submitting...' : 'Submit Nomination'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
