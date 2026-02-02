'use client';

import { useState, useRef } from 'react';
import { createCauseLibraryItem, deleteCauseLibraryItem, updateCauseLibraryItem } from '@/app/actions/admin-troubleshooting';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineClipboardDocumentCheck, HiOutlineArrowPath } from 'react-icons/hi2';
import { CauseLibrary } from '@prisma/client';

export default function CauseManager({ causes }: { causes: CauseLibrary[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleAdd(formData: FormData) {
        const result = await createCauseLibraryItem(formData);
        if (result?.error) {
            alert(result.error);
        } else {
            formRef.current?.reset();
            setIsAdding(false);
        }
    }

    async function handleUpdate(id: string, formData: FormData) {
        const data = {
            name: formData.get('name') as string,
            justification: formData.get('justification') as string,
            action: formData.get('action') as string,
            symptoms: formData.get('symptoms') as string,
            manualRef: formData.get('manualRef') as string,
        };

        const result = await updateCauseLibraryItem(id, data);
        if (result?.error) {
            alert(result.error);
        } else {
            setEditingId(null);
        }
    }

    async function handleDelete(id: string) {
        const cause = causes.find(c => c.id === id);
        if (!confirm(`Delete ${cause?.name}?`)) return;
        setDeletingId(id);
        const result = await deleteCauseLibraryItem(id);
        if (result?.error) alert(result.error);
        setDeletingId(null);
    }

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <HiOutlineClipboardDocumentCheck size={18} className="text-green-600" />
                    Cause Library
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium transition flex items-center gap-1"
                >
                    <HiOutlinePlus size={14} /> New Check
                </button>
            </div>

            {isAdding && (
                <div className="p-4 bg-green-50 border-b border-green-100 animate-in slide-in-from-top-2">
                    <form ref={formRef} action={handleAdd} className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Check Description (Cause)</label>
                            <input name="name" className="w-full mt-1 p-3 border border-green-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Check Coolant Level" required />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Justification (Why?)</label>
                            <textarea name="justification" rows={2} className="w-full mt-1 p-3 border border-green-200 rounded-xl text-sm" placeholder="e.g. Low coolant leads to overheating..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Remedy / Action</label>
                                <textarea name="action" rows={2} className="w-full mt-1 p-3 border border-green-200 rounded-xl text-sm" placeholder="e.g. Top up coolant..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Symptoms (Optional)</label>
                                <textarea name="symptoms" rows={2} className="w-full mt-1 p-3 border border-green-200 rounded-xl text-sm" placeholder="e.g. High temp gauge reading..." />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Manual Reference</label>
                            <input name="manualRef" className="w-full mt-1 p-3 border border-green-200 rounded-xl text-sm" placeholder="e.g. Page 42, Section 3.1" />
                        </div>

                        <div className="text-right">
                            <FormSubmitButton className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium">
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
                                {editingId === c.id ? (
                                    <td colSpan={3} className="px-4 py-3 bg-blue-50/50">
                                        <form action={(fd) => handleUpdate(c.id, fd)} className="space-y-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Check Description</label>
                                                <input defaultValue={c.name} name="name" className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Justification</label>
                                                <textarea defaultValue={c.justification || ''} name="justification" rows={2} className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Remedy</label>
                                                    <textarea defaultValue={c.action || ''} name="action" rows={2} className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Symptoms</label>
                                                    <textarea defaultValue={c.symptoms || ''} name="symptoms" rows={2} className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Manual Reference</label>
                                                <input defaultValue={c.manualRef || ''} name="manualRef" className="w-full mt-1 p-3 border border-blue-200 rounded-xl text-sm" />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-slate-600 bg-white border border-slate-300 rounded text-xs">Cancel</button>
                                                <FormSubmitButton className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Save Changes</FormSubmitButton>
                                            </div>
                                        </form>
                                    </td>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 align-top">
                                            <div className="font-medium text-slate-700">{c.name}</div>
                                            {c.manualRef && <div className="text-xs text-blue-500 mt-1 font-mono">{c.manualRef}</div>}
                                        </td>
                                        <td className="px-4 py-3 align-top text-slate-600 text-xs">
                                            {c.action || <span className="text-slate-300 italic">No remedy specified</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right align-top">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setEditingId(c.id)}
                                                    className="text-slate-400 hover:text-blue-600 transition p-1"
                                                    title="Edit"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    disabled={deletingId === c.id}
                                                    className="text-slate-300 hover:text-red-600 transition p-1 disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingId === c.id ? (
                                                        <HiOutlineArrowPath className="animate-spin" size={16} />
                                                    ) : (
                                                        <HiOutlineTrash size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
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
