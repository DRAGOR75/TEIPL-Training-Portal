'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    HiOutlineArrowLeft,
    HiOutlineUserPlus,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineClock,
    HiOutlineMagnifyingGlass,
    HiOutlineFunnel,
    HiOutlinePencilSquare,
    HiOutlineXMark,
    HiOutlineArrowPath,
    HiOutlineBriefcase,
    HiOutlineMapPin,
    HiOutlineCalendarDays,
    HiOutlineBuildingOffice2,
    HiOutlineCheck,
    HiOutlineEye
} from 'react-icons/hi2';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { approveRegistrationRequest, rejectRegistrationRequest, AdminRegistrationOverrides } from '@/app/actions/registration-requests';
import { getManagerDetails } from '@/app/actions/tni';

interface RegistrationRequestItem {
    id: string;
    empId: string;
    name: string;
    email: string;
    mobile: string | null;
    gender: any | null;
    grade: any | null;
    departmentGroup: string | null;
    department: string | null;
    sectionName: string | null;
    designation: string | null;
    location: string | null;
    region: string | null;
    projectLocation: string | null;
    organization: string | null;
    employeeGrouupMNmw: string | null;
    onRollContract: string | null;
    highestQualification: string | null;
    managerId: string | null;
    managerName: string | null;
    managerEmail: string | null;
    managerMobile: string | null;
    batchId: string;
    status: string;
    rejectionReason: string | null;
    reviewedBy: string | null;
    reviewedAt: Date | string | null;
    createdAt: Date | string;
    batch: {
        id: string;
        program: { id: string; name: string };
        trainingSession: {
            id: string;
            programName: string;
            altProgramName: string | null;
            trainerName: string | null;
            startDate: Date | string | null;
            endDate: Date | string | null;
            location: string | null;
            requireManagerApproval: boolean;
        } | null;
    };
}

interface RegistrationRequestsClientProps {
    initialRequests: any[];
    counts: {
        pending: number;
        approved: number;
        rejected: number;
        all: number;
    };
    sectionOptions: { label: string; value: string }[];
    designationOptions: { label: string; value: string }[];
    locationOptions: { label: string; value: string }[];
}

