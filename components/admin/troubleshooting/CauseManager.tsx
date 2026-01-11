'use client';

import { useState, useRef } from 'react';
import { createCauseLibraryItem, deleteCauseLibraryItem } from '@/app/actions/admin-troubleshooting';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Trash2, Plus, Stethoscope } from 'lucide-react';
import { CauseLibrary } from '@prisma/client';

export default function CauseManager({ causes }: { causes: CauseLibrary[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isAdding, setIsAdding] = useState(false);

    async function handleAdd(formData: FormData) {
        const result = await createCauseLibraryItem(formData);
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
                    <Stethoscope size={18} className="text-green-600" />
                    Cause & Remedy Library (Checks)
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1"
                >
                    <Plus size={14} /> New Check
                </button>
            </div>

            {isAdding && (
                <div className="p-4 bg-green-50 border-b border-green-100 animate-in slide-in-from-top-2">
                    <form ref={formRef} action={handleAdd} className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Check Description (Cause)</label>
                            <input name="name" className="w-full mt-1 p-2 border border-green-200 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Check Coolant Level" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Remedy / Action</label>
                                <textarea name="action" rows={2} className="w-full mt-1 p-2 border border-green-200 rounded text-sm" placeholder="e.g. Top up coolant..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Symptoms (Optional)</label>
                                <textarea name="symptoms" rows={2} className="w-full mt-1 p-2 border border-green-200 rounded text-sm" placeholder="e.g. High temp gauge reading..." />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Manual Reference</label>
                            <input name="manualRef" className="w-full mt-1 p-2 border border-green-200 rounded text-sm" placeholder="e.g. Page 42, Section 3.1" />
                        </div>

                        <div className="text-right">
                            <FormSubmitButton className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium">
                                Save to Library
                            </FormSubmitButton>
                        </div>
                    </form>
                </div>
            )}

            <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 w-1/3">Cause / Check</th>
                            <th className="px-4 py-3 w-1/3">Remedy</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {causes.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50 group transition-colors">
                                <td className="px-4 py-3 align-top">
                                    <div className="font-medium text-slate-700">{c.name}</div>
                                    {c.manualRef && <div className="text-xs text-blue-500 mt-1 font-mono">{c.manualRef}</div>}
                                </td>
                                <td className="px-4 py-3 align-top text-slate-600 text-xs">
                                    {c.action || <span className="text-slate-300 italic">No remedy specified</span>}
                                </td>
                                <td className="px-4 py-3 text-right align-top">
                                    <button
                                        onClick={() => { if (confirm(`Delete ${c.name}?`)) deleteCauseLibraryItem(c.id) }}
                                        className="text-slate-300 hover:text-red-600 transition p-1"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {causes.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No causes in library.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
