'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiOutlinePaperAirplane, HiCheckCircle, HiExclamationCircle, HiOutlineTrash } from 'react-icons/hi2';
import { sendBulkUserCredentials, BulkEmailResult } from '@/app/actions/bulk-email';

interface ParsedUser {
    empId: string;
    name: string;
    email: string;
    password: string;
    department: string;
    designation: string;
    status?: 'pending' | 'success' | 'error';
    message?: string;
}

import BulkEmailPreviewModal from './BulkEmailPreviewModal';

export default function BulkEmailPage() {
    const [users, setUsers] = useState<ParsedUser[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            complete: (results) => {
                const parsedUsers: ParsedUser[] = results.data
                    .filter((row: any) => row.length >= 4) // Ensure potential validity (min 4 cols)
                    .map((row: any) => ({
                        empId: row[0]?.trim(),
                        name: row[1]?.trim(),
                        email: row[2]?.trim(),
                        password: row[3]?.trim(),
                        designation: '', // Not in new format
                        department: '', // Not in new format
                        status: 'pending' as const
                    }))
                    .filter(user => user.email && user.email.includes('@')); // Basic validation

                setUsers(parsedUsers);
            },
            header: false,
            skipEmptyLines: true,
        });
    };

    const handleOpenReview = () => {
        setIsModalOpen(true);
    };

    const handleConfirmSend = async (subject: string, templateHtml: string) => {
        setIsModalOpen(false);
        setIsProcessing(true);
        setProgress({ current: 0, total: users.length });

        // Process in batches of 5 to avoid overwhelming the server
        const BATCH_SIZE = 5;
        const newUsers = [...users];

        for (let i = 0; i < newUsers.length; i += BATCH_SIZE) {
            const batch = newUsers.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (user, index) => {
                // Only process pending
                if (user.status !== 'pending') return;

                const actualIndex = i + index;

                // Generate User Specific HTML from Template
                const userHtml = templateHtml
                    .replace(/{name}/g, user.name || '')
                    .replace(/{empId}/g, user.empId || '')
                    .replace(/{password}/g, user.password || '');
                // Removed dynamic replacement for department/designation as they are no longer in CSV

                try {
                    const result = await sendBulkUserCredentials(
                        user.name,
                        user.email,
                        user.empId,
                        user.password,
                        subject,
                        userHtml
                    );

                    newUsers[actualIndex] = {
                        ...user,
                        status: result.success ? 'success' : 'error',
                        message: result.error
                    };
                } catch (err: any) {
                    newUsers[actualIndex] = {
                        ...user,
                        status: 'error',
                        message: err.message
                    };
                }
            }));

            setUsers([...newUsers]);
            setProgress({ current: Math.min(i + BATCH_SIZE, newUsers.length), total: newUsers.length });

            // Add a small delay between batches to respect rate limits
            if (i + BATCH_SIZE < newUsers.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        setIsProcessing(false);
        alert('Bulk email processing completed.');
    };

    const handleClear = () => {
        if (confirm('Clear all data?')) {
            setUsers([]);
            setProgress({ current: 0, total: 0 });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Bulk User Import & Email</h1>
                    <p className="text-slate-500">Upload CSV to send credentials to users.</p>
                </div>
                {users.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <HiOutlineTrash /> Clear List
                    </button>
                )}
            </div>

            {users.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                    <HiCloudArrowUp className="w-12 h-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Upload CSV File</h3>
                    <p className="text-slate-500 mb-6 max-w-md">
                        Format: EmpID, Name, Email, Password
                    </p>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer max-w-xs mx-auto
            "
                    />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-slate-700">
                                {users.length} Records Found
                                {isProcessing && <span className="ml-2 text-sm font-normal text-slate-500">({progress.current}/{progress.total} processed)</span>}
                            </div>
                            <button
                                onClick={handleOpenReview}
                                disabled={isProcessing || users.every(u => u.status === 'success')}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>Processing...</>
                                ) : (
                                    <><HiOutlinePaperAirplane className="-rotate-45" /> Review & Send</>
                                )}
                            </button>
                        </div>
                        {isProcessing && (
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">User Details</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Password</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            {user.status === 'pending' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Pending</span>}
                                            {user.status === 'success' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><HiCheckCircle className="mr-1" /> Sent</span>}
                                            {user.status === 'error' && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><HiExclamationCircle className="mr-1" /> {user.message || 'Failed'}</span>}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-slate-900">{user.name}</div>
                                            <div className="text-slate-500 text-xs">{user.empId}</div>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-slate-600">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs">
                                            {user.password}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {users.length > 0 && (
                <BulkEmailPreviewModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmSend}
                    sampleData={users[0]}
                />
            )}
        </div>
    );
}
