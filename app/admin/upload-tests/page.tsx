'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiCheckCircle, HiExclamationCircle, HiOutlineTrash, HiOutlineDocumentArrowDown, HiOutlineClipboardDocumentCheck } from 'react-icons/hi2';
import { bulkUploadTestRecords, clearTestRecords } from '@/app/actions/qualifications';
import Link from 'next/link';

export default function UploadTestsPage() {
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

                const result = await bulkUploadTestRecords(chunk);

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
            
            const fileInput = document.getElementById('csv-upload-tests') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm('CRITICAL WARNING: This will permanently delete ALL stored records in the test_records table.\n\nAre you absolutely sure you want to proceed?')) {
            return;
        }

        setIsClearingDb(true);
        try {
            const result = await clearTestRecords();
            if (result.success) {
                alert(`Successfully cleared test ledger. Wiped ${result.count || 0} records!`);
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
            "Emp ID", "Emp Name", "Emp Location", "Subject ID", "Subject name", 
            "Facilitator", "Test Date", "Duration", "Max Marks", "Marks Attained", 
            "Pass", "Designation", "Emp Group", "Gender", 
            "Reference / Remarks", "Short Prog Reference", "MTH", "Year"
        ];
        const rowData = [
            "10011377", "Soumya Ranjan Pati", "TRC", "PROG-01", "Unit and Conversion Workbook", 
            "Gaurav", "15-Oct-2022", "1", "50", "49", 
            "TRUE", "Officer", "Staff", "Male", 
            "Inplant Sep 22 Batch", "Drill", "Oct", "22-23"
        ];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rowData.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "test_records_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="min-h-screen bg-slate-100 py-10 px-4 md:px-8 selection:bg-blue-600 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/admin/tni-dashboard/bulk-upload" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 group w-fit">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Bulk Upload Hub
                    </Link>
                    <Link href="/admin/tests-qualifications" className="text-xs font-bold text-blue-600 hover:underline">
                        View Tests Ledger →
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                Target Table: test_records
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <HiOutlineClipboardDocumentCheck className="text-blue-600" />
                            Bulk Upload Tests & Assessments
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Import online and offline test marks, facilitator scores, and qualified status into the dedicated test records ledger.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClearDatabase}
                            disabled={isClearingDb || isProcessing}
                            className="flex items-center gap-2 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                        >
                            <HiOutlineTrash className="w-5 h-5" /> {isClearingDb ? 'Clearing DB...' : 'Wipe Tests Ledger'}
                        </button>
                        <button
                            onClick={downloadSample}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                        >
                            <HiOutlineDocumentArrowDown className="w-5 h-5" /> Sample Tests CSV
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
                            id="csv-upload-tests"
                            type="file"
                            accept=".csv"
                            disabled={status === 'parsing'}
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                            <HiCloudArrowUp className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            {status === 'parsing' ? 'Parsing Test CSV...' : 'Drag & Drop Test Marks CSV Here'}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-lg mx-auto mb-6 text-sm">
                            Supported headers: Emp ID, Subject name, Facilitator, Test Date, Max Marks, Marks Attained, Pass, Duration...
                        </p>
                        <span className="text-blue-600 font-bold bg-blue-50 px-6 py-2 rounded-xl">Browse Test CSV</span>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="font-black text-slate-900 text-2xl mb-1">
                                        {records.length.toLocaleString()} Test Records Ready
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        Records will be imported strictly into the <span className="font-mono font-bold text-blue-600">test_records</span> database table.
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
                                        className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-lg"
                                    >
                                        <HiCloudArrowUp className="w-6 h-6" />
                                        {isProcessing ? 'Importing Tests...' : 'Confirm & Upload to test_records'}
                                    </button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {isProcessing && (
                                <div className="mt-8">
                                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                        <span>Importing Records...</span>
                                        <span>{progress.current} / {progress.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            {uploadStats && (
                                <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
                                    <div className="text-emerald-700 font-bold text-sm">
                                        Successfully imported: {uploadStats.success} test records
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
                                        <th className="p-4">Subject Name</th>
                                        <th className="p-4">Facilitator</th>
                                        <th className="p-4">Test Date</th>
                                        <th className="p-4">Marks</th>
                                        <th className="p-4">Pass</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {records.slice(0, 50).map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-bold text-slate-900">{r['Emp ID'] || r.empID || r.EmpId || '-'}</td>
                                            <td className="p-4 text-slate-600">{r['Emp Name'] || r.empName || '-'}</td>
                                            <td className="p-4 text-slate-700 font-semibold">{r['Subject name'] || r.subjectName || '-'}</td>
                                            <td className="p-4 text-slate-600">{r['Facilitator'] || r.facilitator || '-'}</td>
                                            <td className="p-4 text-slate-500">{r['Test Date'] || r.testDate || '-'}</td>
                                            <td className="p-4 font-bold text-blue-700">{r['Marks Attained'] || r.obtainedMarks || '-'} / {r['Max Marks'] || r.maxMarks || '-'}</td>
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
