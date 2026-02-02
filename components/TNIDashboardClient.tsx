'use client';

import { useState } from 'react';
import { submitTNINomination } from '@/app/actions/tni'; // We'll keep using the same server action
import {
    HiOutlinePlusCircle,
    HiOutlineQueueList,
    HiOutlineXMark,
    HiOutlinePaperAirplane,
    HiOutlineBookOpen,
    HiOutlineBriefcase,
    HiOutlineUsers,
    HiOutlineGlobeAlt,
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineClock
} from 'react-icons/hi2';
import { FormSubmitButton } from '@/components/FormSubmitButton';

type Program = {
    id: string;
    name: string;
    category: string;
};

type Nomination = {
    id: string;
    program?: { name: string; category: string };
    status: string;
    createdAt: Date;
};

export default function TNIDashboardClient({
    nominations,
    programs,
    empId
}: {
    nominations: any[];
    programs: Program[];
    empId: string;
}) {
    const [view, setView] = useState<'list' | 'create'>('list');

    // Sort nominations: Approved -> Pending -> Rejected
    const sortedNominations = [...nominations].sort((a, b) => {
        const priority: Record<string, number> = { 'Approved': 1, 'Pending': 2, 'Rejected': 3 };
        return (priority[a.status] || 99) - (priority[b.status] || 99);
    });

    if (view === 'create') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <HiOutlinePlusCircle size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">New Nomination</h2>
                    </div>
                    <button
                        onClick={() => setView('list')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <HiOutlineXMark size={16} /> Cancel
                    </button>
                </div>

                <div className="p-6">
                    <form action={submitTNINomination} className="space-y-8">
                        <input type="hidden" name="empId" value={empId} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 1. FOUNDATIONAL */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    <HiOutlineBookOpen size={16} className="text-indigo-500" /> Foundational Programs
                                </label>
                                <div className="relative">
                                    <select
                                        name="programId_FOUNDATIONAL"
                                        className="w-full p-3 pl-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 hover:bg-white text-slate-900 cursor-pointer appearance-none shadow-sm"
                                    >
                                        <option value="">Select Program...</option>
                                        {programs.filter(p => p.category === 'FOUNDATIONAL').map(prog => (
                                            <option key={prog.id} value={prog.id}>{prog.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 2. FUNCTIONAL */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    <HiOutlineBriefcase size={16} className="text-blue-500" /> Functional Programs
                                </label>
                                <select
                                    name="programId_FUNCTIONAL"
                                    className="w-full p-3 pl-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 hover:bg-white text-slate-900 cursor-pointer shadow-sm"
                                >
                                    <option value="">Select Program...</option>
                                    {programs.filter(p => p.category === 'FUNCTIONAL').map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. BEHAVIOURAL */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    <HiOutlineUsers size={16} className="text-purple-500" /> Behavioural Programs
                                </label>
                                <select
                                    name="programId_BEHAVIOURAL"
                                    className="w-full p-3 pl-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-slate-50 hover:bg-white text-slate-900 cursor-pointer shadow-sm"
                                >
                                    <option value="">Select Program...</option>
                                    {programs.filter(p => p.category === 'BEHAVIOURAL').map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 4. COMMON */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    <HiOutlineGlobeAlt size={16} className="text-emerald-500" /> Common Programs
                                </label>
                                <select
                                    name="programId_COMMON"
                                    className="w-full p-3 pl-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 hover:bg-white text-slate-900 cursor-pointer shadow-sm"
                                >
                                    <option value="">Select Program...</option>
                                    {programs.filter(p => p.category === 'COMMON').map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Justification */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <label htmlFor="justification" className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                <HiOutlineDocumentText size={16} className="text-slate-400" /> Justification / Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="justification"
                                id="justification"
                                required
                                placeholder="Explain why this training is needed..."
                                rows={4}
                                className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder-slate-400 text-slate-900 bg-slate-50 hover:bg-white shadow-sm resize-none"
                            ></textarea>
                        </div>

                        <div className="pt-2">
                            <FormSubmitButton className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform active:scale-[0.99] duration-200">
                                <HiOutlinePaperAirplane size={20} /> Submit Nomination
                            </FormSubmitButton>
                        </div>

                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <HiOutlineQueueList size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Current Nominations</h2>
                </div>


                <button
                    onClick={() => setView('create')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:transform active:scale-95"
                >
                    <HiOutlinePlusCircle size={18} />
                    <span className="hidden md:inline">Add New</span>
                    <span className="md:hidden">Add</span>
                </button>
            </div>

            <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">

                {/* Mobile Card View (Visible on small screens) */}
                <div className="md:hidden space-y-4 p-4">
                    {sortedNominations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="p-4 bg-white rounded-full shadow-sm">
                                <HiOutlineQueueList size={32} className="text-slate-300" />
                            </div>
                            <p>No nominations found.</p>
                            <button onClick={() => setView('create')} className="text-blue-600 font-medium hover:underline text-sm">
                                Start your first nomination
                            </button>
                        </div>
                    ) : (
                        sortedNominations.map((nom: any) => (
                            <div key={nom.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-snug">
                                        {nom.program?.name || 'Unknown Program'}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                        {nom.program?.category === 'FOUNDATIONAL' && <HiOutlineBookOpen size={10} />}
                                        {nom.program?.category === 'FUNCTIONAL' && <HiOutlineBriefcase size={10} />}
                                        {nom.program?.category === 'BEHAVIOURAL' && <HiOutlineUsers size={10} />}
                                        {nom.program?.category === 'COMMON' && <HiOutlineGlobeAlt size={10} />}
                                        {nom.program?.category}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${nom.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        nom.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                        {nom.status === 'Approved' ? <HiOutlineCheckCircle size={10} /> :
                                            nom.status === 'Rejected' ? <HiOutlineExclamationCircle size={10} /> :
                                                <HiOutlineClock size={10} />}
                                        {nom.status}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
                                    <span>Submitted on</span>
                                    <span>
                                        {new Date(nom.createdAt).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View (Hidden on mobile) */}
                <table className="hidden md:table w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-5 bg-slate-50">Program Name</th>
                            <th className="p-5 bg-slate-50">Category</th>
                            <th className="p-5 bg-slate-50">Status</th>
                            <th className="p-5 bg-slate-50">Submitted On</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedNominations.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 bg-slate-50 rounded-full">
                                            <HiOutlineQueueList size={32} className="text-slate-300" />
                                        </div>
                                        <p>No recent nominations found.</p>
                                        <button onClick={() => setView('create')} className="text-blue-600 font-medium hover:underline">
                                            Start your first nomination
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sortedNominations.map((nom: any) => (
                                <tr key={nom.id} className="group hover:bg-slate-50/80 transition-colors">
                                    <td className="p-5">
                                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                            {nom.program?.name || 'Unknown Program'}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {nom.program?.category === 'FOUNDATIONAL' && <HiOutlineBookOpen size={12} />}
                                            {nom.program?.category === 'FUNCTIONAL' && <HiOutlineBriefcase size={12} />}
                                            {nom.program?.category === 'BEHAVIOURAL' && <HiOutlineUsers size={12} />}
                                            {nom.program?.category === 'COMMON' && <HiOutlineGlobeAlt size={12} />}
                                            {nom.program?.category}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${nom.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            nom.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {nom.status === 'Approved' ? <HiOutlineCheckCircle size={12} /> :
                                                nom.status === 'Rejected' ? <HiOutlineExclamationCircle size={12} /> :
                                                    <HiOutlineClock size={12} />}
                                            {nom.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-slate-500 text-sm font-medium">
                                        {new Date(nom.createdAt).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