export default function RegistrationRequestsClient({
    initialRequests,
    counts: initialCounts,
    sectionOptions,
    designationOptions,
    locationOptions
}: RegistrationRequestsClientProps) {
    const router = useRouter();
    const [requests, setRequests] = useState<RegistrationRequestItem[]>(initialRequests);
    const [counts, setCounts] = useState(initialCounts);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected' | 'ALL'>('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');

    // Modal States
    const [reviewingRequest, setReviewingRequest] = useState<RegistrationRequestItem | null>(null);
    const [isReadOnlyView, setIsReadOnlyView] = useState(false);
    const [rejectingRequest, setRejectingRequest] = useState<RegistrationRequestItem | null>(null);
    const [rejectReason, setRejectReason] = useState('Declined by Administrator');
    const [actionLoading, setActionLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 5000);
    };

    // Extract unique batches for the filter dropdown
    const batchFilterOptions = useMemo(() => {
        const batchMap = new Map<string, string>();
        requests.forEach(r => {
            const name = r.batch.trainingSession?.altProgramName || r.batch.trainingSession?.programName || r.batch.program.name;
            if (!batchMap.has(r.batchId)) {
                batchMap.set(r.batchId, name);
            }
        });
        return [
            { label: 'All Sessions', value: 'ALL' },
            ...Array.from(batchMap.entries()).map(([id, label]) => ({ label, value: id }))
        ];
    }, [requests]);

    // Filtered requests
    const filteredRequests = useMemo(() => {
        return requests.filter(item => {
            // Tab filter
            if (activeTab !== 'ALL' && item.status !== activeTab) {
                return false;
            }
            // Batch filter
            if (selectedBatchFilter !== 'ALL' && item.batchId !== selectedBatchFilter) {
                return false;
            }
            // Search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchName = item.name.toLowerCase().includes(query);
                const matchEmpId = item.empId.toLowerCase().includes(query);
                const matchEmail = item.email.toLowerCase().includes(query);
                const matchSection = item.sectionName?.toLowerCase().includes(query);
                const matchDesig = item.designation?.toLowerCase().includes(query);
                const matchProgram = (item.batch.trainingSession?.altProgramName || item.batch.program.name).toLowerCase().includes(query);
                return matchName || matchEmpId || matchEmail || matchSection || matchDesig || matchProgram;
            }
            return true;
        });
    }, [requests, activeTab, selectedBatchFilter, searchQuery]);

    // Handle Quick Reject Confirm
    async function handleConfirmReject() {
        if (!rejectingRequest) return;
        setActionLoading(true);
        try {
            const res = await rejectRegistrationRequest(rejectingRequest.id, rejectReason);
            if (res.success) {
                // Update local state
                setRequests(prev => prev.map(r => r.id === rejectingRequest.id ? { ...r, status: 'Rejected', rejectionReason: rejectReason } : r));
                setCounts(prev => ({
                    ...prev,
                    pending: Math.max(0, prev.pending - 1),
                    rejected: prev.rejected + 1
                }));
                showToast(`Request for ${rejectingRequest.name} (${rejectingRequest.empId}) has been rejected.`, 'success');
                setRejectingRequest(null);
                setReviewingRequest(null);
                router.refresh();
            } else {
                showToast(res.error || 'Failed to reject request', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Error rejecting request', 'error');
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white transition-all animate-in slide-in-from-top-4 ${toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {toastMessage.type === 'success' ? <HiOutlineCheckCircle className="w-5 h-5 shrink-0" /> : <HiOutlineXCircle className="w-5 h-5 shrink-0" />}
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-8">
                <div className="container mx-auto px-6 max-w-7xl">
                    <Link
                        href="/admin"
                        className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-2 inline-flex items-center gap-1 group"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Admin Hub
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
                                Registration <span className="text-blue-600">Requests</span>
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Review, edit, and approve walk-in participant registrations and session enrollments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8 max-w-7xl space-y-6">

                {/* Tabs & Controls */}
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        {/* Tab Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setActiveTab('Pending')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'Pending' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <HiOutlineClock className="w-4 h-4" />
                                <span>Pending</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'Pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                                    {counts.pending}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('Approved')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'Approved' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <HiOutlineCheckCircle className="w-4 h-4" />
                                <span>Approved</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'Approved' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {counts.approved}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('Rejected')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'Rejected' ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <HiOutlineXCircle className="w-4 h-4" />
                                <span>Rejected</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'Rejected' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
                                    {counts.rejected}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('ALL')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <span>All Requests</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {counts.all}
                                </span>
                            </button>
                        </div>

                        {/* Summary Pill */}
                        <div className="text-xs font-semibold text-slate-400">
                            Showing <span className="font-bold text-slate-800">{filteredRequests.length}</span> entries
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="relative">
                            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name, ID, email, dept..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <SearchableSelect
                                options={batchFilterOptions}
                                value={selectedBatchFilter}
                                onChange={(val) => setSelectedBatchFilter(String(val))}
                                placeholder="Filter by Session"
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center justify-end">
                            {(searchQuery || selectedBatchFilter !== 'ALL') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedBatchFilter('ALL');
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline transition-colors"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Participant</th>
                                    <th className="px-5 py-4">Grade & Role</th>
                                    <th className="px-5 py-4">Target Training Session</th>
                                    <th className="px-5 py-4">Reporting Manager</th>
                                    <th className="px-5 py-4">Submitted</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map(item => {
                                        const sessionName = item.batch.trainingSession?.altProgramName || item.batch.trainingSession?.programName || item.batch.program.name;
                                        const sessionDates = item.batch.trainingSession?.startDate
                                            ? `${new Date(item.batch.trainingSession.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}${item.batch.trainingSession.endDate ? ` - ${new Date(item.batch.trainingSession.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}`
                                            : 'Dates TBD';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                                {/* Status */}
                                                <td className="px-5 py-4 align-top">
                                                    {item.status === 'Pending' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                            Pending
                                                        </span>
                                                    )}
                                                    {item.status === 'Approved' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <HiOutlineCheck className="w-3 h-3 text-emerald-600" />
                                                            Approved
                                                        </span>
                                                    )}
                                                    {item.status === 'Rejected' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                                            <HiOutlineXMark className="w-3 h-3 text-rose-600" />
                                                            Rejected
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Participant */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-bold text-slate-900 text-sm">
                                                        {item.name}
                                                    </div>
                                                    <div className="font-mono text-xs font-semibold text-blue-600 mt-0.5">
                                                        {item.empId}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                                                        {item.email}
                                                    </div>
                                                    {item.mobile && (
                                                        <div className="text-[11px] text-slate-400">
                                                            {item.mobile}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Grade & Role */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                                            {item.grade || 'EXECUTIVE'}
                                                        </span>
                                                        {item.onRollContract && (
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                • {item.onRollContract}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="font-semibold text-slate-800 text-xs mt-1">
                                                        {item.designation || 'Not Specified'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        {item.sectionName || 'N/A'} {item.location ? `(${item.location})` : ''}
                                                    </div>
                                                </td>

                                                {/* Target Session */}
                                                <td className="px-5 py-4 align-top max-w-[260px]">
                                                    <div className="font-bold text-slate-900 text-xs line-clamp-2">
                                                        {sessionName}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                                                        <HiOutlineCalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{sessionDates}</span>
                                                    </div>
                                                    {item.batch.trainingSession?.location && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                                            <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span>{item.batch.trainingSession.location}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Reporting Manager */}
                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-semibold text-slate-800 text-xs">
                                                        {item.managerName || '-'}
                                                    </div>
                                                    {item.managerEmail && (
                                                        <div className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                                                            {item.managerEmail}
                                                        </div>
                                                    )}
                                                    {item.managerId && (
                                                        <div className="text-[10px] font-mono text-slate-400">
                                                            ID: {item.managerId}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Submitted */}
                                                <td className="px-5 py-4 align-top text-xs text-slate-500 whitespace-nowrap">
                                                    <div>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    <div className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    {item.reviewedBy && (
                                                        <div className="text-[10px] font-semibold text-slate-600 mt-1">
                                                            By: {item.reviewedBy}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                                                    {item.status === 'Pending' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setReviewingRequest(item);
                                                                    setIsReadOnlyView(false);
                                                                }}
                                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                                            >
                                                                <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                                                                Review & Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectingRequest(item)}
                                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-200"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setReviewingRequest(item);
                                                                setIsReadOnlyView(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                                                        >
                                                            <HiOutlineEye className="w-3.5 h-3.5" />
                                                            View Details
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <HiOutlineUserPlus className="w-10 h-10 text-slate-300" />
                                                <p className="font-bold text-slate-600 text-base">No registration requests found</p>
                                                <p className="text-xs text-slate-400">
                                                    {searchQuery ? 'Try adjusting your search criteria.' : `There are no ${activeTab.toLowerCase()} requests currently.`}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* REVIEW & CONFIRM MODAL (Matching EmployeeManager.tsx structure) */}
            {reviewingRequest && (
                <ReviewModal
                    request={reviewingRequest}
                    isReadOnly={isReadOnlyView}
                    onClose={() => setReviewingRequest(null)}
                    onApproved={(updatedReq) => {
                        setRequests(prev => prev.map(r => r.id === updatedReq.id ? { ...r, ...updatedReq, status: 'Approved' } : r));
                        setCounts(prev => ({
                            ...prev,
                            pending: Math.max(0, prev.pending - 1),
                            approved: prev.approved + 1
                        }));
                        showToast(`Successfully registered and enrolled ${updatedReq.name} (${updatedReq.empId})!`, 'success');
                        setReviewingRequest(null);
                        router.refresh();
                    }}
                    onRequestReject={() => {
                        setRejectingRequest(reviewingRequest);
                        setReviewingRequest(null);
                    }}
                    sectionOptions={sectionOptions}
                    designationOptions={designationOptions}
                    locationOptions={locationOptions}
                />
            )}

            {/* QUICK REJECT CONFIRMATION MODAL */}
            {rejectingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                            <HiOutlineXMark className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-black text-slate-900">Reject Registration Request</h3>
                            <p className="text-xs text-slate-500">
                                Decline registration for <span className="font-bold text-slate-800">{rejectingRequest.name}</span> ({rejectingRequest.empId})?
                            </p>
                        </div>

                        <div className="space-y-1.5 text-left">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Rejection Reason</label>
                            <input
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Enter reason (e.g. Ineligible grade, duplicate request)"
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-rose-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => setRejectingRequest(null)}
                                disabled={actionLoading}
                                className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={actionLoading}
                                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
                            >
                                {actionLoading ? <HiOutlineArrowPath className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// REVIEW & EDIT MODAL COMPONENT
// Aligned 1-to-1 with EmployeeManager.tsx
// ==========================================
function ReviewModal({
    request,
    isReadOnly,
    onClose,
    onApproved,
    onRequestReject,
    sectionOptions,
    designationOptions: initialDesignations,
    locationOptions
}: {
    request: RegistrationRequestItem;
    isReadOnly: boolean;
    onClose: () => void;
    onApproved: (updatedReq: any) => void;
    onRequestReject: () => void;
    sectionOptions: { label: string; value: string }[];
    designationOptions: { label: string; value: string }[];
    locationOptions: { label: string; value: string }[];
}) {
    // Form State (Section 1: Basic & Personal Information)
    const [name, setName] = useState(request.name);
    const [email, setEmail] = useState(request.email);
    const [mobile, setMobile] = useState(request.mobile || '');
    const [selectedGrade, setSelectedGrade] = useState(request.grade || 'EXECUTIVE');
    const [selectedStatus, setSelectedStatus] = useState('Active');
    const [selectedGender, setSelectedGender] = useState(request.gender || 'MALE');
    const [aadharNumber, setAadharNumber] = useState('');
    const [doj, setDoj] = useState('');
    const [dob, setDob] = useState('');

    // Form State (Section 2: Department & Job Details)
    const [selectedDeptGroup, setSelectedDeptGroup] = useState(request.departmentGroup || 'AC ELECTRICAL');
    const [department, setDepartment] = useState(request.department || '');
    const [selectedSection, setSelectedSection] = useState(request.sectionName || '');
    const [customSection, setCustomSection] = useState('');
    const [sectionMode, setSectionMode] = useState<'select' | 'custom'>('select');

    const [selectedDesignation, setSelectedDesignation] = useState(request.designation || '');
    const [customDesignation, setCustomDesignation] = useState('');
    const [designationMode, setDesignationMode] = useState<'select' | 'custom'>('select');

    const [selectedRegion, setSelectedRegion] = useState(request.location || '');
    const [locationDetail, setLocationDetail] = useState(request.region || '');
    const [projectLocation, setProjectLocation] = useState(request.projectLocation || '');
    const [selectedOrganization, setSelectedOrganization] = useState(request.organization || 'LMEL');
    const [highestQualification, setHighestQualification] = useState(request.highestQualification || '');
    const [selectedEmployeeGroupMNmw, setSelectedEmployeeGroupMNmw] = useState(request.employeeGrouupMNmw || 'Non Manager');
    const [selectedOnRollContract, setSelectedOnRollContract] = useState(request.onRollContract || 'On-Roll');

    // Form State (Section 3: Reporting Manager Details)
    const [managerId, setManagerId] = useState(request.managerId || '');
    const [managerName, setManagerName] = useState(request.managerName || '');
    const [managerEmail, setManagerEmail] = useState(request.managerEmail || '');
    const [managerMobile, setManagerMobile] = useState(request.managerMobile || '');
    const [isFetchingManager, setIsFetchingManager] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function handleManagerIdBlur() {
        if (managerId && managerId.trim() !== '') {
            setIsFetchingManager(true);
            try {
                const manager = await getManagerDetails(managerId.trim().toUpperCase());
                if (manager) {
                    if (manager.name) setManagerName(manager.name);
                    if (manager.email) setManagerEmail(manager.email);
                    if (manager.mobile) setManagerMobile(manager.mobile);
                }
            } catch (err) {
                console.error('Error fetching manager details:', err);
            } finally {
                setIsFetchingManager(false);
            }
        }
    }

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isReadOnly) {
            onClose();
            return;
        }

        const finalSection = sectionMode === 'custom' ? customSection.trim() : selectedSection.trim();
        const finalDesignation = designationMode === 'custom' ? customDesignation.trim() : selectedDesignation.trim();

        if (!name.trim()) {
            setErrorMsg("Full Name is required.");
            return;
        }
        if (!email.trim()) {
            setErrorMsg("Email address is required.");
            return;
        }
        if (!selectedDeptGroup) {
            setErrorMsg("Department Group is required.");
            return;
        }
        if (!finalSection) {
            setErrorMsg("Section is required.");
            return;
        }
        if (!finalDesignation) {
            setErrorMsg("Designation is required.");
            return;
        }
        if (!selectedRegion) {
            setErrorMsg("Region (Location) is required.");
            return;
        }
        if (!selectedEmployeeGroupMNmw) {
            setErrorMsg("Employee Group (M/NM/W) is required.");
            return;
        }

        setSubmitting(true);
        setErrorMsg(null);

        const overrides: AdminRegistrationOverrides = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim() || undefined,
            gender: selectedGender as any,
            grade: selectedGrade as any,
            status: selectedStatus,
            aadharNumber: aadharNumber.trim() || undefined,
            dob: dob || null,
            doj: doj || null,
            departmentGroup: selectedDeptGroup,
            department: department.trim() || undefined,
            sectionName: finalSection,
            designation: finalDesignation,
            location: selectedRegion,
            region: locationDetail.trim() || undefined,
            projectLocation: projectLocation.trim() || undefined,
            organization: selectedOrganization,
            employeeGrouupMNmw: selectedEmployeeGroupMNmw,
            onRollContract: selectedOnRollContract,
            highestQualification: highestQualification.trim() || undefined,
            managerId: managerId.trim().toUpperCase() || undefined,
            managerName: managerName.trim() || undefined,
            managerEmail: managerEmail.trim().toLowerCase() || undefined,
            managerMobile: managerMobile.trim() || undefined
        };

        const res = await approveRegistrationRequest(request.id, overrides);

        if (res.success) {
            onApproved({
                id: request.id,
                ...overrides,
                empId: request.empId,
                name: overrides.name,
                email: overrides.email
            });
        } else {
            setErrorMsg(res.error || "Failed to approve registration request.");
            setSubmitting(false);
        }
    }

    const sessionInfo = request.batch.trainingSession;
    const targetProgramName = sessionInfo?.altProgramName || sessionInfo?.programName || request.batch.program.name;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-center z-10 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <HiOutlineUserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">
                                {isReadOnly ? 'Registration Request Details' : 'Review & Confirm Registration'}
                            </h2>
                            <p className="text-xs text-slate-400">
                                Participant: <span className="font-bold text-slate-700">{request.name}</span> ({request.empId})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <HiOutlineXMark size={22} />
                    </button>
                </div>

                {/* Target Session Banner */}
                <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-900">
                    <div className="flex items-center gap-2">
                        <HiOutlineCalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Enrolling into: <strong className="font-bold text-blue-800">{targetProgramName}</strong></span>
                    </div>
                    <div className="flex items-center gap-4 text-blue-700 font-medium text-[11px]">
                        {sessionInfo?.startDate && (
                            <span>
                                {new Date(sessionInfo.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                        {sessionInfo?.location && (
                            <span className="flex items-center gap-1">
                                <HiOutlineMapPin className="w-3.5 h-3.5" />
                                {sessionInfo.location}
                            </span>
                        )}
                    </div>
                </div>

                {errorMsg && (
                    <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                        <HiOutlineXCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Modal Form */}
                <form onSubmit={handleFormSubmit} className="p-6 space-y-6">

                    {/* Section 1: Basic & Personal Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Basic & Personal Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Emp ID *</label>
                                <input
                                    value={request.empId}
                                    readOnly
                                    className="w-full p-3 border border-slate-200 bg-slate-100 rounded-xl text-sm font-mono font-bold text-slate-500 cursor-not-allowed opacity-80"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Grade *</label>
                                <SearchableSelect
                                    name="grade"
                                    options={[
                                        { label: 'Executive', value: 'EXECUTIVE' },
                                        { label: 'Workman', value: 'WORKMAN' },
                                        { label: 'Apprentice', value: 'APPRENTICE' },
                                        { label: 'Trainee', value: 'TRAINEE' },
                                        { label: 'Local', value: 'LOCAL' }
                                    ]}
                                    value={selectedGrade}
                                    onChange={setSelectedGrade}
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status *</label>
                                <SearchableSelect
                                    name="status"
                                    options={[
                                        { label: 'Active', value: 'Active' },
                                        { label: 'Inactive', value: 'Inactive' }
                                    ]}
                                    value={selectedStatus}
                                    onChange={setSelectedStatus}
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Name *</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    readOnly={isReadOnly}
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address *</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    readOnly={isReadOnly}
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mobile Number</label>
                                <input
                                    value={mobile}
                                    onChange={e => setMobile(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="10-digit mobile"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Gender *</label>
                                <SearchableSelect
                                    name="gender"
                                    options={[
                                        { label: 'Male', value: 'MALE' },
                                        { label: 'Female', value: 'FEMALE' },
                                        { label: 'Other', value: 'OTHER' }
                                    ]}
                                    value={selectedGender}
                                    onChange={setSelectedGender}
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Aadhar Number</label>
                                <input
                                    value={aadharNumber}
                                    onChange={e => setAadharNumber(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="Aadhar Number"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date of Joining</label>
                                <input
                                    type="date"
                                    value={doj}
                                    onChange={e => setDoj(e.target.value)}
                                    readOnly={isReadOnly}
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</label>
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={e => setDob(e.target.value)}
                                    readOnly={isReadOnly}
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Department & Job Details (Including departmentGroup & employeeGrouupMNmw) */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Department & Job Details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Department Group *</label>
                                <SearchableSelect
                                    name="departmentGroup"
                                    options={[
                                        { label: 'AC ELECTRICAL', value: 'AC ELECTRICAL' },
                                        { label: 'HEMM', value: 'HEMM' },
                                        { label: 'HEMM LS', value: 'HEMM LS' },
                                        { label: 'HEMM AUTOELECTRICAL', value: 'HEMM AUTOELECTRICAL' },
                                        { label: 'STORES AND PROCUREMENT', value: 'STORES AND PROCUREMENT' },
                                        { label: 'OPERATORS', value: 'OPERATORS' },
                                        { label: 'HR/ADMIN/FINANCE', value: 'HR/ADMIN/FINANCE' },
                                        { label: 'OTHERS/UNDEFINED', value: 'OTHERS/UNDEFINED' },
                                        { label: 'CRUSHER & SCREENING', value: 'CRUSHER & SCREENING' },
                                        { label: 'MINING', value: 'MINING' }
                                    ]}
                                    value={selectedDeptGroup}
                                    onChange={setSelectedDeptGroup}
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Department</label>
                                <input
                                    value={department}
                                    onChange={e => setDepartment(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="Department"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Section *</label>
                                {sectionMode === 'select' ? (
                                    <SearchableSelect
                                        name="sectionName"
                                        options={[
                                            ...sectionOptions,
                                            ...(selectedSection && !sectionOptions.find(o => o.value === selectedSection) ? [{ label: selectedSection, value: selectedSection }] : []),
                                            { label: 'Other (Type Custom)', value: 'OTHER_CUSTOM' }
                                        ]}
                                        value={selectedSection}
                                        onChange={(val) => {
                                            const v = typeof val === 'string' ? val : String(val);
                                            if (v === 'OTHER_CUSTOM') {
                                                setSectionMode('custom');
                                                setCustomSection('');
                                            } else {
                                                setSelectedSection(v);
                                            }
                                        }}
                                        placeholder="Select Section"
                                        className="w-full"
                                        disabled={isReadOnly}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            value={customSection}
                                            onChange={e => setCustomSection(e.target.value)}
                                            placeholder="Type custom section..."
                                            className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSectionMode('select')}
                                            className="text-xs text-blue-600 hover:underline font-bold"
                                        >
                                            Back to Select
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Designation *</label>
                                {designationMode === 'select' ? (
                                    <SearchableSelect
                                        name="designation"
                                        options={[
                                            ...initialDesignations,
                                            ...(selectedDesignation && !initialDesignations.find(o => o.value === selectedDesignation) ? [{ label: selectedDesignation, value: selectedDesignation }] : []),
                                            { label: 'Other (Type Custom)', value: 'OTHER_CUSTOM' }
                                        ]}
                                        value={selectedDesignation}
                                        onChange={(val) => {
                                            const v = typeof val === 'string' ? val : String(val);
                                            if (v === 'OTHER_CUSTOM') {
                                                setDesignationMode('custom');
                                                setCustomDesignation('');
                                            } else {
                                                setSelectedDesignation(v);
                                            }
                                        }}
                                        placeholder="Select Designation"
                                        className="w-full"
                                        disabled={isReadOnly}
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            value={customDesignation}
                                            onChange={e => setCustomDesignation(e.target.value)}
                                            placeholder="Type custom designation..."
                                            className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setDesignationMode('select')}
                                            className="text-xs text-blue-600 hover:underline font-bold"
                                        >
                                            Back to Select
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Region *</label>
                                <SearchableSelect
                                    name="location"
                                    options={locationOptions}
                                    value={selectedRegion}
                                    onChange={setSelectedRegion}
                                    placeholder="Select Region"
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Location</label>
                                <input
                                    value={locationDetail}
                                    onChange={e => setLocationDetail(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="Location"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Project Location</label>
                                <input
                                    value={projectLocation}
                                    onChange={e => setProjectLocation(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="Project Location"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Organization</label>
                                <SearchableSelect
                                    name="organization"
                                    value={selectedOrganization}
                                    options={[
                                        { label: 'LMEL', value: 'LMEL' },
                                        { label: 'TSMPL', value: 'TSMPL' },
                                        { label: 'MTLL', value: 'MTLL' },
                                        { label: 'TEIPL', value: 'TEIPL' },
                                        ...(selectedOrganization && !['LMEL', 'TSMPL', 'MTLL', 'TEIPL'].includes(selectedOrganization) ? [{ label: selectedOrganization, value: selectedOrganization }] : [])
                                    ]}
                                    onChange={setSelectedOrganization}
                                    placeholder="Select Organization"
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Highest Qualification</label>
                                <input
                                    value={highestQualification}
                                    onChange={e => setHighestQualification(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="Highest Qualification"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Employee Group (M/NM/W) *</label>
                                <SearchableSelect
                                    name="employeeGrouupMNmw"
                                    options={[
                                        { label: 'Manager', value: 'Manager' },
                                        { label: 'Non Manager', value: 'Non Manager' },
                                        { label: 'Workman', value: 'Workman' }
                                    ]}
                                    value={selectedEmployeeGroupMNmw}
                                    onChange={setSelectedEmployeeGroupMNmw}
                                    placeholder="Select Employee Group"
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">On Roll / Contract *</label>
                                <SearchableSelect
                                    name="onRollContract"
                                    options={[
                                        { label: 'On-Roll', value: 'On-Roll' },
                                        { label: 'Contract', value: 'Contract' }
                                    ]}
                                    value={selectedOnRollContract}
                                    onChange={setSelectedOnRollContract}
                                    placeholder="Select On Roll / Contract"
                                    className="w-full"
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Reporting Manager Details */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Reporting Manager Details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager ID</label>
                                    {isFetchingManager && <span className="text-[10px] text-blue-600 font-semibold animate-pulse">Fetching details...</span>}
                                </div>
                                <input
                                    value={managerId}
                                    onChange={e => setManagerId(e.target.value.toUpperCase())}
                                    onBlur={handleManagerIdBlur}
                                    readOnly={isReadOnly}
                                    placeholder="Manager ID"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800 uppercase"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Name</label>
                                <input
                                    value={managerName}
                                    onChange={e => setManagerName(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="Manager Name"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Email</label>
                                <input
                                    type="email"
                                    value={managerEmail}
                                    onChange={e => setManagerEmail(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="manager@thriveni.com"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Mobile</label>
                                <input
                                    value={managerMobile}
                                    onChange={e => setManagerMobile(e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder="Manager Mobile"
                                    className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer Controls */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        {!isReadOnly && (
                            <button
                                type="button"
                                onClick={onRequestReject}
                                disabled={submitting}
                                className="px-5 py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider transition-colors"
                            >
                                Reject Request
                            </button>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors"
                            >
                                {isReadOnly ? 'Close' : 'Cancel'}
                            </button>
                            {!isReadOnly && (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-200 flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <><HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Approving...</>
                                    ) : (
                                        <><HiOutlineCheckCircle className="w-4 h-4" /> Approve & Enroll</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

