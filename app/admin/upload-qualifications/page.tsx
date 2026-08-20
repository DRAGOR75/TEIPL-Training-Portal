'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiOutlinePlay, HiCheckCircle, HiExclamationCircle, HiOutlineTrash, HiOutlineDocumentArrowDown } from 'react-icons/hi2';
import { bulkUploadQualifications, clearQualifications } from '@/app/actions/qualifications';
import Link from 'next/link';

export default function UploadQualificationsPage() {
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

                const result = await bulkUploadQualifications(chunk);

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
            
            const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm('CRITICAL WARNING: This will permanently delete ALL stored records in the Qualifications table. Existing employee profiles will remain intact, but their test and qualification records will be completely wiped clean.\n\nAre you absolutely sure you want to do this?')) {
            return;
        }

        setIsClearingDb(true);
        try {
            const result = await clearQualifications();
            if (result.success) {
                alert(`Successfully cleared database ledger. wiped ${result.count || 0} records!`);
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
            "Emp ID", "Emp Name", "Emp Location", "Subject name", 
            "Qualification Type", "Date Of Enrollment", "Test Date", 
            "Max Marks", "Marks Attained", "Pass", "Duration", 
            "Facilitator", "Designation", "Emp Group", "Gender", 
            "Reference / Remarks", "Short Prog Reference", "MTH", "Year"
        ];
        const rowData = [
            "10018532", "John Doe", "TRC", "PPE Safety", 
            "Online Test", "03/24/2025", "03/24/2025", 
            "50", "42", "TRUE", "2", 
            "Jane Smith", "Engineer", "Staff", "Male", 
            "Passed successfully", "PPE", "Mar", "2025"
        ];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rowData.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "qualifications_upload_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="min-h-screen bg-slate-100 py-10 px-4 md:px-8 selection:bg-purple-600 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-4">
                    <Link href="/admin/tni-dashboard/bulk-upload" className="text-sm font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 group w-fit">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Bulk Upload Hub
                    </Link>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-2">Data Import</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bulk Upload Qualifications & Tests</h1>
                        <p className="text-slate-500 mt-2 font-medium">Upload a unified CSV to batch import LMS records and Test marks.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClearDatabase}
                            disabled={isClearingDb || isProcessing}
                            className="flex items-center gap-2 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                        >
                            <HiOutlineTrash className="w-5 h-5" /> {isClearingDb ? 'Clearing DB...' : 'Wipe DB Ledger'}
                        </button>
                        <button
                            onClick={downloadSample}
                            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                        >
                            <HiOutlineDocumentArrowDown className="w-5 h-5" /> Sample CSV
                        </button>
                        {records.length > 0 && !isProcessing && (
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                            >
                                <HiOutlineTrash className="w-5 h-5" /> Clear Data
                            </button>
                        )}
                    </div>
                </div>

                {status === 'error' && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
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
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            disabled={status === 'parsing'}
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="bg-purple-50 text-purple-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                            <HiCloudArrowUp className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            {status === 'parsing' ? 'Parsing CSV...' : 'Drag & Drop CSV Here'}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-lg mx-auto mb-6 text-sm">
                            Supported headers include: Emp ID, Emp Name, Subject name, Qualification Type, Date Of Enrollment, Test Date, Max Marks, Marks Attained, Pass, Duration, Facilitator...
                        </p>
                        <span className="text-purple-600 font-bold bg-purple-50 px-6 py-2 rounded-xl">Browse Files</span>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="font-black text-slate-900 text-2xl mb-1">
                                        {records.length.toLocaleString()} Records Ready
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        This will insert {records.length} qualification records into the database.
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
                                        className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-lg"
                                    >
                                        {isProcessing ? (
                                            <>Uploading to Database...</>
                                        ) : (
                                            <><HiOutlinePlay className="w-6 h-6" /> Start Bulk Upload</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {(isProcessing || status === 'completed') && (
                                <div className="mt-8">
                                    <div className="flex justify-between text-sm font-bold mb-3">
                                        <span className="text-slate-700">Import Progress</span>
                                        <span className="text-purple-600">{Math.round((progress.current / progress.total) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                                        <div
                                            className="bg-purple-600 h-full rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 font-medium text-right">
                                        {progress.current.toLocaleString()} / {progress.total.toLocaleString()} records processed
                                    </p>
                                </div>
                            )}

                            {uploadStats && (
                                <div className={`mt-6 p-6 rounded-2xl border ${uploadStats.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <p className="font-bold text-lg mb-2">Upload Summary</p>
                                    <p className="text-slate-700 font-medium">✅ Successfully Imported: {uploadStats.success} records</p>
                                    {uploadStats.errors.length > 0 && (
                                        <div className="mt-4 text-sm text-amber-900 max-h-48 overflow-y-auto bg-amber-100/50 p-4 rounded-xl">
                                            <p className="font-bold mb-2 flex items-center gap-1"><HiExclamationCircle /> Encountered {uploadStats.errors.length} errors/warnings:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {uploadStats.errors.slice(0, 50).map((err, i) => <li key={i}>{err}</li>)}
                                                {uploadStats.errors.length > 50 && <li className="font-bold">...and {uploadStats.errors.length - 50} more omitted</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider text-[10px] border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Emp ID</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Name</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Subject</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Qual. Type</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Test Date</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Max Marks</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Obtained</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Pass/Fail</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Facilitator</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.slice(0, 100).map((record, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded w-fit">
                                                    {record['Emp ID'] || record.empID || record.EmpId || record.empId || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                {record['Emp Name'] || record.empName || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {record['Subject name'] || record['LMS Program Name'] || record['Test Subject Name'] || record.subjectName || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {record['Qualification Type'] || record.qualificationType || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {record['Date of Completion'] || record['Test Date'] || record.testDate || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {record['Max Marks'] || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {record['Marks Attained'] || record['Marks attaind/ Grade'] || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {record['Qualified'] || record['Pass'] || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {record['Facilitator'] || record['Examiner Name'] || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {records.length > 100 && (
                                <div className="p-6 text-center text-slate-500 font-bold bg-slate-50 border-t border-slate-100">
                                    Showing 100 of {records.length.toLocaleString()} records...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
