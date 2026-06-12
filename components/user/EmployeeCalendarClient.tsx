'use client';

import { useState, useTransition } from 'react';
import { HiOutlineCalendarDays, HiOutlineCheckCircle } from 'react-icons/hi2';
import { selfNominateCalendar } from '@/app/actions/calendar';

export default function EmployeeCalendarClient({ events, userEmail }: { events: any[], userEmail: string }) {
    const [isPending, startTransition] = useTransition();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [empId, setEmpId] = useState('');
    const [justification, setJustification] = useState('');

    const handleNominate = () => {
        if (!empId) {
            alert('Please enter your Employee ID');
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-bold text-slate-500 text-sm tracking-wider uppercase">Program Name</th>
                                <th className="p-4 font-bold text-slate-500 text-sm tracking-wider uppercase">Start Date</th>
                                <th className="p-4 font-bold text-slate-500 text-sm tracking-wider uppercase">End Date</th>
                                <th className="p-4 font-bold text-slate-500 text-sm tracking-wider uppercase">Trainer</th>
                                <th className="p-4 font-bold text-slate-500 text-sm tracking-wider uppercase">Location</th>
                                <th className="p-4 font-bold text-slate-500 text-sm tracking-wider uppercase">Availability</th>
                                <th className="p-4 font-bold text-slate-500 text-sm tracking-wider uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.map((event) => {
                                const isFull = event.capacity && event.nominations.length >= event.capacity;
                                const startDate = new Date(event.proposedStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                const endDate = new Date(event.proposedEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                                return (
                                    <tr key={event.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 align-middle">
                                            <div className="font-bold text-slate-800 text-base">{event.program.name}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-medium text-slate-600">{startDate}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-medium text-slate-600">{endDate}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-medium text-slate-600">
                                                {event.proposedTrainer ? (
                                                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-sm">{event.proposedTrainer}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-sm">TBD</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-medium text-slate-600">
                                                {event.proposedLocation ? (
                                                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-sm">{event.proposedLocation}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-sm">TBD</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm inline-flex items-center whitespace-nowrap ${isFull ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                                {event.nominations.length} / {event.capacity || '∞'} Seats
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <button
                                                onClick={() => setSelectedEventId(event.id)}
                                                disabled={isFull}
                                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                                    isFull 
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md active:scale-95'
                                                }`}
                                            >
                                                {isFull ? 'Waitlist Full' : 'Self Nominate'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center">
                                        <HiOutlineCalendarDays className="mx-auto text-5xl text-slate-300 mb-4" />
                                        <h3 className="text-xl font-black text-slate-700">No Events Scheduled</h3>
                                        <p className="text-slate-500 font-medium mt-2">There are no upcoming pre-scheduled training programs at the moment.</p>
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
                                <label className="block text-sm font-bold text-slate-700 mb-1">Employee ID <span className="text-rose-500">*</span></label>
                                <input 
                                    type="text"
                                    placeholder="Enter your Emp ID"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={empId}
                                    onChange={e => setEmpId(e.target.value)}
                                />
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
