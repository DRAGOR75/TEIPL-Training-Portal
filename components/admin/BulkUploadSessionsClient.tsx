'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { bulkUploadSessions, BulkSessionRow } from '@/app/actions/upload-sessions';
import {
    HiOutlineCloudArrowUp,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineArrowPath,
    HiOutlineTableCells,
    HiOutlineArrowDownTray
} from 'react-icons/hi2';

export default function BulkUploadSessionsClient() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<{ count?: number; error?: string } | null>(null);
    const [parsedData, setParsedData] = useState<any[] | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStats(null);
        setParsedData(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            worker: false,
            transformHeader: (h) => h.trim().replace(/^"|"$/g, ''),
            complete: async (results) => {
                try {
                    const headers = results.meta.fields || [];

                    const findHeader = (aliases: string[]) => headers.find(h => aliases.some(alias => h.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, '')));

                    const mapHeader = {
                        programId: findHeader(['Program ID', 'ProgramID', 'ID']),
                        startDate: findHeader(['Start Date', 'StartDate', 'Start']),
                        endDate: findHeader(['End Date', 'EndDate', 'End']),
                        startTime: findHeader(['Start Time', 'StartTime']),
                        endTime: findHeader(['End Time', 'EndTime']),
                        trainerName: findHeader(['Trainer Name', 'TrainerName', 'Trainer']),
                        location: findHeader(['Location', 'Room', 'Place']),
                        topics: findHeader(['Topics', 'Agenda', 'Description'])
                    };

                    const rows = results.data.map((row: any) => {
                        return {
                            programId: mapHeader.programId ? row[mapHeader.programId]?.trim() : undefined,
                            startDate: mapHeader.startDate ? row[mapHeader.startDate]?.trim() : undefined,
                            endDate: mapHeader.endDate ? row[mapHeader.endDate]?.trim() : undefined,
                            startTime: mapHeader.startTime ? row[mapHeader.startTime]?.trim() : undefined,
                            endTime: mapHeader.endTime ? row[mapHeader.endTime]?.trim() : undefined,
                            trainerName: mapHeader.trainerName ? row[mapHeader.trainerName]?.trim() : undefined,
                            location: mapHeader.location ? row[mapHeader.location]?.trim() : undefined,
                            topics: mapHeader.topics ? row[mapHeader.topics]?.trim() : undefined,
                        };
                    }).filter((r: any) => r.programId && r.startDate && r.endDate);

                    if (rows.length === 0) {
                        const detectedHeaders = headers.join(', ');
                        setStats({ error: `No valid rows with data found. Detected headers: [${detectedHeaders}]. Are the rows empty or missing required Program ID, Start Date, and End Date columns?` });
                        return;
                    }

                    // Show preview instead of uploading right away
                    setParsedData(rows);

                } catch (error: any) {
                    setStats({ error: "Client processing error: " + error.message });
                } finally {
                    // Reset input
                    if (e.target) e.target.value = '';
                }
            },
            error: (error) => {
                setStats({ error: "CSV Parsing Error: " + error.message });
            }
        });
    };

    const confirmUpload = async () => {
        if (!parsedData) return;
        
        setIsUploading(true);
        setStats(null);
        
        const TOTAL_ROWS = parsedData.length;
        const CHUNK_SIZE = 10;
        let processedCount = 0;
        let totalSuccess = 0;
        let firstError = '';

        for (let i = 0; i < TOTAL_ROWS; i += CHUNK_SIZE) {
            const chunk = parsedData.slice(i, i + CHUNK_SIZE);

            try {
                const res = await bulkUploadSessions(chunk as BulkSessionRow[]);

                if (res.success) {
                    totalSuccess += res.count || 0;
                }
                if (res.error) {
                    if (!firstError) firstError = res.error;
                }
            } catch (err: any) {
                if (!firstError) firstError = err.message || 'Network error';
            }

            processedCount += chunk.length;
            setProgress(Math.round((processedCount / TOTAL_ROWS) * 100));
        }

        setStats({
            count: totalSuccess,
            error: firstError || (totalSuccess === 0 ? "No records were imported." : undefined)
        });

        setIsUploading(false);
        setProgress(0);
        setParsedData(null); // Clear preview after upload
    };

    const cancelPreview = () => {
        setParsedData(null);
        setStats(null);
    };

    const csvTemplate = `Program ID,Start Date,End Date,Start Time,End Time,Trainer Name,Location\ncl2b32...,2026-06-20,2026-06-22,09:00 AM,05:00 PM,John Doe,Room 101`;
    const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`;

    return (
        <div className="bg-white p-8 rounded-3xl shadow-air border border-slate-100 mb-8 max-w-5xl mx-auto text-center">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <HiOutlineCloudArrowUp size={32} />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">Upload Sessions CSV</h2>
            <p className="text-slate-500 mb-6 max-w-lg mx-auto leading-relaxed">
                Upload a CSV file to bulk-schedule training sessions. Required columns: <span className="font-bold text-slate-700">Program ID, Start Date, End Date</span>.
            </p>

            <div className="flex justify-center mb-8">
                <a 
                    href={csvDataUri} 
                    download="sessions_template.csv"
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
                >
                    <HiOutlineArrowDownTray className="w-4 h-4" />
                    Download CSV Template
                </a>
            </div>

            {/* PREVIEW MODE */}
            {parsedData && !isUploading && (
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2 text-slate-800 font-bold">
                            <HiOutlineTableCells className="text-blue-600 w-5 h-5" />
                            Previewing {parsedData.length} records
                        </div>
                        <div className="flex gap-3">
                            <button onClick={cancelPreview} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button onClick={confirmUpload} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors active:scale-95">
                                Confirm & Upload
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-96">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600">Program ID</th>
                                    <th className="px-4 py-3 font-bold text-slate-600">Dates</th>
                                    <th className="px-4 py-3 font-bold text-slate-600">Times</th>
                                    <th className="px-4 py-3 font-bold text-slate-600">Trainer</th>
                                    <th className="px-4 py-3 font-bold text-slate-600">Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {parsedData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{row.programId}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.startDate} to {row.endDate}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.startTime || '-'} to {row.endTime || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.trainerName || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.location || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Upload Area (Hidden during preview) */}
            {!parsedData && (
                <div className="relative group">
                    <div className={`border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ${isUploading ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-4">
                                <HiOutlineArrowPath className="w-10 h-10 text-blue-500 animate-spin" />
                                <div className="text-blue-900 font-bold">Uploading... {progress}%</div>
                                <div className="w-64 h-2 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-xs text-blue-600/70">Please don't close this window.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <button className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                                    Select CSV File
                                </button>
                                <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Or drag and drop here</p>
                            </div>
                        )}
                    </div>

                    {!isUploading && (
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                    )}
                </div>
            )}

            {/* Status / Results */}
            {stats && (
                <div className={`mt-6 p-4 rounded-xl text-left flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${stats.error ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <div className="shrink-0 mt-0.5">
                        {stats.error ? (
                            <HiOutlineExclamationCircle className="w-6 h-6 text-rose-500" />
                        ) : (
                            <HiOutlineCheckCircle className="w-6 h-6 text-emerald-500" />
                        )}
                    </div>
                    <div>
                        <h4 className={`font-bold ${stats.error ? 'text-rose-900' : 'text-emerald-900'}`}>
                            {stats.error ? 'Upload Completed with Errors' : 'Upload Successful'}
                        </h4>
                        {stats.count !== undefined && (
                            <p className={`text-sm mt-1 ${stats.error ? 'text-rose-700' : 'text-emerald-700'}`}>
                                Successfully imported <strong>{stats.count}</strong> sessions.
                            </p>
                        )}
                        {stats.error && (
                            <div className="mt-2 text-xs text-rose-600 bg-white/50 p-3 rounded-lg font-mono leading-relaxed border border-rose-200/50 break-words max-h-40 overflow-y-auto">
                                {stats.error}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
