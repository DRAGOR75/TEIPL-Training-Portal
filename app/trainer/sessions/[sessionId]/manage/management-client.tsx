'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { addNominationsToBatch, removeNominationFromBatch } from '@/app/actions/sessions';
import {
    HiOutlineUserPlus,
    HiOutlineQrCode,
    HiOutlineClipboardDocumentList,
    HiOutlineCheckCircle,
    HiOutlineMinusCircle,
    HiOutlineArrowPath,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineTrash,
    HiOutlineBars3
} from 'react-icons/hi2';
import ConfirmBatchButton from '@/components/admin/ConfirmBatchButton';
import SendInvitationButton from '@/components/admin/SendInvitationButton';

interface Props {
    session: any;
    pendingNominations: any[];
    batchId: string;
}

export default function ManagementClient({ session, pendingNominations, batchId }: Props) {
    const [selectedNominations, setSelectedNominations] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [designationFilter, setDesignationFilter] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isLocked = session.nominationBatch?.status === 'Scheduled' || session.nominationBatch?.status === 'Completed';

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedNominations);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedNominations(newSet);
    };

    const handleAddToBatch = async () => {
        if (selectedNominations.size === 0) return;

        setIsAdding(true);
        const result = await addNominationsToBatch(batchId, Array.from(selectedNominations));

        if (result.success) {
            setSelectedNominations(new Set()); // Reset selection only on success
        } else {
            alert(result.error || 'Failed to add nominations. Please try again.');
        }

        setIsAdding(false);
    };

    const handleRemove = async (nominationId: string) => {
        if (!confirm('Are you sure you want to remove this participant? They will be returned to the pending list.')) return;

        setRemovingId(nominationId);
        const result = await removeNominationFromBatch(nominationId);

        if (!result.success || result.error) {
            alert(result.error || 'Failed to remove participant.');
        }

        setRemovingId(null);
    };

    // Construct Join URL (using window.location for origin if on client)
    const [joinUrl, setJoinUrl] = useState('');

    useEffect(() => {
        setJoinUrl(`${window.location.origin}/enroll/${batchId}`);
    }, [batchId]);

    const uniqueLocations = Array.from(new Set(pendingNominations.map(n => n.employee.location).filter(Boolean))).sort();
    const uniqueDesignations = Array.from(new Set(pendingNominations.map(n => n.employee.designation).filter(Boolean))).sort();

    const filteredPending = pendingNominations.filter(nom => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || (
            nom.employee.name?.toLowerCase().includes(q) ||
            nom.employee.id?.toLowerCase().includes(q) ||
            nom.employee.email?.toLowerCase().includes(q)
        );
        const matchesLocation = !locationFilter || nom.employee.location === locationFilter;
        const matchesDesignation = !designationFilter || nom.employee.designation === designationFilter;

        return matchesSearch && matchesLocation && matchesDesignation;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-start">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all font-bold text-sm ${isSidebarOpen ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50'}`}
                >
                    <HiOutlineBars3 className="w-5 h-5" />
                    {isSidebarOpen ? 'Hide Controls' : 'Show Controls'}
                </button>
            </div>

            <div className={`grid grid-cols-1 ${isSidebarOpen ? 'lg:grid-cols-3' : ''} gap-8`}>

                {/* Left Column: QR Code & Status */}
                {isSidebarOpen && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                            <div className="bg-blue-50 p-2 rounded-xl inline-block">
                                <HiOutlineQrCode className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-slate-900">Direct Enrollment</h3>
                            <p className="text-sm text-slate-500">Scan to join this batch directly.</p>

                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-inner">
                                {joinUrl && <QRCode value={joinUrl} size={150} />}
                            </div>

                            <a
                                href={`/enroll/${batchId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest mt-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Live Link <HiOutlineArrowTopRightOnSquare size={10} />
                            </a>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <HiOutlineClipboardDocumentList className="w-5 h-5 text-indigo-600" />
                                Batch Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Status</span>
                                    <span className="font-medium text-slate-900 bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                        {session.nominationBatch?.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Enrolled</span>
                                    <span className="font-medium text-slate-900">
                                        {session.nominationBatch?.nominations.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Waitlist (TNI)</span>
                                    <span className="font-medium text-slate-900">
                                        {filteredPending.length !== pendingNominations.length
                                            ? `${filteredPending.length} / ${pendingNominations.length}`
                                            : pendingNominations.length}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Approved for Batching</span>
                                    <span className="font-medium text-green-600">
                                        {filteredPending.filter(n => n.managerApprovalStatus === 'Approved').length !== pendingNominations.filter(n => n.managerApprovalStatus === 'Approved').length
                                            ? `${filteredPending.filter(n => n.managerApprovalStatus === 'Approved').length} / ${pendingNominations.filter(n => n.managerApprovalStatus === 'Approved').length}`
                                            : pendingNominations.filter(n => n.managerApprovalStatus === 'Approved').length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Middle & Right: Management Area */}
                <div className={`${isSidebarOpen ? 'lg:col-span-2' : ''} space-y-8`}>

                    {/* 2. Current Batch List */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">Enrolled Participants</h3>
                            <p className="text-sm text-slate-500">Employees currently in this batch.</p>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {session.nominationBatch?.nominations.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    Enrollment is empty. Add people from the waiting list or share the QR code.
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0">
                                        <tr>
                                            <th className="p-4">Employee</th>
                                            <th className="p-4">Manager Approval</th>
                                            <th className="p-4">Department</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Source</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {([...session.nominationBatch.nominations].sort((a, b) => {
                                            const priority: Record<string, number> = { 'Approved': 1, 'Pending': 2, 'Rejected': 3 };
                                            return (priority[a.managerApprovalStatus] || 99) - (priority[b.managerApprovalStatus] || 99);
                                        })).map((nom: any) => (
                                            <tr key={nom.id} className="hover:bg-slate-50">
                                                <td className="p-4 font-medium text-slate-900">
                                                    {nom.employee.name}
                                                    <div className="text-xs text-slate-400">{nom.employee.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${nom.managerApprovalStatus === 'Approved'
                                                        ? 'bg-green-50 text-green-700 border-green-100'
                                                        : nom.managerApprovalStatus === 'Rejected'
                                                            ? 'bg-red-50 text-red-700 border-red-100'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        }`}>
                                                        {nom.managerApprovalStatus}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600 font-medium">{nom.employee.sectionName || '-'}</td>
                                                <td className="p-4">
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold font-mono">
                                                        {nom.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500 text-xs uppercase font-bold tracking-wide">
                                                    {nom.source}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {!isLocked && (
                                                        <button
                                                            onClick={() => handleRemove(nom.id)}
                                                            disabled={removingId === nom.id}
                                                            className="text-slate-300 hover:text-red-500 p-2 transition-colors disabled:opacity-50"
                                                            title="Remove from batch"
                                                        >
                                                            {removingId === nom.id ? (
                                                                <HiOutlineArrowPath className="animate-spin" size={18} />
                                                            ) : (
                                                                <HiOutlineTrash size={18} />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* 1. Add Candidates from pending list */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Waitlist (TNI)</h3>
                                <p className="text-sm text-slate-500">Employees whose managers approved the need for {session.programName}.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <input
                                    type="text"
                                    placeholder="Search name, ID, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full md:w-48 px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <select
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    className="px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">All Locations</option>
                                    {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                                <select
                                    value={designationFilter}
                                    onChange={(e) => setDesignationFilter(e.target.value)}
                                    className="px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none max-w-[200px] truncate"
                                >
                                    <option value="">All Designations</option>
                                    {uniqueDesignations.map(des => <option key={des} value={des}>{des}</option>)}
                                </select>
                                <button
                                    onClick={handleAddToBatch}
                                    disabled={selectedNominations.size === 0 || isAdding || isLocked}
                                    title={isLocked ? "Batch is locked" : "Add selected"}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 whitespace-nowrap"
                                >
                                    {isAdding ? <HiOutlineArrowPath className="w-4 h-4 animate-spin" /> : <HiOutlineUserPlus className="w-4 h-4" />}
                                    {isAdding ? 'Adding...' : `Add (${selectedNominations.size})`}
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[800px] overflow-y-auto">
                            {filteredPending.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No pending nominations found for this program.
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0">
                                        <tr>
                                            <th className="p-4 w-10">Select</th>
                                            <th className="p-4">Employee</th>
                                            <th className="p-4">TNI Status</th>
                                            <th className="p-4">Department</th>
                                            <th className="p-4 text-right">Justification</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPending.map((nom) => {
                                            const isSelected = selectedNominations.has(nom.id);
                                            const isSelectable = !isLocked;

                                            return (
                                                <tr
                                                    key={nom.id}
                                                    onClick={() => isSelectable && toggleSelection(nom.id)}
                                                    className={`transition-colors group select-none ${isSelectable ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed opacity-60'} ${isSelected ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <td className="p-4 text-center">
                                                        <div
                                                            title={isLocked ? "Batch is locked" : "Click to select"}
                                                            className={`transition-all ${isSelected ? 'text-blue-600 scale-110' : 'text-slate-300 group-hover:text-blue-400'}`}
                                                        >
                                                            {isSelected ?
                                                                <HiOutlineCheckCircle className="w-6 h-6" /> :
                                                                <HiOutlineMinusCircle className="w-6 h-6" />
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-900">{nom.employee.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{nom.employee.id}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${nom.status === 'Approved'
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                                            {nom.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-slate-600 text-xs font-medium">{nom.employee.sectionName || '-'}</td>
                                                    <td className="p-4 text-slate-500 text-xs italic truncate max-w-[150px] text-right">
                                                        {nom.justification || 'No justification provided'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        {session.nominationBatch && (
                            <>
                                <SendInvitationButton
                                    sessionId={session.id}
                                    emailsSent={session.emailsSent}
                                    participantCount={session.nominationBatch.nominations.length}
                                    isLocked={isLocked}
                                />
                                <ConfirmBatchButton
                                    sessionId={session.id}
                                    initialStatus={session.nominationBatch.status}
                                />
                            </>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
