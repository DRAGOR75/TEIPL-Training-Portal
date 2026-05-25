'use client';

import { useState, useTransition } from 'react';
import { submitTNINomination } from '@/app/actions/tni';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import SearchableSelect from './ui/SearchableSelect';
import { HiOutlinePlus, HiOutlineXMark, HiOutlineClipboardDocumentList, HiOutlineAcademicCap, HiOutlineCheckCircle, HiOutlineClock, HiChevronDown, HiChevronUp } from 'react-icons/hi2';

type Program = {
    id: string;
    name: string;
    category: string;
};

type TNIDashboardClientProps = {
    nominations: any[];
    programs: Program[];
    empId: string;
    trainingHistory?: any[];
};

export default function TNIDashboardClient({
    nominations,
    programs,
    empId,
    trainingHistory = []
}: TNIDashboardClientProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isReviewedOpen, setIsReviewedOpen] = useState(true);
    const [isPendingOpen, setIsPendingOpen] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Form states
    const [formValues, setFormValues] = useState({
        selectedProgramId: '',
        justification: ''
    });

    // Split nominations
    const reviewedNominations = nominations
        .filter(nom =>
            nom.managerApprovalStatus === 'Approved' ||
            nom.managerApprovalStatus === 'Rejected' ||
            nom.status === 'Completed' ||
            nom.status === 'Batched'
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pendingNominations = nominations
        .filter(nom =>
            nom.managerApprovalStatus === 'Pending' ||
            nom.status === 'Pending'
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Helper status styling (clean borders, no emojis)
    const getStatusText = (nom: any) => {
        if (nom.status === 'Approved' || (nom.status === 'Batched' && nom.managerApprovalStatus === 'Approved')) {
            return nom.status === 'Batched' ? 'Scheduled (Approved)' : 'Approved';
        }
        if (nom.status === 'Rejected' || nom.managerApprovalStatus === 'Rejected') {
            return 'Rejected';
        }
        if (nom.status === 'Batched') {
            return 'Scheduled (Waitlist)';
        }
        if (nom.status === 'Completed') {
            return 'Completed';
        }
        return 'Pending';
    };

    const getStatusClass = (nom: any) => {
        if (nom.status === 'Approved' || (nom.status === 'Batched' && nom.managerApprovalStatus === 'Approved')) {
            return 'text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl';
        }
        if (nom.status === 'Rejected' || nom.managerApprovalStatus === 'Rejected') {
            return 'text-rose-600 bg-rose-50 border border-rose-100 rounded-xl';
        }
        if (nom.status === 'Batched') {
            return 'text-blue-600 bg-blue-50 border border-blue-100 rounded-xl';
        }
        if (nom.status === 'Completed') {
            return 'text-blue-600 bg-blue-50 border border-blue-100 rounded-xl';
        }
        return 'text-amber-600 bg-amber-50 border border-amber-100 rounded-xl';
    };

    // Programs mapped for searchable selects
    const mapPrograms = (cat: string) =>
        programs
            .filter(p => p.category === cat)
            .map(p => ({ label: p.name, value: p.id }));

    const resetForm = () => {
        setFormValues({
            selectedProgramId: '',
            justification: ''
        });
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-10">



            {/* 1. Training History Table */}
            <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div
                    className="flex justify-between items-center cursor-pointer select-none"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                >
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <HiOutlineAcademicCap className="text-amber-600 shrink-0 text-lg sm:text-xl" />
                        Training History
                        {!isHistoryOpen && (
                            <span className="ml-1 sm:ml-2 bg-amber-100 text-amber-800 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold">
                                {trainingHistory.length}
                            </span>
                        )}
                    </h3>
                    <button className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        {isHistoryOpen ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
                    </button>
                </div>
                {isHistoryOpen && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {trainingHistory.length === 0 ? (
                            <div className="p-8 border border-slate-200 rounded-3xl text-center text-xs text-slate-500 bg-slate-50 shadow-sm font-medium">
                                No training history records found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 text-center w-8 sm:w-10 whitespace-nowrap">No.</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Program Course</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Category</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Schedule Details</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Duration</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Location</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {trainingHistory.map((record: any, idx: number) => (
                                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-2 sm:px-3 py-1.5 sm:py-3 border-r border-slate-200 text-center text-slate-400 font-bold whitespace-nowrap">{idx + 1}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 font-bold text-slate-900 min-w-[150px]">{record.programName}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 font-bold text-slate-500 uppercase whitespace-nowrap">{record.progCategory || '-'}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 font-semibold text-slate-700 whitespace-nowrap">
                                                    {new Date(record.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    {record.endDate && new Date(record.startDate).getTime() !== new Date(record.endDate).getTime() && (
                                                        <span className="text-slate-400 font-medium"> to {new Date(record.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 text-slate-600 font-medium whitespace-nowrap">{record.trainingDays ? `${record.trainingDays} Days` : '-'}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 text-slate-700 font-medium whitespace-nowrap">{record.location || record.region || '-'}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 text-center whitespace-nowrap">
                                                    <span className="inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl text-[9px] sm:text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                        Completed
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Training Need */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-200 text-xs cursor-pointer"
                    >
                        {isFormOpen ? (
                            <>
                                <HiOutlineXMark size={14} className="stroke-[2.5]" />
                                <span>Close Nomination Form</span>
                            </>
                        ) : (
                            <>
                                <HiOutlinePlus size={14} className="stroke-[2.5]" />
                                <span>Add Training Need</span>
                            </>
                        )}
                    </button>
                </div>

                {isFormOpen && (
                    <div className="p-6 border border-slate-200 bg-white rounded-3xl shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="border-b border-slate-200 pb-3">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Submit Training Nomination</h4>
                            <p className="text-xs text-slate-500 font-medium">Select relevant courses and provide justification details below</p>
                        </div>

                        <form action={async (formData) => {
                            startTransition(async () => {
                                await submitTNINomination(formData);
                                resetForm();
                            });
                        }} className="space-y-4">
                            <input type="hidden" name="empId" value={empId} />

                            <div className="grid grid-cols-1 gap-5">
                                {/* Universal Program Selector */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Program</label>
                                    <SearchableSelect
                                        options={programs.map(p => ({
                                            label: `${p.name} - ${p.category} [ID: ${p.id.split('-')[0]}]`,
                                            value: p.id
                                        }))}
                                        value={formValues.selectedProgramId}
                                        onChange={(val) => setFormValues(prev => ({ ...prev, selectedProgramId: val }))}
                                        placeholder="Search by name, category, or ID..."
                                        className="w-full text-xs"
                                    />

                                    {/* Hidden input to satisfy existing backend logic without modifying it */}
                                    {(() => {
                                        const selectedProg = programs.find(p => p.id === formValues.selectedProgramId);
                                        return selectedProg ? (
                                            <input type="hidden" name={`programId_${selectedProg.category}`} value={selectedProg.id} />
                                        ) : null;
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="justification" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Justification / Goal *</label>
                                <textarea
                                    name="justification"
                                    id="justification"
                                    required
                                    value={formValues.justification}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, justification: e.target.value }))}
                                    placeholder="Explain how this training supports operational requirements or individual development..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-xs text-slate-800 resize-none"
                                ></textarea>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="bypassEmail" name="bypassEmail" className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" />
                                <label htmlFor="bypassEmail" className="text-xs font-bold text-slate-600 cursor-pointer select-none">Bypass Manager Approval Mail (Do not send email)</label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm"
                                >
                                    Cancel
                                </button>
                                <FormSubmitButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-xs cursor-pointer shadow-lg shadow-blue-200">
                                    Submit Request
                                </FormSubmitButton>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* 2. Approved or Rejected Manager Table */}
            <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div
                    className="flex justify-between items-center cursor-pointer select-none pb-2"
                    onClick={() => setIsReviewedOpen(!isReviewedOpen)}
                >
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <HiOutlineCheckCircle className="text-blue-600 shrink-0 text-lg sm:text-xl" />
                        TNI Approved
                        {!isReviewedOpen && (
                            <span className="ml-1 sm:ml-2 bg-blue-100 text-blue-800 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold">
                                {reviewedNominations.length}
                            </span>
                        )}
                    </h3>
                    <button className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        {isReviewedOpen ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
                    </button>
                </div>

                {isReviewedOpen && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {reviewedNominations.length === 0 ? (
                            <div className="p-8 border border-slate-200 rounded-3xl text-center text-xs text-slate-500 bg-slate-50 shadow-sm font-medium">
                                No reviewed nominations found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 text-center w-8 sm:w-10 whitespace-nowrap">No.</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Program Course</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Category</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Justification</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Manager Approval</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {reviewedNominations.map((nom: any, idx: number) => (
                                            <tr key={nom.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-2 sm:px-3 py-1.5 sm:py-3 border-r border-slate-200 text-center text-slate-400 font-bold whitespace-nowrap">{idx + 1}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 font-bold text-slate-900 min-w-[150px]">{nom.program?.name || 'Unknown Program'}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 font-bold text-slate-500 uppercase whitespace-nowrap">{nom.program?.category || '-'}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 text-slate-600 font-medium italic min-w-[200px] max-w-xs sm:max-w-md" title={nom.justification}>
                                                    <div className="line-clamp-2">{nom.justification || '-'}</div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 whitespace-nowrap">
                                                    {(() => {
                                                        const isRejected = nom.managerApprovalStatus === 'Rejected' || nom.status === 'Rejected';
                                                        const label = isRejected ? 'Rejected' : 'Approved';
                                                        const badgeClass = isRejected ? 'text-rose-600 bg-rose-50 border border-rose-100 rounded-xl' : 'text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl';
                                                        return (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 font-bold w-fit text-[9px] sm:text-[10px] ${badgeClass}`}>
                                                                    {label}
                                                                </span>
                                                                {isRejected && nom.managerRejectionReason && (
                                                                    <span className="text-[9px] text-rose-500 font-bold max-w-[150px] truncate block" title={nom.managerRejectionReason}>
                                                                        Reason: {nom.managerRejectionReason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 text-slate-400 font-semibold whitespace-nowrap">
                                                    {new Date(nom.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Pending Table */}
            <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div
                    className="flex justify-between items-center cursor-pointer select-none pb-2"
                    onClick={() => setIsPendingOpen(!isPendingOpen)}
                >
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <HiOutlineClock className="text-thriveni-blue shrink-0 text-lg sm:text-xl" />
                        TNI due for approval
                        {!isPendingOpen && (
                            <span className="ml-1 sm:ml-2 bg-slate-100 text-slate-600 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold">
                                {pendingNominations.length}
                            </span>
                        )}
                    </h3>
                    <button className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        {isPendingOpen ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
                    </button>
                </div>
                {isPendingOpen && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {pendingNominations.length === 0 ? (
                            <div className="p-8 border border-slate-200 rounded-3xl text-center text-xs text-slate-500 bg-slate-50 shadow-sm font-medium">
                                No pending nominations found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-2 sm:px-3 py-2 sm:py-3 font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 text-center w-8 sm:w-10 whitespace-nowrap">No.</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Program Course</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Category</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Justification</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 whitespace-nowrap">Manager Status</th>
                                            <th className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {pendingNominations.map((nom: any, idx: number) => (
                                            <tr key={nom.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-2 sm:px-3 py-1.5 sm:py-3 border-r border-slate-200 text-center text-slate-400 font-bold whitespace-nowrap">{idx + 1}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 font-bold text-slate-900 min-w-[150px]">{nom.program?.name || 'Unknown Program'}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 font-bold text-slate-500 uppercase whitespace-nowrap">{nom.program?.category || '-'}</td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 text-slate-600 font-medium italic min-w-[200px] max-w-xs sm:max-w-md" title={nom.justification}>
                                                    <div className="line-clamp-2">{nom.justification || '-'}</div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 border-r border-slate-200 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold ${getStatusClass(nom)}`}>
                                                        {getStatusText(nom)}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-1.5 sm:py-3 text-slate-400 font-semibold whitespace-nowrap">
                                                    {new Date(nom.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
