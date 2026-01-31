'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { bulkUploadTroubleshooting, BulkUploadRow } from '@/app/actions/admin-troubleshooting';
import {
    HiOutlineCloudArrowUp,
    HiOutlineTableCells,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineArrowPath
} from 'react-icons/hi2';

export default function BulkUploader() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<{ count?: number; error?: string } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setStats(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            worker: false, // Worker cannot handle functions like transformHeader
            transformHeader: (h) => h.trim().replace(/^"|"$/g, ''), // Trim and remove surrounding quotes from headers
            complete: async (results) => {
                try {
                    const headers = results.meta.fields || [];

                    // Helper to find the first matching header from a list of aliases
                    const findHeader = (aliases: string[]) => headers.find(h => aliases.some(alias => h.toLowerCase() === alias.toLowerCase()));

                    const mapHeader = {
                        machineName: findHeader(['Machine Model', 'ProductName', 'Machine']),
                        productSeq: findHeader(['ProdViewSeq']),
                        keywords: findHeader(['Key Words to filter']),
                        productId: findHeader(['ProdID']),

                        faultName: findHeader(['Fault Name', 'Fault/Complaint /Failure/ Fault Code', 'FaultName']),
                        faultId: findHeader(['FaultID']),
                        faultCode: findHeader(['Fault Code']),
                        faultViewSeq: findHeader(['FaultViewSeq']),

                        causeName: findHeader(['Cause', '"Cause"', 'Check Description', 'Possible Causes', 'Check']),
                        action: findHeader(['Action', 'Remedy Action', 'Action/Remedy', 'Remedy']),
                        justification: findHeader(['Justification', 'Why', 'Reason', 'Explanation']),

                        symptoms: findHeader(['Symptoms']),
                        manualRef: findHeader(['Reference', 'Procedures/References']),
                        seq: findHeader(['Sequence', 'CauseViewSeq', 'CauseSeq'])
                    };

                    const rows = results.data.map((row: any) => ({
                        machineName: mapHeader.machineName ? row[mapHeader.machineName]?.trim() : undefined,
                        productSeq: mapHeader.productSeq ? parseInt(row[mapHeader.productSeq]) || undefined : undefined,
                        keywords: mapHeader.keywords ? row[mapHeader.keywords]?.trim() : undefined,
                        productId: mapHeader.productId ? row[mapHeader.productId] : undefined,

                        faultName: mapHeader.faultName ? row[mapHeader.faultName]?.trim() : undefined,
                        faultId: mapHeader.faultId ? row[mapHeader.faultId] : undefined,
                        faultCode: mapHeader.faultCode ? row[mapHeader.faultCode]?.trim() : undefined,
                        faultViewSeq: mapHeader.faultViewSeq ? parseInt(row[mapHeader.faultViewSeq]) || undefined : undefined,

                        // Cause & Action
                        causeName: mapHeader.causeName ? row[mapHeader.causeName]?.trim() : undefined,
                        action: mapHeader.action ? row[mapHeader.action]?.trim() : undefined,
                        justification: mapHeader.justification ? row[mapHeader.justification]?.trim() : undefined,

                        symptoms: mapHeader.symptoms ? row[mapHeader.symptoms]?.trim() : undefined,
                        manualRef: mapHeader.manualRef ? row[mapHeader.manualRef]?.trim() : undefined,
                        seq: mapHeader.seq ? (parseInt(row[mapHeader.seq]) || undefined) : undefined
                    })).filter((r: any) => r.machineName || r.faultId || r.productId);

                    if (rows.length === 0) {
                        setStats({ error: 'No valid rows found. Check column headers.' });
                        return;
                    }

                    const TOTAL_ROWS = rows.length;
                    const CHUNK_SIZE = 10; // Drastically reduced to 10 to avoid Vercel 10s timeout
                    let processedCount = 0;
                    let totalSuccess = 0;
                    let firstError = '';

                    console.log(`Starting upload: ${TOTAL_ROWS} rows`);

                    // Chunking Loop
                    for (let i = 0; i < TOTAL_ROWS; i += CHUNK_SIZE) {
                        const chunk = rows.slice(i, i + CHUNK_SIZE);

                        console.log(`Processing chunk ${i / CHUNK_SIZE + 1}...`);

                        try {
                            // Send Chunk to Server
                            const res = await bulkUploadTroubleshooting(chunk as BulkUploadRow[]);

                            if (res.success) {
                                totalSuccess += res.count || 0;
                            } else {
                                console.error('Chunk error:', res.error);
                                if (!firstError) firstError = res.error || 'Unknown error in batch';
                            }
                        } catch (err: any) {
                            console.error('Network/Server error:', err);
                            if (!firstError) firstError = err.message || 'Network error';
                        }

                        processedCount += chunk.length;
                        const pct = Math.round((processedCount / TOTAL_ROWS) * 100);
                        setProgress(pct);
                    }

                    if (totalSuccess > 0) {
                        setStats({ count: totalSuccess, error: firstError ? `Partial success. Error: ${firstError}` : undefined });
                    } else {
                        setStats({ error: firstError || 'Upload failed' });
                    }

                } catch (e: any) {
                    console.error('Critical upload flow error:', e);
                    setStats({ error: 'Critical error: ' + e.message });
                } finally {
                    setIsUploading(false);
                    setProgress(0);
                }
            },
            error: (err) => {
                setStats({ error: 'CSV Parsing Error: ' + err.message });
                setIsUploading(false);
            }
        });
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
            <div className="text-center space-y-4">
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <HiOutlineCloudArrowUp size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Import Troubleshooting Data</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Upload a CSV file to automatically create machines, faults, and diagnostic sequences.
                    Existing items will be updated.
                </p>

                {/* Template Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left text-xs font-mono text-slate-600 overflow-x-auto">
                    <p className="font-bold mb-2 text-slate-500 uppercase">Supported Formats:</p>
                    <div className="mb-2">
                        <span className="font-bold text-slate-800">1. Full Diagnostic Data:</span><br />
                        Machine Model, FaultID, Fault Name, CauseSeq, Cause, Justification, Action
                    </div>

                </div>

                <div className="pt-4">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200">
                        {isUploading ? <HiOutlineArrowPath className="animate-spin" size={20} /> : <HiOutlineTableCells size={20} />}
                        {isUploading ? 'Uploading...' : 'Select CSV File'}
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>

                    {isUploading && (
                        <div className="mt-4 max-w-sm mx-auto">
                            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {stats?.count !== undefined && (
                    <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 border border-green-100">
                        <HiOutlineCheckCircle size={20} />
                        <span className="font-bold">Successfully processed {stats.count} rows!</span>
                    </div>
                )}

                {stats?.error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 border border-red-100">
                        <HiOutlineExclamationCircle size={20} />
                        <span className="font-bold">{stats.error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
