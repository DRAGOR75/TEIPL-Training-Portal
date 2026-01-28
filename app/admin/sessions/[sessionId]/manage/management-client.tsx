'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { addNominationsToBatch } from '@/app/actions/sessions';
import { UserPlus, QrCode, ClipboardList, CheckSquare, Square, Loader2 } from 'lucide-react';

interface Props {
    session: any;
    pendingNominations: any[];
    batchId: string;
}

export default function ManagementClient({ session, pendingNominations, batchId }: Props) {
    const [selectedNominations, setSelectedNominations] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState(false);

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
        await addNominationsToBatch(batchId, Array.from(selectedNominations));
        setIsAdding(false);
        setSelectedNominations(new Set()); // Reset selection
    };

    // Construct Join URL (using window.location for origin if on client)
    const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/enroll/${batchId}` : '';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: QR Code & Status */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                    <div className="bg-blue-50 p-2 rounded-xl inline-block">
                        <QrCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Direct Enrollment</h3>
                    <p className="text-sm text-slate-500">Scan to join this batch directly.</p>

                    <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-inner">
                        {joinUrl && <QRCode value={joinUrl} size={150} />}
                    </div>

                    <div className="text-xs font-mono bg-slate-50 p-2 rounded text-slate-500 break-all w-full">
                        {joinUrl || 'Loading...'}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-600" />
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
                            <span className="text-slate-500">Pending Requests</span>
                            <span className="font-medium text-slate-900">
                                {pendingNominations.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle & Right: Management Area */}
            <div className="lg:col-span-2 space-y-8">

                {/* 1. Add Candidates from pending list */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Pending Nominations</h3>
                            <p className="text-sm text-slate-500">Employees nominated for {session.programName} via TNI.</p>
                        </div>
                        <button
                            onClick={handleAddToBatch}
                            disabled={selectedNominations.size === 0 || isAdding}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Add Selected ({selectedNominations.size})
                        </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {pendingNominations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No pending nominations found for this program.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0">
                                    <tr>
                                        <th className="p-4 w-10">Select</th>
                                        <th className="p-4">Employee</th>
                                        <th className="p-4">Department</th>
                                        <th className="p-4">Justification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingNominations.map((nom) => (
                                        <tr key={nom.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <button onClick={() => toggleSelection(nom.id)} className="text-slate-400 hover:text-blue-600">
                                                    {selectedNominations.has(nom.id) ?
                                                        <CheckSquare className="w-5 h-5 text-blue-600" /> :
                                                        <Square className="w-5 h-5" />
                                                    }
                                                </button>
                                            </td>
                                            <td className="p-4 font-medium text-slate-900">
                                                {nom.employee.name}
                                                <div className="text-xs text-slate-400">{nom.employee.email}</div>
                                            </td>
                                            <td className="p-4 text-slate-600">{nom.employee.sectionName || '-'}</td>
                                            <td className="p-4 text-slate-500 italic truncate max-w-[200px]">
                                                {nom.justification}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

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
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {session.nominationBatch.nominations.map((nom: any) => (
                                        <tr key={nom.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-medium text-slate-900">
                                                {nom.employee.name}
                                                <div className="text-xs text-slate-400">{nom.employee.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                    {nom.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500 text-xs uppercase font-bold tracking-wide">
                                                {nom.source}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
