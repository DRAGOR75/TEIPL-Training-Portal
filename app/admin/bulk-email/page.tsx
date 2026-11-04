'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiOutlinePaperAirplane, HiCheckCircle, HiExclamationCircle, HiOutlineTrash, HiArrowDownTray } from 'react-icons/hi2';
import { sendBulkUserCredentials } from '@/app/actions/bulk-email';
import BulkEmailPreviewModal from './BulkEmailPreviewModal';

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

export default function BulkEmailPage() {
    const [users, setUsers] = useState<ParsedUser[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadWarning, setUploadWarning] = useState<string | null>(null);

    const downloadSample = () => {
        const headers = ["Emp ID", "Name", "Email", "Password"];
        const rowData = ["10018532", "Payal Pradhan", "payal.pradhan@thriveni.com", "Thriveni@2026"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rowData.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bulk_email_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadWarning(null);

        Papa.parse(file, {
            complete: (results) => {
                if (!results.data || results.data.length === 0) {
                    alert('The uploaded CSV file is empty.');
                    return;
                }

                // Helper to match headers regardless of BOM (\ufeff), casing, spaces, or aliases
                const findField = (row: any, aliases: string[]) => {
                    const keys = Object.keys(row || {});
                    const match = keys.find(k =>
                        aliases.some(alias =>
                            k.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, '')
                        )
                    );
                    return match ? String(row[match] ?? '').trim() : '';
                };

                const empIdAliases = ['empid', 'emp_id', 'emp id', 'employeeid', 'employee id', 'userid', 'user id', 'id', 'emp code', 'employeecode'];
                const nameAliases = ['name', 'empname', 'emp name', 'employeename', 'employee name', 'user name', 'username'];
                const emailAliases = ['email', 'emailid', 'email id', 'emailaddress', 'email address', 'mail'];
                const passwordAliases = ['password', 'pass', 'pwd', 'temppassword', 'temp password', 'credentials'];

                let invalidCount = 0;
                const parsedUsers: ParsedUser[] = [];

                for (const row of results.data as any[]) {
                    const empId = findField(row, empIdAliases);
                    const name = findField(row, nameAliases);
                    const email = findField(row, emailAliases);
                    const password = findField(row, passwordAliases);

                    // Skip empty rows
                    if (!empId && !name && !email) continue;

                    if (!email || !email.includes('@') || !empId) {
                        invalidCount++;
                        continue;
                    }

                    parsedUsers.push({
                        empId,
                        name: name || empId,
                        email,
                        password,
                        designation: '',
                        department: '',
                        status: 'pending' as const
                    });
                }

                if (parsedUsers.length === 0) {
                    const detectedHeaders = Object.keys(results.data[0] || {}).join(', ');
                    alert(`Could not find valid users in the CSV.\n\nDetected columns: [${detectedHeaders}]\nRequired columns: EmpID, Email, Name, Password.\n\nPlease check your headers or use the Download Sample CSV button.`);
                    return;
                }

                if (invalidCount > 0) {
                    setUploadWarning(`Note: ${invalidCount} rows were skipped due to missing email or Employee ID.`);
                }

                setUsers(parsedUsers);
            },
            header: true,
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

                // Generate User Specific HTML & Subject from Template (Case-insensitive replacement)
                const userHtml = templateHtml
                    .replace(/\{name\}/gi, user.name || '')
                    .replace(/\{empId|empid|emp_id\}/gi, user.empId || '')
                    .replace(/\{password|pass|pwd\}/gi, user.password || '');

                const userSubject = subject
                    .replace(/\{name\}/gi, user.name || '')
                    .replace(/\{empId|empid|emp_id\}/gi, user.empId || '');

                try {
                    const result = await sendBulkUserCredentials(
                        user.name,
                        user.email,
                        user.empId,
                        user.password,
                        userSubject,
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
            setUploadWarning(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Bulk User Import & Email</h1>
                    <p className="text-slate-500">Upload CSV to send credentials or custom notifications to users.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={downloadSample}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-200"
                    >
                        <HiArrowDownTray /> Download Sample CSV
                    </button>
                    {users.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
                        >
                            <HiOutlineTrash /> Clear List
                        </button>
                    )}
                </div>
            </div>

            {uploadWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
                    ⚠️ {uploadWarning}
                </div>
            )}

            {users.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                    <HiCloudArrowUp className="w-12 h-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Upload CSV File</h3>
                    <p className="text-slate-500 mb-6 max-w-md">
                        Required Columns: <strong>EmpID</strong>, <strong>Name</strong>, <strong>Email</strong>, <strong>Password</strong><br/>
                        <span className="text-xs text-slate-400">(Order does not matter. Headers are case-insensitive)</span>
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
                                            {user.password || <span className="italic text-slate-400">None</span>}
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
