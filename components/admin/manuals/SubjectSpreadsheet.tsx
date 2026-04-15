'use client';

import { useState, useTransition } from 'react';
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlinePencil,
    HiOutlineArrowPath,
    HiOutlineEye,
    HiOutlineEyeSlash
} from 'react-icons/hi2';
import { createManualSubject, updateManualSubject, deleteManualSubject, toggleManualSubjectStatus } from '@/app/actions/admin-training-manuals';

interface Subject {
    id: number;
    name: string;
    viewSeq: number;
    userView: number;
    keywords: string | null;
    imageUrl: string | null;
}

export default function SubjectSpreadsheet({ subjects }: { subjects: Subject[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editSeq, setEditSeq] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // New subject form
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSeq, setNewSeq] = useState(99);

    function startEdit(s: Subject) {
        setEditingId(s.id);
        setEditName(s.name);
        setEditSeq(s.viewSeq);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName('');
        setEditSeq(0);
    }

    function saveEdit(id: number) {
        startTransition(async () => {
            const result = await updateManualSubject(id, { name: editName, viewSeq: editSeq });
            if (result.error) {
                alert(result.error);
            } else {
                setEditingId(null);
            }
        });
    }

    function handleDelete(id: number) {
        if (!confirm('Delete this subject and all its module links?')) return;
        setDeletingId(id);
        startTransition(async () => {
            const result = await deleteManualSubject(id);
            if (result.error) alert(result.error);
            setDeletingId(null);
        });
    }

    function handleAdd() {
        if (!newName.trim()) return;
        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('viewSeq', String(newSeq));
        startTransition(async () => {
            const result = await createManualSubject(fd);
            if (result.error) {
                alert(result.error);
            } else {
                setNewName('');
                setNewSeq(99);
                setShowNew(false);
            }
        });
    }
    
    function handleToggleVisibility(id: number, currentStatus: number) {
        startTransition(async () => {
            const result = await toggleManualSubjectStatus(id, currentStatus);
            if (result.error) alert(result.error);
        });
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Subject Library</h2>
                    <p className="text-xs text-slate-500">Top-level categories for training manuals</p>
                </div>
                <button
                    onClick={() => setShowNew(!showNew)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    <HiOutlinePlus size={16} />
                    Add Subject
                </button>
            </div>

            {/* Add New Row */}
            {showNew && (
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Subject Name"
                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <input
                        type="number"
                        value={newSeq}
                        onChange={(e) => setNewSeq(parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white text-center focus:ring-2 focus:ring-blue-400 outline-none"
                        placeholder="Seq"
                    />
                    <button onClick={handleAdd} disabled={isPending} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                        <HiOutlineCheck size={16} />
                    </button>
                    <button onClick={() => setShowNew(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                        <HiOutlineXMark size={16} />
                    </button>
                </div>
            )}

            {/* Spreadsheet Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 text-left">
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">Seq</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject Name</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Visible</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {subjects.map((s) => (
                            <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                                {editingId === s.id ? (
                                    <>
                                        <td className="px-5 py-2.5">
                                            <input
                                                type="number"
                                                value={editSeq}
                                                onChange={(e) => setEditSeq(parseInt(e.target.value) || 0)}
                                                className="w-16 px-2 py-1.5 border border-blue-300 rounded-lg text-sm text-center bg-blue-50 focus:ring-2 focus:ring-blue-400 outline-none"
                                            />
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-blue-50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(s.id)}
                                            />
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <button 
                                                onClick={() => handleToggleVisibility(s.id, s.userView)}
                                                className={`p-1.5 rounded-lg transition-all ${s.userView === 1 ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                title={s.userView === 1 ? 'Hide from users' : 'Show to users'}
                                            >
                                                {s.userView === 1 ? <HiOutlineEye size={18} /> : <HiOutlineEyeSlash size={18} />}
                                            </button>
                                        </td>
                                        <td className="px-5 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => saveEdit(s.id)} disabled={isPending} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={14} /> : <HiOutlineCheck size={14} />}
                                                </button>
                                                <button onClick={cancelEdit} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <HiOutlineXMark size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-5 py-3 text-sm text-slate-500 font-mono">{s.viewSeq}</td>
                                        <td className="px-5 py-3 text-sm font-semibold text-slate-800">{s.name}</td>
                                        <td className="px-5 py-3">
                                            <button 
                                                onClick={() => handleToggleVisibility(s.id, s.userView)}
                                                className={`p-1.5 rounded-lg transition-all ${s.userView === 1 ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                title={s.userView === 1 ? 'Hide from users' : 'Show to users'}
                                            >
                                                {s.userView === 1 ? <HiOutlineEye size={18} /> : <HiOutlineEyeSlash size={18} />}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <HiOutlinePencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                                                    {deletingId === s.id ? <HiOutlineArrowPath className="animate-spin" size={14} /> : <HiOutlineTrash size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {subjects.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-sm">
                                    No subjects yet. Click &quot;Add Subject&quot; to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
