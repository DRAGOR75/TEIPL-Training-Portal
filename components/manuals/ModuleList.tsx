'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    HiOutlineRectangleGroup,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineArrowPath,
    HiOutlineChevronRight,
    HiOutlineLink,
    HiOutlineDocumentText
} from 'react-icons/hi2';
import {
    linkModuleToSubject,
    unlinkModuleFromSubject,
    createAndLinkModuleToSubject,
} from '@/app/actions/admin-training-manuals';
import { getManualModules } from '@/app/actions/training-manuals';
import TopicViewer from './TopicViewer';

interface ModuleListProps {
    subjectId: number;
    subjectName: string;
    moduleLib: any[];
    topicLib: any[];
    isAdmin: boolean;
}

export default function ModuleList({ subjectId, subjectName, moduleLib, topicLib, isAdmin }: ModuleListProps) {
    const [isPending, startTransition] = useTransition();
    const [linkedModules, setLinkedModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [moduleToLink, setModuleToLink] = useState('');
    const [mode, setMode] = useState<'link' | 'create'>('link');
    const [newModuleName, setNewModuleName] = useState('');
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getManualModules(subjectId).then((res) => {
            if (res.success && res.data) setLinkedModules(res.data);
            setLoading(false);
        });
    }, [subjectId]);

    function refreshModules() {
        setLoading(true);
        getManualModules(subjectId).then((res) => {
            if (res.success && res.data) setLinkedModules(res.data);
            setLoading(false);
        });
    }

    function handleLinkModule() {
        if (!moduleToLink) return;
        startTransition(async () => {
            const result = await linkModuleToSubject(subjectId, moduleToLink);
            if (result.error) alert(result.error);
            else { setModuleToLink(''); refreshModules(); }
        });
    }

    function handleCreateModule() {
        if (!newModuleName.trim()) return;
        startTransition(async () => {
            const result = await createAndLinkModuleToSubject(subjectId, newModuleName);
            if (result.error) alert(result.error);
            else { setNewModuleName(''); refreshModules(); }
        });
    }

    function handleUnlink(e: React.MouseEvent, subjectModuleId: string) {
        e.stopPropagation();
        if (!confirm('Unlink this module? Topic links within will also be removed.')) return;
        startTransition(async () => {
            const result = await unlinkModuleFromSubject(subjectModuleId);
            if (result.error) alert(result.error);
            else refreshModules();
        });
    }

    const availableModules = moduleLib.filter(
        m => !linkedModules.some(lm => lm.moduleId === m.id)
    );

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200" />
                            <div className="flex-1">
                                <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                                <div className="h-3 bg-slate-100 rounded w-24" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Add/Link Module (Admin) */}
            {isAdmin && (
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200 overflow-hidden">
                    <div className="flex border-b border-indigo-100">
                        <button
                            onClick={() => setMode('link')}
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${mode === 'link' ? 'bg-indigo-100 text-indigo-800' : 'text-indigo-400 hover:bg-white/50 hover:text-indigo-600'}`}
                        >
                            Link Existing Module
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${mode === 'create' ? 'bg-indigo-100 text-indigo-800' : 'text-indigo-400 hover:bg-white/50 hover:text-indigo-600'}`}
                        >
                            Create New Module
                        </button>
                    </div>
                    
                    <div className="p-4 flex items-center gap-3">
                        {mode === 'link' ? (
                            <>
                                <HiOutlineLink size={18} className="text-indigo-500 shrink-0" />
                                <select
                                    value={moduleToLink}
                                    onChange={(e) => setModuleToLink(e.target.value)}
                                    className="flex-1 px-3 py-2.5 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                >
                                    <option value="">Link a module to &quot;{subjectName}&quot;...</option>
                                    {availableModules.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleLinkModule}
                                    disabled={!moduleToLink || isPending}
                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlineLink size={16} />}
                                    Link
                                </button>
                            </>
                        ) : (
                            <>
                                <HiOutlinePlus size={18} className="text-indigo-500 shrink-0" />
                                <input
                                    type="text"
                                    value={newModuleName}
                                    onChange={(e) => setNewModuleName(e.target.value)}
                                    placeholder="Enter new module name..."
                                    className="flex-1 px-3 py-2.5 border border-indigo-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
                                />
                                <button
                                    onClick={handleCreateModule}
                                    disabled={!newModuleName.trim() || isPending}
                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlinePlus size={16} />}
                                    Create & Link
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Module List */}
            {linkedModules.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineRectangleGroup size={28} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No Modules Yet</h3>
                    <p className="text-slate-500 text-sm">
                        {isAdmin ? 'Use the link bar above to add modules to this subject.' : 'Modules for this subject haven\'t been added yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {linkedModules.map((lm, index) => (
                        <div key={lm.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden">
                            <div
                                onClick={() => setExpandedModuleId(expandedModuleId === lm.id ? null : lm.id)}
                                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50"
                            >
                                {/* Index */}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0 group-hover:from-indigo-200 group-hover:to-violet-200 transition-colors">
                                    {index + 1}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                                        {lm.module.name}
                                    </h3>
                                    {lm.module.moduleCode && (
                                        <span className="text-xs font-mono text-slate-400">{lm.module.moduleCode}</span>
                                    )}
                                    {lm.description && (
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{lm.description}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 text-sm text-indigo-500 font-medium">
                                        <HiOutlineDocumentText size={16} />
                                        <span className="hidden sm:inline">View Topics</span>
                                        <HiOutlineChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={(e) => handleUnlink(e, lm.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Unlink module"
                                        >
                                            <HiOutlineTrash size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Nested Topic Viewer inline */}
                            {expandedModuleId === lm.id && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                    <TopicViewer
                                        subjectModuleId={lm.id}
                                        moduleName={lm.module.name}
                                        topicLib={topicLib}
                                        isAdmin={isAdmin}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
