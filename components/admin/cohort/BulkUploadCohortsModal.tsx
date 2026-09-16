'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { bulkUploadCohorts, BulkCohortRow } from '@/app/actions/cohorts';
import { getFinancialYear, parseFlexibleDate } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';
import {
    HiOutlineXMark,
    HiOutlineArrowUpTray,
    HiOutlineArrowDownTray,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineArrowPath,
    HiOutlineLink,
    HiOutlineTableCells,
} from 'react-icons/hi2';

interface BulkUploadCohortsModalProps {
    onClose: () => void;
}

export default function BulkUploadCohortsModal({ onClose }: BulkUploadCohortsModalProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [parsedRows, setParsedRows] = useState<BulkCohortRow[] | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [uploadStats, setUploadStats] = useState<{
        createdCount?: number;
        updatedCount?: number;
        programsCount?: number;
        linkedSessionsCount?: number;
        errors?: string[];
    } | null>(null);

    // Download sample template
    const downloadTemplate = (format: 'xlsx' | 'csv') => {
        const sampleData = [
            {
                'Cohort ID': 'CH-2026-001',
                'Cohort Name': 'Inplant Engineering Batch 2026',
                'Cohort Group': 'GETs',
                'Start Date': '2026-09-01',
                'End Date': '2026-11-30',
                'Location': 'TRC Jamshedpur',
                'Total Participants': 35,
                'Duration (Days)': 90,
                'Description': 'Comprehensive graduate engineer training journey',
                'Program Name': 'Hydraulics Level 1',
                'Session ID': '',
                'Sequence': 1
            },
            {
                'Cohort ID': 'CH-2026-001',
                'Cohort Name': 'Inplant Engineering Batch 2026',
                'Cohort Group': 'GETs',
                'Start Date': '2026-09-01',
                'End Date': '2026-11-30',
                'Location': 'TRC Jamshedpur',
                'Total Participants': 35,
                'Duration (Days)': 90,
                'Description': 'Comprehensive graduate engineer training journey',
                'Program Name': 'Electrical Systems & Drives',
                'Session ID': 'PASTE_SESSION_ID_HERE',
                'Sequence': 2
            },
            {
                'Cohort ID': 'CH-2026-002',
                'Cohort Name': 'Technician Apprentice Batch 1',
                'Cohort Group': 'Technicians',
                'Start Date': '2026-10-15',
                'End Date': '2026-12-15',
                'Location': 'Regional Hub',
                'Total Participants': 20,
                'Duration (Days)': 60,
                'Description': 'Workshop safety and technical onboarding',
                'Program Name': 'Safety Induction & PPE',
                'Session ID': '',
                'Sequence': 1
            }
        ];

        if (format === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(sampleData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Cohorts_Template");
            XLSX.writeFile(workbook, "Cohorts_Bulk_Upload_Template.xlsx");
        } else {
            const csv = Papa.unparse(sampleData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'Cohorts_Bulk_Upload_Template.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const processRawObjects = (rawObjects: any[]) => {
        if (!rawObjects || rawObjects.length === 0) {
            setError('The file contains no data rows.');
            return;
        }

        const headers = Object.keys(rawObjects[0] || {});
        const findField = (aliases: string[]) =>
            headers.find(h =>
                aliases.some(alias =>
                    h.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, '')
                )
            );

        const mapHeader = {
            cohortId: findField(['LT Batch ID', 'LTBatchID', 'Batch ID', 'BatchID', 'Cohort ID', 'CohortId', 'Cohort_Id', 'Cohort Code', 'ID']),
            status: findField(['Status', 'Cohort Status', 'Batch Status']),
            cohortName: findField(['Batch Name', 'BatchName', 'Batch', 'LT Batch Name', 'Cohort Name', 'CohortName', 'Cohort', 'Name', 'Training Batch']),
            cohortGroup: findField(['longterm Group', 'Long Term Group', 'LongTermGroup', 'LT Group', 'Cohort Group', 'CohortGroup', 'Group']),
            description: findField(['Description', 'Desc']),
            startDate: findField(['Start Date', 'StartDate', 'Start', 'Trg Start Date', 'Training Start Date']),
            endDate: findField(['End Date', 'EndDate', 'End', 'Trg End Date', 'Training End Date']),
            cohortYear: findField(['YEAR', 'Financial Year', 'Cohort Year', 'CohortYear', 'FY', 'Year']),
            location: findField(['Location', 'Region', 'Place', 'Training Location']),
            totalParticipants: findField(['Number of Participants', 'No of Participants', 'No. of Participants', 'Num Participants', 'Total Participants', 'Participants', 'Total No of Participants', 'Batch Size']),
            duration: findField(['Trg Days', 'Training Days', 'TrgDays', 'No of Days', 'Number of Days', 'Duration', 'Duration Days', 'Duration (Days)', 'Days']),
            programName: findField(['Program Name', 'ProgramName', 'Program', 'Subject']),
            programId: findField(['Program ID', 'ProgramId']),
            sessionId: findField(['Session ID', 'SessionId', 'Linked Session ID', 'Session']),
            seq: findField(['Sequence', 'Seq', 'Order']),
        };

        if (!mapHeader.cohortName && !mapHeader.cohortId) {
            setError(`Could not find a "Cohort Name" / "Batch Name" or "Cohort ID" / "Batch ID" column. Detected columns: [${headers.join(', ')}].`);
            return;
        }

        const rows: BulkCohortRow[] = [];

        for (const raw of rawObjects) {
            const cohortId = mapHeader.cohortId && raw[mapHeader.cohortId] !== undefined && raw[mapHeader.cohortId] !== null ? raw[mapHeader.cohortId].toString().trim() : undefined;
            const cohortName = mapHeader.cohortName && raw[mapHeader.cohortName] ? raw[mapHeader.cohortName].toString().trim() : (cohortId || '');
            if (!cohortName && !cohortId) continue;

            const status = mapHeader.status && raw[mapHeader.status] ? raw[mapHeader.status].toString().trim() : undefined;
            const startDate = mapHeader.startDate && raw[mapHeader.startDate] ? parseFlexibleDate(raw[mapHeader.startDate]) : undefined;
            const endDate = mapHeader.endDate && raw[mapHeader.endDate] ? parseFlexibleDate(raw[mapHeader.endDate]) : undefined;
            const cohortGroup = mapHeader.cohortGroup && raw[mapHeader.cohortGroup] ? raw[mapHeader.cohortGroup].toString().trim() : undefined;
            const description = mapHeader.description && raw[mapHeader.description] ? raw[mapHeader.description].toString().trim() : undefined;
            const location = mapHeader.location && raw[mapHeader.location] ? raw[mapHeader.location].toString().trim() : undefined;
            const programName = mapHeader.programName && raw[mapHeader.programName] ? raw[mapHeader.programName].toString().trim() : undefined;
            const programId = mapHeader.programId && raw[mapHeader.programId] ? raw[mapHeader.programId].toString().trim() : undefined;
            const sessionId = mapHeader.sessionId && raw[mapHeader.sessionId] ? raw[mapHeader.sessionId].toString().trim() : undefined;

            let cohortYear = mapHeader.cohortYear && raw[mapHeader.cohortYear] ? raw[mapHeader.cohortYear].toString().trim() : undefined;
            if (!cohortYear && startDate) {
                cohortYear = getFinancialYear(startDate);
            }

            const totalParticipants = mapHeader.totalParticipants && raw[mapHeader.totalParticipants] ? parseInt(raw[mapHeader.totalParticipants].toString(), 10) : undefined;
            const duration = mapHeader.duration && raw[mapHeader.duration] ? parseInt(raw[mapHeader.duration].toString(), 10) : undefined;
            const seq = mapHeader.seq && raw[mapHeader.seq] ? parseInt(raw[mapHeader.seq].toString(), 10) : undefined;

            rows.push({
                cohortId,
                status,
                cohortName: cohortName || cohortId!,
                cohortGroup,
                description,
                startDate,
                endDate,
                cohortYear,
                location,
                totalParticipants: isNaN(totalParticipants as number) ? undefined : totalParticipants,
                duration: isNaN(duration as number) ? undefined : duration,
                programName,
                programId,
                sessionId: sessionId || undefined,
                seq: isNaN(seq as number) ? undefined : seq,
            });
        }

        if (rows.length === 0) {
            setError('No valid cohort rows found with a Cohort Name.');
            return;
        }

        setError('');
        setParsedRows(rows);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError('');
        setUploadStats(null);
        setParsedRows(null);

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        if (isExcel) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsName = wb.SheetNames[0];
                    const ws = wb.Sheets[wsName];
                    const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
                    processRawObjects(data);
                } catch (err: any) {
                    setError('Error reading Excel file: ' + err.message);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (h) => h.trim().replace(/^"|"$/g, ''),
                complete: (results) => {
                    processRawObjects(results.data);
                },
                error: (err) => {
                    setError('CSV parse error: ' + err.message);
                }
            });
        }

        e.target.value = '';
    };

    const handleConfirmUpload = async () => {
        if (!parsedRows || parsedRows.length === 0) return;

        setIsUploading(true);
        setError('');
        setUploadStats(null);

        const res = await bulkUploadCohorts(parsedRows);

        setIsUploading(false);

        if (res.success) {
            setUploadStats({
                createdCount: res.createdCount,
                updatedCount: res.updatedCount,
                programsCount: res.programsCount,
                linkedSessionsCount: res.linkedSessionsCount,
                errors: res.errors,
            });
            router.refresh();
        } else {
            setError(res.error || 'Failed to upload cohorts.');
        }
    };

    // Summary counts for preview
    const uniqueCohortsCount = parsedRows ? new Set(parsedRows.map(r => r.cohortName.toLowerCase())).size : 0;
    const sessionLinksCount = parsedRows ? parsedRows.filter(r => r.sessionId).length : 0;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <HiOutlineArrowUpTray className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Bulk Upload Cohorts</h2>
                            <p className="text-xs text-slate-500">Import learning cohorts and link existing sessions via Excel or CSV</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <HiOutlineXMark className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Template Download Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Need a template with Session ID linking?</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Download our pre-formatted spreadsheet. Multiple rows with the same Cohort Name will be grouped together into one learning journey.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => downloadTemplate('xlsx')}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                            >
                                <HiOutlineArrowDownTray className="w-4 h-4" />
                                Excel (.xlsx)
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadTemplate('csv')}
                                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                            >
                                <HiOutlineArrowDownTray className="w-4 h-4" />
                                CSV
                            </button>
                        </div>
                    </div>

                    {/* Error Box */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2.5">
                            <HiOutlineExclamationCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                            <div className="flex-1">{error}</div>
                        </div>
                    )}

                    {/* Upload Success Report */}
                    {uploadStats && (
                        <div className="p-5 bg-green-50 border border-green-200 rounded-2xl space-y-3 animate-in fade-in">
                            <div className="flex items-center gap-2.5 text-green-800 font-bold text-base">
                                <HiOutlineCheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                                <span>Bulk Upload Completed Successfully!</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="bg-white/80 p-3 rounded-xl border border-green-100">
                                    <span className="text-slate-500 block">Cohorts Created</span>
                                    <span className="text-lg font-black text-slate-900">{uploadStats.createdCount || 0}</span>
                                </div>
                                <div className="bg-white/80 p-3 rounded-xl border border-green-100">
                                    <span className="text-slate-500 block">Cohorts Updated</span>
                                    <span className="text-lg font-black text-slate-900">{uploadStats.updatedCount || 0}</span>
                                </div>
                                <div className="bg-white/80 p-3 rounded-xl border border-green-100">
                                    <span className="text-slate-500 block">Programs Added</span>
                                    <span className="text-lg font-black text-slate-900">{uploadStats.programsCount || 0}</span>
                                </div>
                                <div className="bg-white/80 p-3 rounded-xl border border-green-100">
                                    <span className="text-slate-500 block">Sessions Linked</span>
                                    <span className="text-lg font-black text-blue-600">{uploadStats.linkedSessionsCount || 0}</span>
                                </div>
                            </div>

                            {uploadStats.errors && uploadStats.errors.length > 0 && (
                                <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 space-y-1">
                                    <span className="font-bold block">Warnings ({uploadStats.errors.length}):</span>
                                    <ul className="list-disc list-inside space-y-0.5 text-amber-700 max-h-32 overflow-y-auto font-mono text-[11px]">
                                        {uploadStats.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload Box (When not previewing) */}
                    {!parsedRows && !uploadStats && (
                        <div className="relative group">
                            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 rounded-3xl p-12 text-center transition-all flex flex-col items-center justify-center gap-3">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                    <HiOutlineArrowUpTray className="w-7 h-7" />
                                </div>
                                <h4 className="text-base font-bold text-slate-800">Select an Excel or CSV file to import</h4>
                                <p className="text-xs text-slate-400 max-w-sm">
                                    Drag & drop or click to browse files (.xlsx, .xls, .csv). You will preview the data before it is saved.
                                </p>
                                <span className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all">
                                    Browse Files
                                </span>
                            </div>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedRows && !uploadStats && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-700 uppercase">
                                        Data Preview ({parsedRows.length} rows)
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                        {uniqueCohortsCount} unique cohort{uniqueCohortsCount !== 1 ? 's' : ''}
                                    </span>
                                    {sessionLinksCount > 0 && (
                                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <HiOutlineLink className="w-3.5 h-3.5" />
                                            {sessionLinksCount} session link{sessionLinksCount !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setParsedRows(null); setFileName(''); }}
                                    className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors"
                                >
                                    Choose different file
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600 uppercase font-bold">
                                        <tr>
                                            <th className="p-3">#</th>
                                            <th className="p-3">Cohort ID</th>
                                            <th className="p-3">Cohort Name</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Group</th>
                                            <th className="p-3">Dates & FY</th>
                                            <th className="p-3">Participants</th>
                                            <th className="p-3">Days</th>
                                            <th className="p-3">Program / Session</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {parsedRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                                                <td className="p-3">
                                                    {row.cohortId ? (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[11px] font-bold">
                                                            {row.cohortId}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 italic text-[11px]">Auto (UUID)</span>
                                                    )}
                                                </td>
                                                <td className="p-3 font-semibold text-slate-900">{row.cohortName}</td>
                                                <td className="p-3">
                                                    {row.status ? (
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                            row.status.toLowerCase() === 'completed'
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : row.status.toLowerCase() === 'active'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {row.status}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">Draft</span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {row.cohortGroup ? (
                                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-[11px] font-semibold">
                                                            {row.cohortGroup}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-slate-500 whitespace-nowrap">
                                                    <div>{row.startDate || '-'} {row.endDate ? `to ${row.endDate}` : ''}</div>
                                                    {row.cohortYear && (
                                                        <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                                                            FY {row.cohortYear}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-slate-600 font-medium">
                                                    {row.totalParticipants !== undefined ? row.totalParticipants : '-'}
                                                </td>
                                                <td className="p-3 text-slate-600 font-medium">
                                                    {row.duration !== undefined ? `${row.duration}d` : '-'}
                                                </td>
                                                <td className="p-3 font-medium text-slate-800">
                                                    {row.programName || row.programId ? (
                                                        <span>{row.programName || row.programId}</span>
                                                    ) : row.sessionId ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-mono font-medium" title={row.sessionId}>
                                                            <HiOutlineLink className="w-3 h-3 shrink-0" />
                                                            {row.sessionId}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="text-xs text-slate-500 font-medium">
                        {fileName && <span>File: <strong className="text-slate-800">{fileName}</strong></span>}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            {uploadStats ? 'Close' : 'Cancel'}
                        </button>
                        {parsedRows && !uploadStats && (
                            <button
                                type="button"
                                onClick={handleConfirmUpload}
                                disabled={isUploading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-200"
                            >
                                {isUploading ? (
                                    <>
                                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                                        Importing Cohorts...
                                    </>
                                ) : (
                                    `Import ${uniqueCohortsCount} Cohort${uniqueCohortsCount !== 1 ? 's' : ''}`
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
