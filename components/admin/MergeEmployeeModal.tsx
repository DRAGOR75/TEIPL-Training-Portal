'use client';

import { useState } from 'react';
import { mergeEmployees } from '@/app/actions/master-data';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { HiOutlineXMark } from 'react-icons/hi2';

interface Employee {
    id: string;
    name: string;
    email: string;
    grade: string | null;
    status: string;
}

export default function MergeEmployeeModal({
    employees,
    isOpen,
    onClose
}: {
    employees: Employee[];
    isOpen: boolean;
    onClose: () => void;
}) {
    const [primaryId, setPrimaryId] = useState<string>('');
    const [duplicateId, setDuplicateId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const employeeOptions = employees.map(emp => ({
        label: `${emp.name} (ID: ${emp.id}) ${emp.status === 'Inactive' ? '[Inactive]' : ''}`,
        value: emp.id
    }));

    const primaryEmployee = employees.find(e => e.id === primaryId);
    const duplicateEmployee = employees.find(e => e.id === duplicateId);

    const handleMerge = async () => {
        setError('');
        setSuccessMsg('');

        if (!primaryId || !duplicateId) {
            setError('Please select both a Primary and a Duplicate employee.');
            return;
        }
        if (primaryId === duplicateId) {
            setError('Primary and Duplicate cannot be the same.');
            return;
        }

        const confirmMerge = window.confirm(`Are you sure you want to merge ${duplicateEmployee?.name} into ${primaryEmployee?.name}? The duplicate record will be marked Inactive and its training history transferred.`);
        if (!confirmMerge) return;

        setLoading(true);
        const res = await mergeEmployees(primaryId, duplicateId);
        setLoading(false);

        if (res.error) {
            setError(res.error);
        } else {
            setSuccessMsg('Successfully merged employees!');
            setTimeout(() => {
                onClose();
                setPrimaryId('');
                setDuplicateId('');
                setSuccessMsg('');
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-lg text-slate-800">Merge Duplicate Employee</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <HiOutlineXMark size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium border border-rose-100">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-medium border border-emerald-100">
                            {successMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Primary Employee */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    1. Target (Primary) Employee
                                </label>
                                <SearchableSelect
                                    options={employeeOptions}
                                    value={primaryId}
                                    onChange={(val) => setPrimaryId(typeof val === 'string' ? val : '')}
                                    placeholder="Search primary employee..."
                                    className="w-full text-sm"
                                />
                            </div>
                            {primaryEmployee && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2">
                                    <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Keep This Record</div>
                                    <div className="text-sm font-semibold text-slate-900">{primaryEmployee.name}</div>
                                    <div className="text-xs text-slate-600">ID: {primaryEmployee.id}</div>
                                    <div className="text-xs text-slate-600">Email: {primaryEmployee.email || 'N/A'}</div>
                                    <div className="text-xs text-slate-600">Grade: {primaryEmployee.grade || 'N/A'}</div>
                                </div>
                            )}
                        </div>

                        {/* Duplicate Employee */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                    2. Source (Duplicate) Employee
                                </label>
                                <SearchableSelect
                                    options={employeeOptions}
                                    value={duplicateId}
                                    onChange={(val) => setDuplicateId(typeof val === 'string' ? val : '')}
                                    placeholder="Search duplicate employee..."
                                    className="w-full text-sm"
                                />
                            </div>
                            {duplicateEmployee && (
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-2">
                                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Merge & Mark Inactive</div>
                                    <div className="text-sm font-semibold text-slate-900">{duplicateEmployee.name}</div>
                                    <div className="text-xs text-slate-600">ID: {duplicateEmployee.id}</div>
                                    <div className="text-xs text-slate-600">Email: {duplicateEmployee.email || 'N/A'}</div>
                                    <div className="text-xs text-slate-600">Grade: {duplicateEmployee.grade || 'N/A'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition">
                        Cancel
                    </button>
                    <button 
                        onClick={handleMerge}
                        disabled={loading || !primaryId || !duplicateId}
                        className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Merging...' : 'Merge Records'}
                    </button>
                </div>
            </div>
        </div>
    );
}
