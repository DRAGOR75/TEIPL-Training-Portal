'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { bulkUploadTroubleshooting, BulkUploadRow } from '@/app/actions/admin-troubleshooting';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
            worker: true, // Use web worker to avoid freezing UI
            complete: async (results) => {
                const rows = results.data.map((row: any) => ({
                    // Smart Mapping for various CSV styles
                    machineName: (row['Machine Model'] || row['ProductName'])?.trim(),
                    productSeq: parseInt(row['ProdViewSeq']) || undefined,
                    keywords: row['Key Words to filter']?.trim(),
                    productId: row['ProdID'], // Map ProdID for legacy lookup

                    faultName: (row['Fault Name'] || row['Fault/Complaint /Failure/ Fault Code'])?.trim(),
                    faultId: row['FaultID'], // Ensure this is passed
                    faultCode: row['Fault Code']?.trim(),
                    faultViewSeq: parseInt(row['FaultViewSeq']) || undefined,

                    causeName: (row['Check Description'] || row['Possible Causes'])?.trim(),
                    action: (row['Remedy Action'] || row['Action/Remedy'])?.trim(),
                    symptoms: row['Symptoms']?.trim(),
                    manualRef: (row['Reference'] || row['Procedures/References'])?.trim(),
                    seq: parseInt(row['Sequence']) || parseInt(row['CauseViewSeq']) || undefined
                })).filter((r: any) => r.machineName || r.faultId || r.productId); // Allow rows with ID context

                if (rows.length === 0) {
                    setStats({ error: 'No valid rows found. Check column headers.' });
                    setIsUploading(false);
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

                    // Send Chunk to Server
                    const res = await bulkUploadTroubleshooting(chunk as BulkUploadRow[]);

                    if (res.success) {
                        totalSuccess += res.count || 0;
                    } else {
                        console.error('Chunk error:', res.error);
                        if (!firstError) firstError = res.error || 'Unknown error in batch';
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

                setIsUploading(false);
                setProgress(0);
            },
            error: (err) => {
                setStats({ error: 'CSV Parsing Error: ' + err.message });
                setIsUploading(false);
            }
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl mx-auto">
            <div className="text-center space-y-4">
                <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Import Troubleshooting Data</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Upload a CSV file to automatically create machines, faults, and diagnostic sequences.
                    Existing items will be updated.
                </p>

                {/* Template Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-xs font-mono text-slate-600 overflow-x-auto">
                    <p className="font-bold mb-2 text-slate-500 uppercase">Supported Formats:</p>
                    <div className="mb-2">
                        <span className="font-bold text-slate-800">1. Full Diagnostic Data:</span><br />
                        Machine Model, Fault Name, Check Description, Remedy Action, Sequence
                    </div>

                </div>

                <div className="pt-4">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold transition-all active:scale-95">
                        {isUploading ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                        {isUploading ? 'Uploading...' : 'Select CSV File'}
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>

                    {isUploading && (
                        <div className="mt-4 max-w-sm mx-auto">
                            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {stats?.count !== undefined && (
                    <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
                        <CheckCircle size={20} />
                        <span className="font-bold">Successfully processed {stats.count} rows!</span>
                    </div>
                )}

                {stats?.error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
                        <AlertCircle size={20} />
                        <span className="font-bold">{stats.error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
