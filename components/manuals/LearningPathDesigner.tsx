'use client';

import { useState, useTransition } from 'react';
import {
    HiOutlineAcademicCap, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
    HiOutlineCheck, HiOutlineXMark, HiOutlineArrowPath, HiOutlineBookOpen,
    HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineUserGroup,
    HiOutlineSparkles, HiOutlineRectangleGroup, HiOutlineDocumentText,
} from 'react-icons/hi2';
import {
    createLearningPath, updateLearningPath, deleteLearningPath,
    addSubjectToPath, removeSubjectFromPath, reorderPathSubjects,
    addModuleToPathSubject, removeModuleFromPathSubject, reorderPathModules,
} from '@/app/actions/learning-paths';

interface LearningPathDesignerProps {
    learningPaths: any[];
    subjects: any[];
    moduleLib?: any[];
}

export default function LearningPathDesigner({ learningPaths, subjects, moduleLib = [] }: LearningPathDesignerProps) {
    const [isPending, startTransition] = useTransition();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newGroup, setNewGroup] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editGroup, setEditGroup] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [subjectToAdd, setSubjectToAdd] = useState('');
    const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
    const [moduleToAdd, setModuleToAdd] = useState('');

    function handleCreate() {
        if (!newName.trim() || !newGroup.trim()) return;
        startTransition(async () => {
            const result = await createLearningPath({ name: newName.trim(), groupName: newGroup.trim(), description: newDesc.trim() || undefined });
            if (result.error) alert(result.error);
            else { setNewName(''); setNewGroup(''); setNewDesc(''); setShowCreate(false); }
        });
    }

    function handleDelete(id: string) {
        if (!confirm('Delete this learning path?')) return;
        startTransition(async () => { const r = await deleteLearningPath(id); if (r.error) alert(r.error); });
    }

    function handleUpdate(id: string) {
        startTransition(async () => {
            const r = await updateLearningPath(id, { name: editName, groupName: editGroup, description: editDesc });
            if (r.error) alert(r.error); else setEditingId(null);
        });
    }

    function handleToggleStatus(id: string, status: string) {
        startTransition(async () => { await updateLearningPath(id, { status: status === 'Active' ? 'Draft' : 'Active' }); });
    }

    function handleAddSubject(pathId: string) {
        if (!subjectToAdd) return;
        const path = learningPaths.find(p => p.id === pathId);
        const nextSeq = path?.subjects?.length > 0 ? Math.max(...path.subjects.map((s: any) => s.seq)) + 1 : 1;
        startTransition(async () => {
            const r = await addSubjectToPath(pathId, parseInt(subjectToAdd), nextSeq);
            if (r.error) alert(r.error); else setSubjectToAdd('');
        });
    }

    function handleRemoveSubject(id: string) {
        startTransition(async () => { const r = await removeSubjectFromPath(id); if (r.error) alert(r.error); });
    }

    function handleMoveSubject(pathId: string, pathSubjects: any[], index: number, dir: 'up' | 'down') {
        const arr = [...pathSubjects];
        if (dir === 'up' && index > 0) [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        else if (dir === 'down' && index < arr.length - 1) [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        startTransition(async () => { await reorderPathSubjects(arr.map((item, i) => ({ id: item.id, seq: i + 1 }))); });
    }

    function handleAddModule(psId: string, modules: any[]) {
        if (!moduleToAdd) return;
        const nextSeq = modules.length > 0 ? Math.max(...modules.map((m: any) => m.seq)) + 1 : 1;
        startTransition(async () => {
            const r = await addModuleToPathSubject(psId, moduleToAdd, nextSeq);
            if (r.error) alert(r.error); else setModuleToAdd('');
        });
    }

    function handleRemoveModule(id: string) {
        startTransition(async () => { const r = await removeModuleFromPathSubject(id); if (r.error) alert(r.error); });
    }

    function handleMoveModule(modules: any[], index: number, dir: 'up' | 'down') {
        const arr = [...modules];
        if (dir === 'up' && index > 0) [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        else if (dir === 'down' && index < arr.length - 1) [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        startTransition(async () => { await reorderPathModules(arr.map((item, i) => ({ id: item.id, seq: i + 1 }))); });
    }

    const STATUS_STYLES: Record<string, string> = {
        Draft: 'bg-amber-100 text-amber-700', Active: 'bg-emerald-100 text-emerald-700', Archived: 'bg-slate-100 text-slate-600',
    };

    const ROAD_COLORS = [
        'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
        'from-orange-500 to-red-500', 'from-pink-500 to-rose-600', 'from-sky-500 to-cyan-600',
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <HiOutlineAcademicCap size={22} className="text-violet-600" />
                        Learning Paths
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Design curated learning roadmaps for different groups</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all flex items-center gap-2 shadow-sm">
                    <HiOutlinePlus size={16} /> New Path
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-5 animate-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-bold text-violet-800 mb-3 flex items-center gap-2"><HiOutlineSparkles size={16} /> Create Learning Path</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Path name (e.g., Inplant Batch 2026)" className="px-4 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none" autoFocus />
                            <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="Group name (e.g., Technicians)" className="px-4 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none" />
                        </div>
                        <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-4 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none resize-none" />
                        <div className="flex items-center gap-2">
                            <button onClick={handleCreate} disabled={isPending || !newName.trim() || !newGroup.trim()} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
                                {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlineCheck size={16} />} Create
                            </button>
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-slate-500 text-sm font-medium">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Path List */}
            {learningPaths.length === 0 && !showCreate ? (
                <div className="py-16 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-violet-50 flex items-center justify-center mx-auto mb-6">
                        <HiOutlineAcademicCap size={36} className="text-violet-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Learning Paths Yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Create your first learning path to build a roadmap.</p>
                    <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700">Create First Path</button>
                </div>
            ) : (
                <div className="space-y-6">
                    {learningPaths.map((path) => {
                        const isExpanded = expandedPathId === path.id;
                        const isEditing = editingId === path.id;
                        const availableSubjects = subjects.filter((s: any) => !path.subjects.some((ps: any) => ps.subjectId === s.id));

                        return (
                            <div key={path.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Path Header */}
                                <div className="p-5 cursor-pointer" onClick={() => setExpandedPathId(isExpanded ? null : path.id)}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                                                <HiOutlineAcademicCap size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                {isEditing ? (
                                                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-1.5 border border-violet-300 rounded-lg text-sm" />
                                                        <input value={editGroup} onChange={(e) => setEditGroup(e.target.value)} className="w-full px-3 py-1.5 border border-violet-300 rounded-lg text-sm" placeholder="Group" />
                                                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full px-3 py-1.5 border border-violet-300 rounded-lg text-sm resize-none" placeholder="Description" />
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleUpdate(path.id)} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold">Save</button>
                                                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-slate-500 text-xs">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="text-base font-bold text-slate-800 truncate">{path.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="flex items-center gap-1 text-xs text-slate-500"><HiOutlineUserGroup size={12} /> {path.groupName}</span>
                                                            <span className="text-xs text-slate-300">•</span>
                                                            <span className="text-xs text-slate-400">{path.subjects.length} stop{path.subjects.length !== 1 ? 's' : ''}</span>
                                                        </div>
                                                        {path.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{path.description}</p>}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleToggleStatus(path.id, path.status)} className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 ${STATUS_STYLES[path.status] || STATUS_STYLES.Draft}`}>{path.status}</button>
                                            <button onClick={() => { setEditingId(path.id); setEditName(path.name); setEditGroup(path.groupName); setEditDesc(path.description || ''); }} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"><HiOutlinePencil size={14} /></button>
                                            <button onClick={() => handleDelete(path.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><HiOutlineTrash size={14} /></button>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Expanded: Visual Roadmap ───────────────── */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white p-6 animate-in slide-in-from-top-2 duration-300">
                                        {/* Road Timeline */}
                                        <div className="relative ml-1">
                                            {/* The Road Line */}
                                            {path.subjects.length > 0 && (
                                                <div className="absolute left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-300 via-purple-300 to-indigo-300 rounded-full" />
                                            )}

                                            <div className="space-y-0">
                                                {path.subjects.map((ps: any, index: number) => {
                                                    const isSubExpanded = expandedSubjectId === ps.id;
                                                    const color = ROAD_COLORS[index % ROAD_COLORS.length];
                                                    const pathModules = ps.modules || [];
                                                    const availableModules = moduleLib.filter((m: any) => !pathModules.some((pm: any) => pm.moduleId === m.id));

                                                    return (
                                                        <div key={ps.id} className="relative">
                                                            {/* Road Node */}
                                                            <div className="flex items-start gap-4 group">
                                                                {/* Circle Node on the road */}
                                                                <div className={`relative z-10 w-11 h-11 rounded-full bg-gradient-to-br ${color} text-white text-sm font-black flex items-center justify-center shrink-0 shadow-lg ring-4 ring-white group-hover:scale-110 transition-transform`}>
                                                                    {index + 1}
                                                                </div>

                                                                {/* Subject Card */}
                                                                <div className="flex-1 mb-6">
                                                                    <div
                                                                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all cursor-pointer overflow-hidden"
                                                                        onClick={() => setExpandedSubjectId(isSubExpanded ? null : ps.id)}
                                                                    >
                                                                        <div className="p-4 flex items-center gap-3">
                                                                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} bg-opacity-10 flex items-center justify-center`}>
                                                                                <HiOutlineBookOpen size={16} className="text-white" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-bold text-slate-800 truncate">{ps.subject.name}</p>
                                                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                                                    {pathModules.length} module{pathModules.length !== 1 ? 's' : ''} assigned
                                                                                </p>
                                                                            </div>

                                                                            {/* Admin controls — always visible */}
                                                                            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                                                <button onClick={() => handleMoveSubject(path.id, path.subjects, index, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg disabled:opacity-20"><HiOutlineChevronUp size={14} /></button>
                                                                                <button onClick={() => handleMoveSubject(path.id, path.subjects, index, 'down')} disabled={index === path.subjects.length - 1} className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg disabled:opacity-20"><HiOutlineChevronDown size={14} /></button>
                                                                                <button onClick={() => handleRemoveSubject(ps.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><HiOutlineTrash size={14} /></button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Expanded: Modules for this subject in this path */}
                                                                        {isSubExpanded && (
                                                                            <div className="border-t border-slate-100 bg-violet-50/30 p-4 space-y-3 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                                                                                {/* Module list */}
                                                                                {pathModules.length > 0 ? (
                                                                                    <div className="space-y-2">
                                                                                        {pathModules.map((pm: any, mi: number) => (
                                                                                            <div key={pm.id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2.5 group/mod hover:border-violet-200 transition-colors">
                                                                                                <div className="w-6 h-6 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">{mi + 1}</div>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <p className="text-xs font-semibold text-slate-700 truncate flex items-center gap-1.5">
                                                                                                        <HiOutlineRectangleGroup size={12} className="text-violet-500 shrink-0" />
                                                                                                        {pm.module.name}
                                                                                                    </p>
                                                                                                    {pm.module.moduleCode && <span className="text-[10px] text-slate-400 font-mono ml-5">{pm.module.moduleCode}</span>}
                                                                                                </div>
                                                                                                {pm.module.pdfUrl && (
                                                                                                    <a href={pm.module.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold px-2 py-0.5 bg-blue-50 rounded hover:bg-blue-100">📄 PDF</a>
                                                                                                )}
                                                                                                <div className="flex items-center gap-0.5 opacity-60 group-hover/mod:opacity-100 transition-opacity">
                                                                                                    <button onClick={() => handleMoveModule(pathModules, mi, 'up')} disabled={mi === 0} className="p-1 text-slate-400 hover:text-violet-600 disabled:opacity-20"><HiOutlineChevronUp size={12} /></button>
                                                                                                    <button onClick={() => handleMoveModule(pathModules, mi, 'down')} disabled={mi === pathModules.length - 1} className="p-1 text-slate-400 hover:text-violet-600 disabled:opacity-20"><HiOutlineChevronDown size={12} /></button>
                                                                                                    <button onClick={() => handleRemoveModule(pm.id)} className="p-1 text-slate-300 hover:text-red-500"><HiOutlineTrash size={12} /></button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-xs text-slate-400 italic text-center py-2">No modules assigned to this Program</p>
                                                                                )}

                                                                                {/* Add module */}
                                                                                <div className="flex items-center gap-2">
                                                                                    <select value={moduleToAdd} onChange={(e) => setModuleToAdd(e.target.value)} className="flex-1 px-3 py-2 border border-violet-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-violet-400 outline-none">
                                                                                        <option value="">Add a module...</option>
                                                                                        {availableModules.map((m: any) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                                                                                    </select>
                                                                                    <button onClick={() => handleAddModule(ps.id, pathModules)} disabled={!moduleToAdd || isPending} className="px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 disabled:opacity-50">
                                                                                        <HiOutlinePlus size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Add Subject  */}
                                            <div className="flex items-center gap-4 relative">
                                                <div className="relative z-10 w-11 h-11 rounded-full border-2 border-dashed border-violet-300 bg-white flex items-center justify-center text-violet-400 shrink-0">
                                                    <HiOutlinePlus size={18} />
                                                </div>
                                                <div className="flex-1 flex items-center gap-2">
                                                    <select value={subjectToAdd} onChange={(e) => setSubjectToAdd(e.target.value)} className="flex-1 px-3 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none">
                                                        <option value="">Add next program.</option>
                                                        {availableSubjects.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                                    </select>
                                                    <button onClick={() => handleAddSubject(path.id)} disabled={!subjectToAdd || isPending} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-50">
                                                        <HiOutlinePlus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
