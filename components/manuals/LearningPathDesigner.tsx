'use client';

import { useState, useTransition } from 'react';
import {
    HiOutlineAcademicCap,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineArrowPath,
    HiOutlineBookOpen,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineUserGroup,
    HiOutlineSparkles
} from 'react-icons/hi2';
import {
    createLearningPath,
    updateLearningPath,
    deleteLearningPath,
    addSubjectToPath,
    removeSubjectFromPath,
    reorderPathSubjects
} from '@/app/actions/learning-paths';

interface LearningPathDesignerProps {
    learningPaths: any[];
    subjects: any[];
}

export default function LearningPathDesigner({ learningPaths, subjects }: LearningPathDesignerProps) {
    const [isPending, startTransition] = useTransition();

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newGroup, setNewGroup] = useState('');
    const [newDesc, setNewNameDesc] = useState('');

    // Expanded path
    const [expandedPathId, setExpandedPathId] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editGroup, setEditGroup] = useState('');
    const [editDesc, setEditDesc] = useState('');

    // Add subject to path
    const [subjectToAdd, setSubjectToAdd] = useState('');

    function handleCreate() {
        if (!newName.trim() || !newGroup.trim()) return;
        startTransition(async () => {
            const result = await createLearningPath({
                name: newName.trim(),
                groupName: newGroup.trim(),
                description: newDesc.trim() || undefined
            });
            if (result.error) alert(result.error);
            else { setNewName(''); setNewGroup(''); setNewNameDesc(''); setShowCreate(false); }
        });
    }

    function handleDelete(id: string) {
        if (!confirm('Delete this learning path? This cannot be undone.')) return;
        startTransition(async () => {
            const result = await deleteLearningPath(id);
            if (result.error) alert(result.error);
        });
    }

    function handleUpdate(id: string) {
        startTransition(async () => {
            const result = await updateLearningPath(id, { name: editName, groupName: editGroup, description: editDesc });
            if (result.error) alert(result.error);
            else setEditingId(null);
        });
    }

    function handleToggleStatus(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'Active' ? 'Draft' : 'Active';
        startTransition(async () => {
            const result = await updateLearningPath(id, { status: newStatus });
            if (result.error) alert(result.error);
        });
    }

    function handleAddSubject(pathId: string) {
        if (!subjectToAdd) return;
        const path = learningPaths.find(p => p.id === pathId);
        const nextSeq = path?.subjects?.length > 0 ? Math.max(...path.subjects.map((s: any) => s.seq)) + 1 : 1;
        startTransition(async () => {
            const result = await addSubjectToPath(pathId, parseInt(subjectToAdd), nextSeq);
            if (result.error) alert(result.error);
            else setSubjectToAdd('');
        });
    }

    function handleRemoveSubject(id: string) {
        startTransition(async () => {
            const result = await removeSubjectFromPath(id);
            if (result.error) alert(result.error);
        });
    }

    function handleMoveSubject(pathId: string, pathSubjects: any[], index: number, direction: 'up' | 'down') {
        const newArr = [...pathSubjects];
        if (direction === 'up' && index > 0) {
            [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        } else if (direction === 'down' && index < newArr.length - 1) {
            [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
        }
        const updates = newArr.map((item, i) => ({ id: item.id, seq: i + 1 }));
        startTransition(async () => {
            await reorderPathSubjects(updates);
        });
    }

    const STATUS_STYLES: Record<string, string> = {
        Draft: 'bg-amber-100 text-amber-700',
        Active: 'bg-emerald-100 text-emerald-700',
        Archived: 'bg-slate-100 text-slate-600',
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <HiOutlineAcademicCap size={22} className="text-violet-600" />
                        Learning Paths
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Design curated subject collections for different groups</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all flex items-center gap-2 shadow-sm"
                >
                    <HiOutlinePlus size={16} />
                    New Path
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-5 animate-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-bold text-violet-800 mb-3 flex items-center gap-2">
                        <HiOutlineSparkles size={16} />
                        Create Learning Path
                    </h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Path name (e.g., Inplant Batch 2026)"
                                className="px-4 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none"
                                autoFocus
                            />
                            <input
                                value={newGroup}
                                onChange={(e) => setNewGroup(e.target.value)}
                                placeholder="Group name (e.g., Technicians)"
                                className="px-4 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none"
                            />
                        </div>
                        <textarea
                            value={newDesc}
                            onChange={(e) => setNewNameDesc(e.target.value)}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full px-4 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none resize-none"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCreate}
                                disabled={isPending || !newName.trim() || !newGroup.trim()}
                                className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlineCheck size={16} />}
                                Create
                            </button>
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium">
                                Cancel
                            </button>
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
                    <p className="text-slate-500 text-sm mb-4">Create your first learning path to designate subject collections for groups.</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all"
                    >
                        Create First Path
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {learningPaths.map((path) => {
                        const isExpanded = expandedPathId === path.id;
                        const isEditing = editingId === path.id;
                        const availableSubjects = subjects.filter(
                            (s: any) => !path.subjects.some((ps: any) => ps.subjectId === s.id)
                        );

                        return (
                            <div key={path.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                {/* Path Header */}
                                <div
                                    className="p-5 cursor-pointer"
                                    onClick={() => setExpandedPathId(isExpanded ? null : path.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                                                <HiOutlineAcademicCap size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                {isEditing ? (
                                                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-1.5 border border-violet-300 rounded-lg text-sm bg-violet-50/50 focus:ring-2 focus:ring-violet-400 outline-none" />
                                                        <input value={editGroup} onChange={(e) => setEditGroup(e.target.value)} className="w-full px-3 py-1.5 border border-violet-300 rounded-lg text-sm bg-violet-50/50 focus:ring-2 focus:ring-violet-400 outline-none" placeholder="Group name" />
                                                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="w-full px-3 py-1.5 border border-violet-300 rounded-lg text-sm bg-violet-50/50 focus:ring-2 focus:ring-violet-400 outline-none resize-none" placeholder="Description" />
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleUpdate(path.id)} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold">Save</button>
                                                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-slate-500 text-xs font-medium">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="text-base font-bold text-slate-800 truncate">{path.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                                <HiOutlineUserGroup size={12} />
                                                                {path.groupName}
                                                            </span>
                                                            <span className="text-xs text-slate-300">•</span>
                                                            <span className="text-xs text-slate-400">{path.subjects.length} subjects</span>
                                                        </div>
                                                        {path.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{path.description}</p>}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleToggleStatus(path.id, path.status)}
                                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer hover:opacity-80 ${STATUS_STYLES[path.status] || STATUS_STYLES.Draft}`}
                                            >
                                                {path.status}
                                            </button>
                                            <button
                                                onClick={() => { setEditingId(path.id); setEditName(path.name); setEditGroup(path.groupName); setEditDesc(path.description || ''); }}
                                                className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            >
                                                <HiOutlinePencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(path.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <HiOutlineTrash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded: Subject Assignment */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 p-5 bg-slate-50/50 animate-in slide-in-from-top-1 duration-200">
                                        {/* Add Subject */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <select
                                                value={subjectToAdd}
                                                onChange={(e) => setSubjectToAdd(e.target.value)}
                                                className="flex-1 px-3 py-2.5 border border-violet-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-violet-400 outline-none"
                                            >
                                                <option value="">Add a subject to this path...</option>
                                                {availableSubjects.map((s: any) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleAddSubject(path.id)}
                                                disabled={!subjectToAdd || isPending}
                                                className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-50"
                                            >
                                                <HiOutlinePlus size={16} />
                                            </button>
                                        </div>

                                        {/* Subject List */}
                                        {path.subjects.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400 text-sm">
                                                No subjects assigned. Use the dropdown above to add.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {path.subjects.map((ps: any, index: number) => (
                                                    <div key={ps.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 group hover:border-violet-200 transition-colors">
                                                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                                                <HiOutlineBookOpen size={14} className="text-violet-500" />
                                                                {ps.subject.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleMoveSubject(path.id, path.subjects, index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-violet-600 disabled:opacity-20"><HiOutlineChevronUp size={14} /></button>
                                                            <button onClick={() => handleMoveSubject(path.id, path.subjects, index, 'down')} disabled={index === path.subjects.length - 1} className="p-1 text-slate-400 hover:text-violet-600 disabled:opacity-20"><HiOutlineChevronDown size={14} /></button>
                                                            <button onClick={() => handleRemoveSubject(ps.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><HiOutlineTrash size={14} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
