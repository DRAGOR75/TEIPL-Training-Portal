'use client';

import { useState, useRef } from 'react';
import { createFaultLibraryItem, deleteFaultLibraryItem } from '@/app/actions/admin-troubleshooting';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import { FaultLibrary } from '@prisma/client';

export default function FaultManager({ faults }: { faults: FaultLibrary[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isAdding, setIsAdding] = useState(false);

    async function handleAdd(formData: FormData) {
        const result = await createFaultLibraryItem(formData);
        if (result?.error) {
            alert(result.error);
        } else {
            formRef.current?.reset();
            setIsAdding(false);
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-500" />
                    Fault Library (Master List)
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1"
                >
                    <Plus size={14} /> New Fault
                </button>
            </div>

            {isAdding && (
                <div className="p-4 bg-orange-50 border-b border-orange-100 animate-in slide-in-from-top-2">
                    <form ref={formRef} action={handleAdd} className="flex gap-4 items-end">
                        <div className="w-32">
                            <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                            <input name="faultCode" className="w-full mt-1 p-2 border border-orange-200 rounded text-sm placeholder-slate-400" placeholder="e.g. F01" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Fault Name / Symptom</label>
                            <input name="name" className="w-full mt-1 p-2 border border-orange-200 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Engine Overheating" required />
                        </div>
                        <FormSubmitButton className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-medium">
                            Save
                        </FormSubmitButton>
                    </form>
                </div>
            )}

            <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Fault Name</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {faults.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{f.faultCode || '-'}</td>
                                <td className="px-4 py-3 font-medium text-slate-700">{f.name}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => { if (confirm(`Delete ${f.name}?`)) deleteFaultLibraryItem(f.id) }}
                                        className="text-slate-300 hover:text-red-600 transition p-1"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {faults.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No faults in library.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
