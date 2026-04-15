'use client';

import { useState, useTransition } from 'react';
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlinePencil,
    HiOutlineArrowPath,
    HiOutlineMagnifyingGlass
} from 'react-icons/hi2';
import { createManualModule, deleteManualModule } from '@/app/actions/admin-training-manuals';

interface Module {
    id: string;
    moduleCode: string | null;
    name: string;
    viewSeq: number;
}

export default function ModuleSpreadsheet({ modules }: { modules: Module[] }) {
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // New module form
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');

    const filtered = modules.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.moduleCode && m.moduleCode.toLowerCase().includes(search.toLowerCase()))
    );

    function handleAdd() {
        if (!newName.trim()) return;
        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('moduleCode', newCode.trim());
        startTransition(async () => {
            const result = await createManualModule(fd);
            if (result.error) {
                alert(result.error);
            } else {
                setNewName('');
                setNewCode('');
                setShowNew(false);
            }
        });
    }

    function handleDelete(id: string) {
        if (!confirm('Delete this module? It will be unlinked from all subjects.')) return;
        setDeletingId(id);
        startTransition(async () => {
            const result = await deleteManualModule(id);
            if (result.error) alert(result.error);
            setDeletingId(null);
        });
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Module Library</h2>
                    <p className="text-xs text-slate-500">Reusable curriculum components that can be linked to multiple subjects</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search modules..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none w-56"
                        />
                    </div>
                    <button
                        onClick={() => setShowNew(!showNew)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <HiOutlinePlus size={16} />
                        Add Module
                    </button>
                </div>
            </div>

            {/* Add New Row */}
            {showNew && (
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
                    <input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="Module Code (optional)"
                        className="w-40 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Module Name"
                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                        autoFocus
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
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-32">Code</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Module Name</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">Seq</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((m) => (
                            <tr key={m.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3 text-sm text-slate-500 font-mono">
                                    {m.moduleCode || <span className="text-slate-300">—</span>}
                                </td>
                                <td className="px-5 py-3 text-sm font-semibold text-slate-800">{m.name}</td>
                                <td className="px-5 py-3 text-sm text-slate-500 font-mono">{m.viewSeq}</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete Module">
                                            {deletingId === m.id ? <HiOutlineArrowPath className="animate-spin" size={14} /> : <HiOutlineTrash size={14} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-sm">
                                    {search ? 'No modules matching your search.' : 'No modules yet. Click "Add Module" to create one.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {modules.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                    Showing {filtered.length} of {modules.length} modules
                </div>
            )}
        </div>
    );
}
