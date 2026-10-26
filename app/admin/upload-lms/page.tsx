'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiCheckCircle, HiExclamationCircle, HiOutlineTrash, HiOutlineDocumentArrowDown, HiOutlineBookOpen } from 'react-icons/hi2';
import { bulkUploadLmsRecords, clearLmsRecords } from '@/app/actions/qualifications';
import Link from 'next/link';

export default function UploadLmsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'completed' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadStats, setUploadStats] = useState<{ success: number; errors: string[] } | null>(null);
    const [isClearingDb, setIsClearingDb] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('parsing');
        setErrorMessage('');
        setUploadStats(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                const parsedRecords = results.data as any[];
                setRecords(parsedRecords);
                setStatus('idle');
            },
            error: (err) => {
                setStatus('error');
                setErrorMessage(err.message);
            }
        });
    };

    const handleStartUpload = async () => {
        if (records.length === 0) return;

        setIsProcessing(true);
        setStatus('uploading');
        setProgress({ current: 0, total: records.length });
        setErrorMessage('');
        
        const TOTAL_RECORDS = records.length;
        const CHUNK_SIZE = 500;
        let successTotal = 0;
        let allErrors: string[] = [];
        let processedCount = 0;

        try {
            for (let i = 0; i < TOTAL_RECORDS; i += CHUNK_SIZE) {
                const chunk = records.slice(i, i + CHUNK_SIZE);
                const currentBatchNum = Math.floor(i / CHUNK_SIZE) + 1;

                const result = await bulkUploadLmsRecords(chunk);

                if (result.success) {
                    successTotal += result.count || 0;
                } else {
                    allErrors.push(`Batch ${currentBatchNum} failed: ${result.error}`);
                }

                processedCount += chunk.length;
                setProgress({ current: Math.min(processedCount, TOTAL_RECORDS), total: TOTAL_RECORDS });
            }

            setUploadStats({
                success: successTotal,
                errors: allErrors
            });
            setStatus('completed');
        } catch (err: any) {
            console.error(err);
            setUploadStats({ success: successTotal, errors: [...allErrors, err.message || "Process interrupted or failed."] });
            setStatus('error');
            setErrorMessage(err.message || 'Unknown error occurred.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClear = () => {
        if (confirm('Clear all parsed data and start over?')) {
            setRecords([]);
            setProgress({ current: 0, total: 0 });
            setStatus('idle');
            setErrorMessage('');
            setUploadStats(null);
            
            const fileInput = document.getElementById('csv-upload-lms') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm('CRITICAL WARNING: This will permanently delete ALL stored records in the lms_records table.\n\nAre you absolutely sure you want to proceed?')) {
            return;
        }

        setIsClearingDb(true);
        try {
            const result = await clearLmsRecords();
            if (result.success) {
                alert(`Successfully cleared LMS ledger. Wiped ${result.count || 0} records!`);
                setRecords([]);
                setStatus('idle');
            } else {
                alert(`Error clearing database: ${result.error}`);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsClearingDb(false);
        }
    };

    const downloadSample = () => {
        const headers = [
            "Emp ID", "Emp Name", "Emp Location", "Course ID", "Course Name", 
            "Date Of Enrollment", "Date of Completion", "Duration", "Max Marks", "Marks Attained", 
            "Pass", "Designation", "Emp Group", "Gender", 
            "Reference / Remarks", "MTH", "Year"
        ];
        const rowData = [
            "10018532", "Payal Pradhan", "TRC", "LMS-PPE", "PPE Safety", 
            "24-Mar-2025", "24-Mar-2025", "2", "100", "85", 
            "TRUE", "Officer", "Staff", "Female", 
            "Completed on LMS Portal", "Mar", "24-25"
        ];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rowData.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lms_records_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="min-h-screen bg-slate-100 py-10 px-4 md:px-8 selection:bg-indigo-600 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/admin/tni-dashboard/bulk-upload" className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 group w-fit">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Bulk Upload Hub
                    </Link>
                    <Link href="/admin/tests-qualifications" className="text-xs font-bold text-indigo-600 hover:underline">
                        View LMS Ledger →
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                Target Table: lms_records
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <HiOutlineBookOpen className="text-indigo-600" />
                            Bulk Upload LMS Records
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Import e-learning completions, module hours spent, enrollment dates, and pass certificates into the dedicated LMS ledger.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClearDatabase}
                            disabled={isClearingDb || isProcessing}
                            className="flex items-center gap-2 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                        >
                            <HiOutlineTrash className="w-5 h-5" /> {isClearingDb ? 'Clearing DB...' : 'Wipe LMS Ledger'}
                        </button>
                        <button
                            onClick={downloadSample}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                        >
                            <HiOutlineDocumentArrowDown className="w-5 h-5" /> Sample LMS CSV
                        </button>
                        {records.length > 0 && !isProcessing && (
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>
                </div>

                {/* Status/Error Messages */}
                {status === 'error' && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                        <div className="flex items-center">
                            <HiExclamationCircle className="h-6 w-6 text-red-500 mr-2" />
                            <h3 className="text-red-800 font-bold">Upload Error</h3>
                        </div>
                        <p className="text-red-700 mt-1 font-medium">{errorMessage}</p>
                    </div>
                )}

                {records.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer relative overflow-hidden group">
                        <input
                            id="csv-upload-lms"
                            type="file"
                            accept=".csv"
                            disabled={status === 'parsing'}
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                            <HiCloudArrowUp className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            {status === 'parsing' ? 'Parsing LMS CSV...' : 'Drag & Drop LMS CSV Here'}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-lg mx-auto mb-6 text-sm">
                            Supported headers: Emp ID, Course Name (or Subject name), Date Of Enrollment, Date of Completion, Duration (hours), Pass...
                        </p>
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-6 py-2 rounded-xl">Browse LMS CSV</span>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="font-black text-slate-900 text-2xl mb-1">
                                        {records.length.toLocaleString()} LMS Records Ready
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        Records will be imported strictly into the <span className="font-mono font-bold text-indigo-600">lms_records</span> database table.
                                    </p>
                                </div>
                                
                                {status === 'completed' ? (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-xl font-bold border border-emerald-200 shadow-sm">
                                        <HiCheckCircle className="w-6 h-6" />
                                        Upload Complete!
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStartUpload}
                                        disabled={isProcessing}
                                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-lg"
                                    >
                                        <HiCloudArrowUp className="w-6 h-6" />
                                        {isProcessing ? 'Importing LMS...' : 'Confirm & Upload to lms_records'}
                                    </button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {isProcessing && (
                                <div className="mt-8">
                                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                        <span>Importing LMS Records...</span>
                                        <span>{progress.current} / {progress.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            {uploadStats && (
                                <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                    <div className="text-emerald-700 font-bold text-sm">
                                        Successfully imported: {uploadStats.success} LMS records
                                    </div>
                                    {uploadStats.errors.length > 0 && (
                                        <div className="mt-2 text-rose-600 text-xs font-semibold">
                                            {uploadStats.errors.map((e, idx) => (
                                                <div key={idx}>{e}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Preview Table */}
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/75 sticky top-0 backdrop-blur z-10 text-slate-500 font-bold">
                                        <th className="p-4">Emp ID</th>
                                        <th className="p-4">Emp Name</th>
                                        <th className="p-4">Course Name</th>
                                        <th className="p-4">Enrollment Date</th>
                                        <th className="p-4">Completion Date</th>
                                        <th className="p-4">Duration (hrs)</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {records.slice(0, 50).map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-bold text-slate-900">{r['Emp ID'] || r.empID || r.EmpId || '-'}</td>
                                            <td className="p-4 text-slate-600">{r['Emp Name'] || r.empName || '-'}</td>
                                            <td className="p-4 text-slate-700 font-semibold">{r['Course Name'] || r['Subject name'] || r.courseName || r.subjectName || '-'}</td>
                                            <td className="p-4 text-slate-500">{r['Date Of Enrollment'] || r['enrollment Date'] || r.enrollmentDate || '-'}</td>
                                            <td className="p-4 text-slate-500">{r['Date of Completion'] || r['Test Date'] || r.completionDate || '-'}</td>
                                            <td className="p-4 font-bold text-indigo-700">{r['Duration'] || r['LMS Program Hours Spent'] || r.duration || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    String(r['Pass'] || r['Qualified']).toLowerCase() === 'true' 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {String(r['Pass'] || r['Qualified'] || '-')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
