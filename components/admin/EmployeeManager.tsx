'use client';

import { useState, useRef } from 'react';
import { createEmployee, deleteEmployee } from '@/app/actions/master-data';
import { processEmployeeUpload } from '@/app/actions/bulk-upload';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import {
    HiOutlineTrash,
    HiOutlineUsers,
    HiOutlinePlus,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineArrowUpTray,
    HiOutlineTableCells,
    HiOutlineArrowPath
} from 'react-icons/hi2';
import Papa from 'papaparse';
import SearchableSelect from '@/components/ui/SearchableSelect';

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

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedGrade, setSelectedGrade] = useState('EXECUTIVE');
    const [selectedGender, setSelectedGender] = useState('');

    // --- MANUAL ADD ---
    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createEmployee(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else {
            formRef.current?.reset();
            setSelectedGrade('EXECUTIVE');
            setSelectedGender('');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete employee?')) return;
        setDeletingId(id);
        const result = await deleteEmployee(id);
        if (result?.error) alert(result.error);
        setDeletingId(null);
    }

    // --- BULK UPLOAD ---
    const [progress, setProgress] = useState(0);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadStats(null);
        setProgress(0);

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
                        const currentProcessed = Math.min(i + CHUNK_SIZE, TOTAL_RECORDS);

                        // Update Progress Percentage
                        setProgress(Math.round((currentProcessed / TOTAL_RECORDS) * 100));

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
                    setProgress(0);
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                        <HiOutlineUsers size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Employee Directory</h3>
                        <p className="text-xs text-slate-500">{employees.length} Employees Registered</p>
                    </div>
                </div>
                <div className="text-blue-600">
                    {isExpanded ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">

                    {/* TABS or SPLIT VIEW for Add vs Upload */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

                        {/* LEFT: Manual Add */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <HiOutlinePlus size={16} /> Manual Entry
                            </h4>
                            <form ref={formRef} action={handleAdd} className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <input name="id" required placeholder="Emp ID *" className="p-3 text-sm border border-slate-300 rounded-xl w-full placeholder-slate-500 text-slate-900 outline-none focus:ring-2 focus:ring-purple-500" />
                                    <SearchableSelect
                                        name="grade"
                                        options={[
                                            { label: 'Executive', value: 'EXECUTIVE' },
                                            { label: 'Workman', value: 'WORKMAN' }
                                        ]}
                                        value={selectedGrade}
                                        onChange={setSelectedGrade}
                                        className="w-full"
                                    />
                                </div>
                                <input name="name" required placeholder="Full Name *" className="p-3 text-sm border border-slate-300 rounded-xl w-full placeholder-slate-500 text-slate-900 outline-none focus:ring-2 focus:ring-purple-500" />
                                <input name="email" required type="email" placeholder="Email Address *" className="p-3 text-sm border border-slate-300 rounded-xl w-full placeholder-slate-500 text-slate-900 outline-none focus:ring-2 focus:ring-purple-500" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input name="sectionName" placeholder="Department / Section" className="p-3 text-sm border border-slate-300 rounded-xl w-full placeholder-slate-500 text-slate-900 outline-none focus:ring-2 focus:ring-purple-500" />
                                    <SearchableSelect
                                        name="gender"
                                        options={[
                                            { label: 'Male', value: 'MALE' },
                                            { label: 'Female', value: 'FEMALE' },
                                            { label: 'Other', value: 'OTHER' }
                                        ]}
                                        value={selectedGender}
                                        onChange={setSelectedGender}
                                        placeholder="Select Gender"
                                        className="w-full"
                                    />
                                </div>

                                <FormSubmitButton className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 shadow-lg shadow-purple-200">
                                    Add Employee
                                </FormSubmitButton>
                            </form>
                        </div>

                        {/* RIGHT: Bulk Upload */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <HiOutlineArrowUpTray size={16} /> Bulk Upload (CSV)
                            </h4>
                            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                                {uploading ? (
                                    <div className="text-center w-full max-w-xs">
                                        <div className="animate-pulse text-purple-600 font-bold text-lg mb-2">Processing CSV Data...</div>

                                        {/* Progress Bar */}
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                                                <span>Uploading...</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                <div
                                                    className="h-full bg-purple-600 transition-all duration-300 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <HiOutlineTableCells size={32} className="text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-600 mb-4">
                                            Upload CSV with headers:<br />
                                            <code className="text-xs bg-slate-200 px-1 rounded text-slate-700">id, name, email, grade, sectionName, location, gender, manager_name, manager_email, program_name, start_date, end_date</code>
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
                                            className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl shadow-sm hover:bg-slate-100 font-bold text-sm transition"
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
                        <div className={`mt-4 p-4 rounded-xl border ${uploadStats.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
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
                                                    onClick={() => handleDelete(emp.id)}
                                                    disabled={deletingId === emp.id}
                                                    className="text-slate-300 hover:text-red-500 transition disabled:opacity-50"
                                                >
                                                    {deletingId === emp.id ? (
                                                        <HiOutlineArrowPath className="animate-spin" size={16} />
                                                    ) : (
                                                        <HiOutlineTrash size={16} />
                                                    )}
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
