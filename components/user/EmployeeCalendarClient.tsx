'use client';

import { useState } from 'react';
import { HiOutlineCalendarDays, HiOutlineXMark, HiOutlineUserGroup, HiOutlineInformationCircle } from 'react-icons/hi2';

export default function EmployeeCalendarClient({ events, empId }: { events: any[], empId: string | null }) {
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    return (
        <div className="space-y-6">

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <HiOutlineCalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">All Programs</h3>
                            <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 inline-block shadow-sm">
                                <span className="font-bold uppercase tracking-wider text-xs mr-1">Note:</span>
                                Training dates may be subject to change. Contact the training department for enrollment with approval from your manager.
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                            <tr className="border-b border-slate-200">
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
                                        onClick={() => setSelectedEvent(event)}
                                        className="transition-colors hover:bg-slate-50 cursor-pointer"
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
                                        <h3 className="text-xl font-black text-slate-700">No Programs Found</h3>
                                        <p className="text-slate-500 font-medium mt-2">There are no training programs for the selected month.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EVENT DETAILS MODAL */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <HiOutlineInformationCircle className="text-emerald-600" size={24} />
                                    Session Details
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 font-medium">{selectedEvent.program.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shadow-sm"
                            >
                                <HiOutlineXMark size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto">

                            {/* Program Details Section */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Program Information</h3>
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">Start Date</p>
                                        <p className="font-bold text-slate-800">
                                            {new Date(selectedEvent.proposedStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">End Date</p>
                                        <p className="font-bold text-slate-800">
                                            {new Date(selectedEvent.proposedEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">Trainer</p>
                                        <p className="font-bold text-slate-800">{selectedEvent.proposedTrainer || 'TBD'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">Location</p>
                                        <p className="font-bold text-slate-800">{selectedEvent.proposedLocation || 'TBD'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-1">Capacity</p>
                                        <p className="font-bold text-slate-800">{selectedEvent.nominations.length} / {selectedEvent.capacity || 30} Enrolled</p>
                                    </div>
                                </div>
                            </div>

                            {/* Participants Section */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <HiOutlineUserGroup size={18} />
                                    Enrolled Participants ({selectedEvent.nominations.length})
                                </h3>

                                {selectedEvent.nominations.length > 0 ? (
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Employee ID</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Name</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Section</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Designation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedEvent.nominations.map((nom: any) => (
                                                    <tr key={nom.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                                                            {nom.employee?.id || nom.empId}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-600">
                                                            {nom.employee?.name || 'Unknown'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">
                                                            {nom.employee?.sectionName || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-slate-500">
                                                            {nom.employee?.designation || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                                        <p className="text-slate-500 font-medium">No participants enrolled yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
