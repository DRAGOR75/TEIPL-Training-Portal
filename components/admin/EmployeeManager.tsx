'use client';

import { useState, useRef } from 'react';
import { createEmployee, deleteEmployee } from '@/app/actions/master-data';
import { processEmployeeUpload } from '@/app/actions/bulk-upload';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Trash2, Users, Plus, ChevronDown, ChevronUp, Upload, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';

interface Employee {
    id: string; // emp_id
    name: string;
    email: string;
    grade: string;
    sectionName: string | null;
}

export default function EmployeeManager({ employees }: { employees: Employee[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<{ success: number; errors: string[] } | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- MANUAL ADD ---
    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createEmployee(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else formRef.current?.reset();
    }

    // --- BULK UPLOAD ---
    const [progress, setProgress] = useState<string>('');

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadStats(null);
        setProgress('Parsing CSV...');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const allData = results.data as any[];
                const TOTAL_RECORDS = allData.length;
                const CHUNK_SIZE = 500; // Client-side batch size

                let successTotal = 0;
                let allErrors: string[] = [];

                try {
                    for (let i = 0; i < TOTAL_RECORDS; i += CHUNK_SIZE) {
                        const chunk = allData.slice(i, i + CHUNK_SIZE);
                        const currentBatchNum = Math.floor(i / CHUNK_SIZE) + 1;
                        const totalBatches = Math.ceil(TOTAL_RECORDS / CHUNK_SIZE);

                        setProgress(`Processing batch ${currentBatchNum} of ${totalBatches} (${Math.min(i + CHUNK_SIZE, TOTAL_RECORDS)} / ${TOTAL_RECORDS} records)...`);

                        const result = await processEmployeeUpload(chunk);

                        if (result.success) {
                            successTotal += result.count;
                            if (result.errors && result.errors.length > 0) {
                                allErrors = [...allErrors, ...result.errors];
                            }
                        } else {
                            allErrors.push(`Batch ${currentBatchNum} failed completely.`);
                        }
                    }

                    setUploadStats({
                        success: successTotal,
                        errors: allErrors
                    });
                } catch (err) {
                    console.error(err);
                    setUploadStats({ success: successTotal, errors: [...allErrors, "Process interrupted or failed."] });
                } finally {
                    setUploading(false);
                    setProgress('');
                    // Reset file input
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            },
            error: (error) => {
                console.error(error);
                setUploading(false);
                setUploadStats({ success: 0, errors: ["Failed to parse CSV file."] });
            }
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Employee Directory</h3>
                        <p className="text-xs text-slate-500">{employees.length} Employees Registered</p>
                    </div>
                </div>
                <div className="text-blue-600">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">

                    {/* TABS or SPLIT VIEW for Add vs Upload */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

                        {/* LEFT: Manual Add */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Plus size={16} /> Manual Entry
                            </h4>
                            <form ref={formRef} action={handleAdd} className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <input name="id" required placeholder="Emp ID *" className="p-2 text-sm border border-slate-300 rounded w-full placeholder-slate-500 text-slate-900" />
                                    <select name="grade" className="p-2 text-sm border border-slate-300 rounded w-full text-slate-900">
                                        <option value="EXECUTIVE">Executive</option>
                                        <option value="WORKMAN">Workman</option>
                                    </select>
                                </div>
                                <input name="name" required placeholder="Full Name *" className="p-2 text-sm border border-slate-300 rounded w-full placeholder-slate-500 text-slate-900" />
                                <input name="email" required type="email" placeholder="Email Address *" className="p-2 text-sm border border-slate-300 rounded w-full placeholder-slate-500 text-slate-900" />
                                <input name="sectionName" placeholder="Department / Section" className="p-2 text-sm border border-slate-300 rounded w-full placeholder-slate-500 text-slate-900" />

                                <FormSubmitButton className="w-full py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 transition disabled:opacity-50">
                                    Add Employee
                                </FormSubmitButton>
                            </form>
                        </div>

                        {/* RIGHT: Bulk Upload */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Upload size={16} /> Bulk Upload (CSV)
                            </h4>
                            <div className="bg-slate-50 p-6 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                                {uploading ? (
                                    <div className="text-center">
                                        <div className="animate-pulse text-purple-600 font-bold text-lg mb-2">Processing CSV Data...</div>
                                        <div className="text-slate-500 font-medium">{progress}</div>
                                    </div>
                                ) : (
                                    <>
                                        <FileSpreadsheet size={32} className="text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-600 mb-4">
                                            Upload CSV with headers:<br />
                                            <code className="text-xs bg-slate-200 px-1 rounded text-slate-700">id, name, email, grade, sectionName, location, manager_name, manager_email, program_name, start_date, end_date</code>
                                        </p>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="csvUpload"
                                        />
                                        <label
                                            htmlFor="csvUpload"
                                            className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded shadow-sm hover:bg-slate-100 font-bold text-sm transition"
                                        >
                                            Select CSV File
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* UPLOAD STATS RESULT */}
                    {uploadStats && (
                        <div className={`mt-4 p-4 rounded border ${uploadStats.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                            <p className="font-bold text-sm">Upload Complete</p>
                            <p className="text-sm mt-1">✅ Successfully Imported: {uploadStats.success} records</p>
                            {uploadStats.errors.length > 0 && (
                                <div className="mt-2 text-xs text-red-600 max-h-32 overflow-y-auto">
                                    <p className="font-bold">Errors:</p>
                                    <ul className="list-disc pl-4">
                                        {uploadStats.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                                        {uploadStats.errors.length > 10 && <li>...and {uploadStats.errors.length - 10} more</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RECENT EMPLOYEES LIST (Limited) */}
                    <div className="mt-8">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Recently Added Employees (Last 20)</h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Dept</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {employees.slice(0, 20).map(emp => (
                                        <tr key={emp.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-slate-600">{emp.id}</td>
                                            <td className="p-3 font-medium text-slate-900">{emp.name}</td>
                                            <td className="p-3 text-slate-500">{emp.email}</td>
                                            <td className="p-3 text-slate-500">{emp.sectionName || '-'}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => { if (confirm('Delete employee?')) deleteEmployee(emp.id) }}
                                                    className="text-slate-300 hover:text-red-500 transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
