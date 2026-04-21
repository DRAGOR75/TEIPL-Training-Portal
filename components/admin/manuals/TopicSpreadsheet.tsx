'use client';

import { useState, useTransition } from 'react';
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlinePencil,
    HiOutlineArrowPath,
    HiOutlineMagnifyingGlass,
    HiOutlineArrowTopRightOnSquare
} from 'react-icons/hi2';
import { createManualTopic, updateManualTopic } from '@/app/actions/admin-training-manuals';

interface Topic {
    id: string;
    name: string;
    content: string | null;
    pdfUrl: string | null;
    imageUrl: string | null;
    manualRef: string | null;
}

export default function TopicSpreadsheet({ topics }: { topics: Topic[] }) {
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ name: string; pdfUrl: string; manualRef: string }>({ name: '', pdfUrl: '', manualRef: '' });

    // New topic form
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPdfUrl, setNewPdfUrl] = useState('');
    const [newManualRef, setNewManualRef] = useState('');

    const filtered = topics.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.manualRef && t.manualRef.toLowerCase().includes(search.toLowerCase()))
    );

    function handleAdd() {
        if (!newName.trim()) return;
        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('pdfUrl', newPdfUrl.trim());
        fd.set('manualRef', newManualRef.trim());
        fd.set('content', '');
        startTransition(async () => {
            const result = await createManualTopic(fd);
            if (result.error) {
                alert(result.error);
            } else {
                setNewName('');
                setNewPdfUrl('');
                setNewManualRef('');
                setShowNew(false);
            }
        });
    }

    function startEdit(t: Topic) {
        setEditingId(t.id);
        setEditData({ name: t.name, pdfUrl: t.pdfUrl || '', manualRef: t.manualRef || '' });
    }

    function saveEdit(id: string) {
        startTransition(async () => {
            const result = await updateManualTopic(id, editData);
            if (result.error) {
                alert(result.error);
            } else {
                setEditingId(null);
            }
        });
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Topic Library</h2>
                    <p className="text-xs text-slate-500">Individual lessons with PDF links and manual references</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search topics..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none w-56"
                        />
                    </div>
                    <button
                        onClick={() => setShowNew(!showNew)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <HiOutlinePlus size={16} />
                        Add Topic
                    </button>
                </div>
            </div>

            {/* Add New Row */}
            {showNew && (
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center gap-3 animate-in slide-in-from-top-1 duration-200">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Topic Name"
                        className="flex-1 min-w-[200px] px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                        autoFocus
                    />
                    <input
                        value={newPdfUrl}
                        onChange={(e) => setNewPdfUrl(e.target.value)}
                        placeholder="PDF URL"
                        className="flex-1 min-w-[200px] px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                        value={newManualRef}
                        onChange={(e) => setNewManualRef(e.target.value)}
                        placeholder="Manual Ref"
                        className="w-32 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Topic Name</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">PDF URL</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28">Manual Ref</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((t) => (
                            <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                                {editingId === t.id ? (
                                    <>
                                        <td className="px-5 py-2.5">
                                            <input
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-blue-50 focus:ring-2 focus:ring-blue-400 outline-none"
                                            />
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <input
                                                value={editData.pdfUrl}
                                                onChange={(e) => setEditData({ ...editData, pdfUrl: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-blue-50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                placeholder="https://..."
                                            />
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <input
                                                value={editData.manualRef}
                                                onChange={(e) => setEditData({ ...editData, manualRef: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-blue-50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(t.id)}
                                            />
                                        </td>
                                        <td className="px-5 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => saveEdit(t.id)} disabled={isPending} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={14} /> : <HiOutlineCheck size={14} />}
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <HiOutlineXMark size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-5 py-3 text-sm font-semibold text-slate-800">{t.name}</td>
                                        <td className="px-5 py-3 text-sm text-slate-500 max-w-xs truncate">
                                            {t.pdfUrl ? (
                                                <a href={t.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate">
                                                    <span className="truncate">{t.pdfUrl}</span>
                                                    <HiOutlineArrowTopRightOnSquare size={12} className="shrink-0" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300">No link</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-sm text-slate-500 font-mono">{t.manualRef || <span className="text-slate-300">—</span>}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <HiOutlinePencil size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-sm">
                                    {search ? 'No topics matching your search.' : 'No topics yet. Click "Add Topic" to create one.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {topics.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                    Showing {filtered.length} of {topics.length} topics
                </div>
            )}
        </div>
    );
}
