'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { HiCloudArrowUp, HiOutlinePlay, HiCheckCircle, HiExclamationCircle, HiOutlineTrash, HiOutlineTrash as HiTrash } from 'react-icons/hi2';
import { processLegacyTrainingBatch, LegacyRecord, clearTrainingHistory } from '@/app/actions/legacy-upload';

export default function UploadLegacyDataPage() {
    const [records, setRecords] = useState<LegacyRecord[]>([]);
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
                const parsedRecords: LegacyRecord[] = results.data.map((row: any) => {
                    // Extract email and mobile from the combined column if needed,
                    // but the user said they are individually there. We will look for standard column names.
                    const mobileMatch = row['EmpID Name Mobile Mail']?.match(/\b\d{10}\b/);
                    const emailMatch = row['EmpID Name Mobile Mail']?.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);

                    return {
                        empId: row['EmpID']?.trim(),
                        employeeName: row['Name of Employee']?.trim(),
                        employmentStatus: row['Employment Status']?.trim(),
                        programName: row['Program Name']?.trim(),
                        region: row['Region (On Trg Date)']?.trim(),
                        startDate: row['Start Date']?.trim(),
                        endDate: row['End Date']?.trim(),
                        trainingDays: parseInt(row['Trg Days'], 10) || null,
                        progCategory: row['PROG CATEGORY']?.trim(),
                        location: row['Training Location Detailed']?.trim() || row['Trg Loc Trim']?.trim(),
                        // Map mobile and email either from individual columns if they exist, or extracted from combined string
                        mobile: row['Mobile']?.trim() || (mobileMatch ? mobileMatch[0] : null),
                        email: row['Email']?.trim() || row['Mail']?.trim() || (emailMatch ? emailMatch[0] : null),
                        organization: row['ORGANIZATION']?.trim(),
                        onRollContract: row['On-Roll / Contract']?.trim(),
                        department: row['Department']?.trim(),
                        employeeGroup: row['Employee Group']?.trim(),
                        employeeGrouupMNmw: row['Employee Group M/NM/W']?.trim(),
                        aadharNumber: row['Aadhar Number']?.trim(),
                        designation: row['Designation']?.trim(),
                        section: row['Section (On Trg Date)']?.trim(),
                        month: row['MTH']?.trim(),
                        year: row['Year']?.trim() || row['YEAR']?.trim(),
                        gender: row['Gender']?.trim(),
                        attendancePercentage: parseFloat(row['Attd %']) || null,
                        sessionId: row['ProgID']?.trim() || row['sessionId']?.trim() || row['Session ID']?.trim() || row['session_id']?.trim(),
                    };
                }).filter(r => r.empId && r.programName); // Basic validation

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

        const BATCH_SIZE = 200;
        let processedCount = 0;

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);

            try {
                const result = await processLegacyTrainingBatch(batch);
                
                if (!result.success) {
                    throw new Error(result.error || 'Unknown error during batch processing');
                }

                processedCount += batch.length;
                setProgress({ current: Math.min(processedCount, records.length), total: records.length });

                // Small delay to prevent rate limits or UI freezing
                if (processedCount < records.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(`Failed at batch ${i/BATCH_SIZE + 1}: ${err.message}`);
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
            
            // Reset file input
            const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm('CRITICAL WARNING: This will permanently delete ALL stored records in the Training History table. Existing employee profiles will remain intact, but their history ledger will be completely wiped clean.\n\nAre you absolutely sure you want to do this?')) {
            return;
        }

        setIsClearingDb(true);
        try {
            const result = await clearTrainingHistory();
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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Legacy Training Upload</h1>
                    <p className="text-slate-500">Upload CSV to sync historical training records to the master ledger.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleClearDatabase}
                        disabled={isClearingDb || isProcessing}
                        className="flex items-center gap-2 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                        <HiTrash /> {isClearingDb ? 'Clearing DB...' : 'Wipe DB Ledger'}
                    </button>
                    {records.length > 0 && !isProcessing && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                        >
                            <HiOutlineTrash /> Clear CSV Data
                        </button>
                    )}
                </div>
            </div>

            {status === 'error' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-center">
                        <HiExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
                        <h3 className="text-red-800 font-medium">Upload Error</h3>
                    </div>
                    <p className="text-red-700 mt-1 text-sm">{errorMessage}</p>
                </div>
            )}

            {records.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                    <HiCloudArrowUp className="w-12 h-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                        {status === 'parsing' ? 'Parsing CSV...' : 'Upload CSV File'}
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-md">
                        Requires headers matching your legacy export (EmpID, Name of Employee, Program Name, Start Date, End Date, etc.)
                    </p>
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        disabled={status === 'parsing'}
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          cursor-pointer max-w-xs mx-auto
                          disabled:opacity-50"
                    />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="font-semibold text-slate-800 text-lg">
                                    {records.length.toLocaleString()} Records Ready
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    This will create/update employees and sync training history.
                                </p>
                            </div>
                            
                            {status === 'completed' ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-6 py-3 rounded-lg font-bold border border-green-200">
                                    <HiCheckCircle className="w-6 h-6" />
                                    Upload Complete!
                                </div>
                            ) : (
                                <button
                                    onClick={handleStartUpload}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isProcessing ? (
                                        <>Processing...</>
                                    ) : (
                                        <><HiOutlinePlay /> Start Batch Upload</>
                                    )}
                                </button>
                            )}
                        </div>

                        {(isProcessing || status === 'completed') && (
                            <div className="mt-6">
                                <div className="flex justify-between text-sm font-medium mb-2">
                                    <span className="text-slate-600">Upload Progress</span>
                                    <span className="text-blue-600">{Math.round((progress.current / progress.total) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-right">
                                    {progress.current.toLocaleString()} / {progress.total.toLocaleString()} records processed
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Program</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Only show first 100 to avoid locking browser rendering */}
                                {records.slice(0, 100).map((record, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-slate-900">{record.employeeName}</div>
                                            <div className="text-slate-500 text-xs font-mono">{record.empId}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="text-slate-800 font-medium">{record.programName}</div>
                                            <div className="text-slate-400 text-xs">{record.progCategory}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="text-slate-600">{record.startDate}</div>
                                            <div className="text-slate-400 text-xs">to {record.endDate} ({record.trainingDays} days)</div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-600">
                                            {record.location || record.region}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {records.length > 100 && (
                            <div className="p-4 text-center text-slate-500 text-sm bg-slate-50 border-t border-slate-100">
                                Showing 100 of {records.length.toLocaleString()} records...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
