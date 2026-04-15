'use client';

import { useState, useTransition } from 'react';
import {
    HiOutlineBookOpen,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineArrowPath,
    HiOutlineMagnifyingGlass,
    HiOutlineArrowRight,
    HiOutlineRectangleGroup
} from 'react-icons/hi2';
import {
    createManualSubject,
    updateManualSubject,
    deleteManualSubject,
    toggleManualSubjectStatus
} from '@/app/actions/admin-training-manuals';

interface Subject {
    id: number;
    name: string;
    viewSeq: number;
    userView: number;
    keywords: string | null;
    imageUrl: string | null;
}

interface SubjectGridProps {
    subjects: Subject[];
    isAdmin: boolean;
    onSelectSubject: (subject: Subject) => void;
    searchQuery: string;
}

const GRADIENTS = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-violet-500 to-fuchsia-500',
    'from-sky-500 to-blue-600',
    'from-lime-500 to-green-500',
];

export default function SubjectGrid({ subjects, isAdmin, onSelectSubject, searchQuery }: SubjectGridProps) {
    const [isPending, startTransition] = useTransition();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSeq, setNewSeq] = useState(99);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const filtered = subjects.filter(s => {
        if (!searchQuery) return isAdmin ? true : s.userView === 1;
        const q = searchQuery.toLowerCase();
        const match = s.name.toLowerCase().includes(q) || (s.keywords || '').toLowerCase().includes(q);
        return isAdmin ? match : match && s.userView === 1;
    });

    function handleAdd() {
        if (!newName.trim()) return;
        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('viewSeq', String(newSeq));
        startTransition(async () => {
            const result = await createManualSubject(fd);
            if (result.error) alert(result.error);
            else { setNewName(''); setNewSeq(99); setShowAddForm(false); }
        });
    }

    function handleDelete(e: React.MouseEvent, id: number) {
        e.stopPropagation();
        if (!confirm('Delete this subject and all its module links?')) return;
        setDeletingId(id);
        startTransition(async () => {
            const result = await deleteManualSubject(id);
            if (result.error) alert(result.error);
            setDeletingId(null);
        });
    }

    function handleToggle(e: React.MouseEvent, id: number, currentStatus: number) {
        e.stopPropagation();
        startTransition(async () => {
            const result = await toggleManualSubjectStatus(id, currentStatus);
            if (result.error) alert(result.error);
        });
    }

    function handleSaveEdit(e: React.MouseEvent, id: number) {
        e.stopPropagation();
        if (!editName.trim()) return;
        startTransition(async () => {
            const result = await updateManualSubject(id, { name: editName.trim(), viewSeq: 0 });
            if (result.error) alert(result.error);
            else setEditingId(null);
        });
    }

    return (
        <div>
            {/* Add Subject Form (Admin) */}
            {isAdmin && showAddForm && (
                <div className="mb-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200 p-5 animate-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-bold text-indigo-800 mb-3">Add New Subject</h3>
                    <div className="flex items-center gap-3">
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Subject name (e.g., Hydraulics)"
                            className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <input
                            type="number"
                            value={newSeq}
                            onChange={(e) => setNewSeq(parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2.5 border border-indigo-200 rounded-xl text-sm bg-white text-center focus:ring-2 focus:ring-indigo-400 outline-none"
                            placeholder="Order"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={isPending || !newName.trim()}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlineCheck size={16} />}
                            Add
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white transition-colors"
                        >
                            <HiOutlineXMark size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Add Card (Admin) */}
                {isAdmin && !showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="group relative bg-white/50 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-all duration-300 overflow-hidden min-h-[180px] flex flex-col items-center justify-center gap-3 hover:bg-indigo-50/30"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                            <HiOutlinePlus size={28} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Add Subject</span>
                    </button>
                )}

                {/* Subject Cards */}
                {filtered.map((subject, index) => (
                    <div
                        key={subject.id}
                        onClick={() => {
                            if (editingId !== subject.id) onSelectSubject(subject);
                        }}
                        className={`group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1 ${isAdmin && subject.userView !== 1 ? 'opacity-60 hover:opacity-100' : ''}`}
                    >
                        {/* Top Gradient Accent */}
                        <div className={`h-2 bg-gradient-to-r ${GRADIENTS[index % GRADIENTS.length]} opacity-80 group-hover:opacity-100 transition-opacity`} />

                        <div className="p-5">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                <HiOutlineBookOpen size={22} />
                            </div>

                            {/* Title */}
                            {editingId === subject.id ? (
                                <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50/50 focus:ring-2 focus:ring-indigo-400 outline-none"
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(e as any, subject.id); if (e.key === 'Escape') setEditingId(null); }}
                                    />
                                    <button onClick={(e) => handleSaveEdit(e, subject.id)} className="p-1.5 bg-indigo-600 text-white rounded-lg">
                                        <HiOutlineCheck size={14} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                        <HiOutlineXMark size={14} />
                                    </button>
                                </div>
                            ) : (
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors mb-1 line-clamp-2">
                                    {subject.name}
                                </h3>
                            )}

                            {subject.keywords && (
                                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{subject.keywords}</p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-auto pt-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                    <HiOutlineRectangleGroup size={16} />
                                    View Modules
                                    <HiOutlineArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>

                                {/* Admin Controls */}
                                {isAdmin && editingId !== subject.id && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => handleToggle(e, subject.id, subject.userView)}
                                            className={`p-1.5 rounded-lg transition-all ${subject.userView === 1 ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                            title={subject.userView === 1 ? 'Published' : 'Hidden'}
                                        >
                                            {subject.userView === 1 ? <HiOutlineEye size={16} /> : <HiOutlineEyeSlash size={16} />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingId(subject.id); setEditName(subject.name); }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <HiOutlinePencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, subject.id)}
                                            disabled={deletingId === subject.id}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete"
                                        >
                                            {deletingId === subject.id ? <HiOutlineArrowPath className="animate-spin" size={14} /> : <HiOutlineTrash size={14} />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Status badge */}
                            {isAdmin && (
                                <div className="absolute top-4 right-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${subject.userView === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {subject.userView === 1 ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && !isAdmin && (
                <div className="py-24 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
                        <HiOutlineBookOpen size={36} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">
                        {searchQuery ? 'No Results Found' : 'No Manuals Available'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {searchQuery ? 'Try a different search term.' : 'Training manuals will appear here once published.'}
                    </p>
                </div>
            )}

            {filtered.length === 0 && isAdmin && subjects.length === 0 && (
                <div className="py-16 text-center col-span-full">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-6">
                        <HiOutlinePlus size={36} className="text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Get Started</h2>
                    <p className="text-slate-500 text-sm">Create your first subject to begin building the training library.</p>
                </div>
            )}
        </div>
    );
}
