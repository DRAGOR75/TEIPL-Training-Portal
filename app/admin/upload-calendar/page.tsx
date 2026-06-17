'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiOutlinePlay, HiCheckCircle, HiExclamationCircle, HiOutlineTrash, HiOutlineDocumentArrowDown } from 'react-icons/hi2';
import { processCalendarBatch, CalendarUploadRecord } from '@/app/actions/upload-calendar';

export default function UploadCalendarPage() {
    const [records, setRecords] = useState<CalendarUploadRecord[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'completed' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadErrors, setUploadErrors] = useState<string[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('parsing');
        setErrorMessage('');
        setUploadErrors([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                const parsedRecords: CalendarUploadRecord[] = results.data.map((row: any) => {
                    return {
                        slNo: row['Sl. No.']?.trim() || row['Sl No']?.trim() || '',
                        month: row['Month']?.trim() || '',
                        programName: row['Program name']?.trim() || row['Program Name']?.trim() || '',
                        programId: row['Program id']?.trim() || row['Program ID']?.trim() || '',
                        startDate: row['Start Date']?.trim() || '',
                        endDate: row['End Date']?.trim() || '',
                        days: row['Days']?.trim() || '',
                        targetedGrade: row['Targeted Grade']?.trim() || '',
                        section: row['Section']?.trim() || '',
                        location: row['Location']?.trim() || '',
                        trainerName: row['Trainer Name']?.trim() || '',
                    };
                }).filter(r => r.programName && r.startDate && r.endDate); // Basic validation

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
        setUploadErrors([]);

        const BATCH_SIZE = 50;
        let processedCount = 0;
        let accumulatedErrors: string[] = [];

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);

            try {
                const result = await processCalendarBatch(batch);
                
                if (!result.success) {
                    throw new Error(result.error || 'Unknown error during batch processing');
                }

                if (result.errors && result.errors.length > 0) {
                    accumulatedErrors = [...accumulatedErrors, ...result.errors];
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

        setUploadErrors(accumulatedErrors);
        setStatus('completed');
        setIsProcessing(false);
    };

    const handleClear = () => {
        if (confirm('Clear all parsed data and start over?')) {
            setRecords([]);
            setProgress({ current: 0, total: 0 });
            setStatus('idle');
            setErrorMessage('');
            setUploadErrors([]);
            
            const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const downloadSample = () => {
        const csvContent = "data:text/csv;charset=utf-8,Sl. No.,Month,Program name,Program id,Start Date,End Date,Days,Targeted Grade,Section,Trainer Name,Location\n1,Jun 2026,HEMM Maintenance,HEM08,18 Jun 2026 Thu,20 Jun 2026 Sat,3,Workman,HEMM Common,Mr. Mrinal,PB\n2,Jun 2026,Safety Compliance,SAF01,23 Jun 2026 Tue,25 Jun 2026 Thu,3,Executive,Safety Dept,John Doe,PB";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "training_calendar_sample.csv");
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Training Calendar Upload</h1>
                        <p className="text-slate-500 mt-2 font-medium">Upload a CSV to batch schedule training sessions into the calendar.</p>
                    </div>
                    <div className="flex gap-3">
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

                {uploadErrors.length > 0 && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm mt-4">
                        <div className="flex items-center mb-2">
                            <HiExclamationCircle className="h-6 w-6 text-amber-500 mr-2" />
                            <h3 className="text-amber-800 font-bold">Import Warnings ({uploadErrors.length})</h3>
                        </div>
                        <ul className="list-disc pl-8 text-amber-700 text-sm font-medium space-y-1 max-h-40 overflow-y-auto">
                            {uploadErrors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
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
                            Required headers: Program name, Start Date, End Date
                        </p>
                        <span className="text-blue-600 font-bold bg-blue-50 px-6 py-2 rounded-xl">Browse Files</span>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="font-black text-slate-900 text-2xl mb-1">
                                        {records.length.toLocaleString()} Sessions Ready
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        This will dynamically create new pre-scheduled sessions on the calendar.
                                    </p>
                                </div>
                                
                                {status === 'completed' ? (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-xl font-bold border border-emerald-200 shadow-sm">
                                        <HiCheckCircle className="w-6 h-6" />
                                        Scheduling Complete!
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStartUpload}
                                        disabled={isProcessing}
                                        className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-lg"
                                    >
                                        {isProcessing ? (
                                            <>Processing...</>
                                        ) : (
                                            <><HiOutlinePlay className="w-6 h-6" /> Start Bulk Scheduling</>
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
                                        {progress.current.toLocaleString()} / {progress.total.toLocaleString()} sessions processed
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-wider text-[10px] border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Program Name</th>
                                        <th className="px-6 py-4">Start Date</th>
                                        <th className="px-6 py-4">End Date</th>
                                        <th className="px-6 py-4">Trainer</th>
                                        <th className="px-6 py-4">Section</th>
                                        <th className="px-6 py-4">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.slice(0, 100).map((record, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-slate-900 font-bold">{record.programName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600 font-medium font-mono">{record.startDate}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600 font-medium font-mono">{record.endDate}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {record.trainerName || 'TBD'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {record.section || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {record.location || 'TBD'}
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
