'use client';

import { useState, useRef } from 'react';
import { createTroubleshootingProduct, deleteTroubleshootingProduct, updateTroubleshootingProduct } from '@/app/actions/admin-troubleshooting';
import { FormSubmitButton } from '@/components/FormSubmitButton'; // Assuming we have this
import { Trash2, Plus, Box, Edit2, Check, X } from 'lucide-react';
import { TroubleshootingProduct } from '@prisma/client';

export default function ProductManager({ products }: { products: TroubleshootingProduct[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editSeq, setEditSeq] = useState(0);

    async function handleAdd(formData: FormData) {
        const result = await createTroubleshootingProduct(formData);
        if (result?.error) {
            alert(result.error);
        } else {
            formRef.current?.reset();
            setIsAdding(false);
        }
    }

    async function handleUpdate(id: number) {
        const result = await updateTroubleshootingProduct(id, { name: editName, viewSeq: editSeq });
        if (result?.error) {
            alert(result.error);
        } else {
            setEditingId(null);
        }
    }

    const startEdit = (product: TroubleshootingProduct) => {
        setEditingId(product.id);
        setEditName(product.name);
        setEditSeq(product.viewSeq);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Box size={18} className="text-blue-600" />
                    Machines / Products
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1"
                >
                    <Plus size={14} /> New Machine
                </button>
            </div>

            {isAdding && (
                <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
                    <form ref={formRef} action={handleAdd} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Model Name</label>
                            <input name="name" className="w-full mt-1 p-2 border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. CAT D11 R" required />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-bold text-slate-500 uppercase">Seq</label>
                            <input type="number" name="viewSeq" className="w-full mt-1 p-2 border border-blue-200 rounded text-sm" defaultValue={99} />
                        </div>
                        <FormSubmitButton className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
                            Save
                        </FormSubmitButton>
                    </form>
                </div>
            )}

            <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 w-20">Seq</th>
                            <th className="px-4 py-3">Machine Name</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 group transition-colors">
                                {editingId === p.id ? (
                                    <>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={editSeq}
                                                onChange={(e) => setEditSeq(parseInt(e.target.value))}
                                                className="w-16 p-1 border border-blue-300 rounded text-xs"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full p-1 border border-blue-300 rounded text-sm"
                                                autoFocus
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdate(p.id)}
                                                    className="text-white bg-green-500 hover:bg-green-600 p-1 rounded shadow-sm"
                                                    title="Save"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="text-slate-500 hover:text-slate-700 p-1"
                                                    title="Cancel"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.viewSeq}</td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(p)}
                                                    className="text-slate-400 hover:text-blue-600 transition p-1"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteTroubleshootingProduct(p.id) }}
                                                    className="text-slate-300 hover:text-red-600 transition p-1"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No machines found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
