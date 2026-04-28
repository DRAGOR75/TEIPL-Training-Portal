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
    HiOutlineArrowRight,
    HiOutlineRectangleGroup,
    HiOutlineDocumentText
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
    searchQuery: string;
    onSelectSubject: (subject: Subject) => void;
    onPreviewSubject?: (subject: Subject) => void;
}

const THEME_COLORS = [
    { name: 'blue', border: 'hover:border-blue-500', text: 'text-blue-600 hover:text-blue-700', blob: 'bg-blue-50', iconBg: 'bg-blue-50 text-blue-600' },
    { name: 'emerald', border: 'hover:border-emerald-500', text: 'text-emerald-600 hover:text-emerald-700', blob: 'bg-emerald-50', iconBg: 'bg-emerald-50 text-emerald-600' },
    { name: 'amber', border: 'hover:border-amber-500', text: 'text-amber-600 hover:text-amber-700', blob: 'bg-amber-50', iconBg: 'bg-amber-50 text-amber-600' },
    { name: 'purple', border: 'hover:border-purple-500', text: 'text-purple-600 hover:text-purple-700', blob: 'bg-purple-50', iconBg: 'bg-purple-50 text-purple-600' },
    { name: 'rose', border: 'hover:border-rose-500', text: 'text-rose-600 hover:text-rose-700', blob: 'bg-rose-50', iconBg: 'bg-rose-50 text-rose-600' },
    { name: 'sky', border: 'hover:border-sky-500', text: 'text-sky-600 hover:text-sky-700', blob: 'bg-sky-50', iconBg: 'bg-sky-50 text-sky-600' },
    { name: 'indigo', border: 'hover:border-indigo-500', text: 'text-indigo-600 hover:text-indigo-700', blob: 'bg-indigo-50', iconBg: 'bg-indigo-50 text-indigo-600' },
    { name: 'teal', border: 'hover:border-teal-500', text: 'text-teal-600 hover:text-teal-700', blob: 'bg-teal-50', iconBg: 'bg-teal-50 text-teal-600' },
];

export default function SubjectGrid({ subjects, isAdmin, searchQuery, onSelectSubject }: SubjectGridProps) {
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
                        className="group relative bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-300 hover:border-blue-400 transition-all duration-300 overflow-hidden min-h-[220px] flex flex-col items-center justify-center gap-4 hover:bg-blue-50/30 shadow-sm"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <HiOutlinePlus size={32} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors uppercase tracking-wider">Add Subject</span>
                    </button>
                )}

                {/* Subject Cards */}
                {filtered.map((subject, index) => {
                    const theme = THEME_COLORS[index % THEME_COLORS.length];
                    return (
                        <div
                            key={subject.id}
                            className={`group relative bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-air-lg hover:-translate-y-1 transition-all duration-500 overflow-hidden cursor-pointer ${isAdmin && subject.userView !== 1 ? 'opacity-60 hover:opacity-100' : ''} ${theme.border}`}
                            onClick={() => {
                                if (editingId !== subject.id) {
                                    onSelectSubject(subject);
                                }
                            }}
                        >
                            {/* Themed Background Accent (Bento box style) */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${theme.blob} rounded-full -mr-16 -mt-16 opacity-40 blur-2xl group-hover:scale-150 transition-transform duration-700`} />

                            <div className="p-8 h-full flex flex-col relative z-10">
                                {/* Icon */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`w-14 h-14 rounded-2xl ${theme.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-50/50`}>
                                        <HiOutlineBookOpen size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-slate-500">
                                        Subject
                                    </span>
                                </div>

                                {/* Title */}
                                {editingId === subject.id ? (
                                    <div className="flex items-center gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
                                            autoFocus
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(e as any, subject.id); if (e.key === 'Escape') setEditingId(null); }}
                                        />
                                        <button onClick={(e) => handleSaveEdit(e, subject.id)} className="p-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700">
                                            <HiOutlineCheck size={16} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-100 hover:bg-slate-200">
                                            <HiOutlineXMark size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mb-8">
                                        <h3 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-current transition-colors line-clamp-2">
                                            {subject.name}
                                        </h3>
                                        {subject.keywords && (
                                            <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2">
                                                {subject.keywords}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${theme.text} transition-colors group-hover:gap-3`}>
                                        <span>View Modules</span>
                                        <HiOutlineArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    {/* Admin Controls */}
                                    {isAdmin && editingId !== subject.id && (
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => handleToggle(e, subject.id, subject.userView)}
                                                className={`p-2 rounded-xl transition-all ${subject.userView === 1 ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                title={subject.userView === 1 ? 'Published' : 'Hidden'}
                                            >
                                                {subject.userView === 1 ? <HiOutlineEye size={16} /> : <HiOutlineEyeSlash size={16} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (onPreviewSubject) onPreviewSubject(subject); }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="Preview Course Syllabus"
                                            >
                                                <HiOutlineDocumentText size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingId(subject.id); setEditName(subject.name); }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="Edit"
                                            >
                                                <HiOutlinePencil size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, subject.id)}
                                                disabled={deletingId === subject.id}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {deletingId === subject.id ? <HiOutlineArrowPath className="animate-spin" size={14} /> : <HiOutlineTrash size={14} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Status badge */}
                                {isAdmin && (
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${subject.userView === 1 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                            {subject.userView === 1 ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
