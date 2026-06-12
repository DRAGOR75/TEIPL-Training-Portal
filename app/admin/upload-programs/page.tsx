'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiOutlinePlay, HiCheckCircle, HiExclamationCircle, HiOutlineTrash, HiOutlineDocumentArrowDown, HiTrash } from 'react-icons/hi2';
import { processProgramBatch, ProgramRecord, clearProgramCatalog } from '@/app/actions/upload-programs';

export default function UploadProgramsPage() {
    const [records, setRecords] = useState<ProgramRecord[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'completed' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isClearingDb, setIsClearingDb] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('parsing');
        setErrorMessage('');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedRecords: ProgramRecord[] = results.data.map((row: any) => {
                    return {
                        programGroup: row['Program Group']?.trim() || '',
                        subjectCode: row['Subject Code']?.trim() || '',
                        trainingName: row['Training Name']?.trim() || '',
                        status: row['Status']?.trim() || '',
                        forSection: row['For Section / Whom']?.trim() || '',
                    };
                }).filter(r => r.subjectCode && r.trainingName); // Basic validation

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

        const BATCH_SIZE = 100;
        let processedCount = 0;

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);

            try {
                const result = await processProgramBatch(batch);
                
                if (!result.success) {
                    throw new Error(result.error || 'Unknown error during batch processing');
                }

                processedCount += batch.length;
                setProgress({ current: Math.min(processedCount, records.length), total: records.length });

                // Small delay
                if (processedCount < records.length) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(`Failed at batch ${Math.floor(i/BATCH_SIZE) + 1}: ${err.message}`);
                setIsProcessing(false);
                return;
            }
        }

        setStatus('completed');
        setIsProcessing(false);
    };

    const handleClear = () => {
        if (confirm('Clear all parsed data and start over?')) {
            setRecords([]);
            setProgress({ current: 0, total: 0 });
            setStatus('idle');
            setErrorMessage('');
            
            const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm('CRITICAL WARNING: This will permanently delete ALL Programs from the master catalog. Are you sure you want to start with a clean slate?')) {
            return;
        }

        setIsClearingDb(true);
        try {
            const result = await clearProgramCatalog();
            if (result.success) {
                alert(`Successfully wiped the program catalog! Deleted ${result.count || 0} programs.`);
                setRecords([]);
                setStatus('idle');
            } else {
                alert(`Error clearing programs: ${result.error}`);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsClearingDb(false);
        }
    };

    const downloadSample = () => {
        const csvContent = "data:text/csv;charset=utf-8,Program Group,Subject Code,Training Name,Status,For Section / Whom\nHEMM Programs,ACE01,AC Electrical - Advance (L2),Active,AC Electricals HT/LT\nHEMM Programs,ACE02,AC Electrical - Failure Modes & Analysis (L3),Active,AC Electricals HT/LT";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "program_upload_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="min-h-screen bg-slate-100 py-10 px-4 md:px-8 selection:bg-blue-600 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Administrative Hub</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bulk Upload Programs</h1>
                        <p className="text-slate-500 mt-2 font-medium">Upload a CSV to batch import or update training programs and departments.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClearDatabase}
                            disabled={isClearingDb || isProcessing}
                            className="flex items-center gap-2 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                        >
                            <HiTrash className="w-5 h-5" /> {isClearingDb ? 'Clearing...' : 'Wipe Catalog'}
                        </button>
                        <button
                            onClick={downloadSample}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
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
                        <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                            <HiCloudArrowUp className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            {status === 'parsing' ? 'Parsing CSV...' : 'Drag & Drop CSV Here'}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-6">
                            Must include headers: Program Group, Subject Code, Training Name, Status, For Section / Whom
                        </p>
                        <span className="text-blue-600 font-bold bg-blue-50 px-6 py-2 rounded-xl">Browse Files</span>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="font-black text-slate-900 text-2xl mb-1">
                                        {records.length.toLocaleString()} Programs Ready
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        This will dynamically create any missing departments and map the categories.
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
                                        <span className="text-blue-600">{Math.round((progress.current / progress.total) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 font-medium text-right">
                                        {progress.current.toLocaleString()} / {progress.total.toLocaleString()} programs processed
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider text-[10px] border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Subject Code</th>
                                        <th className="px-6 py-4">Training Name</th>
                                        <th className="px-6 py-4">Program Group (Mapped)</th>
                                        <th className="px-6 py-4">Department</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.slice(0, 100).map((record, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded w-fit">{record.subjectCode}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-900 font-bold">{record.trainingName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600 font-medium">{record.programGroup}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {record.forSection || '-'}
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
