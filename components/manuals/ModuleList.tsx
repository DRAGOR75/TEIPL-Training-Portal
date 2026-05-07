'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    HiOutlineRectangleGroup,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineArrowPath,
    HiOutlineChevronRight,
    HiOutlineLink,
    HiOutlineDocumentText,
    HiOutlinePencil,
    HiOutlineArrowLeft,
    HiOutlineBookOpen,
} from 'react-icons/hi2';
import {
    linkModuleToSubject,
    unlinkModuleFromSubject,
    createAndLinkModuleToSubject,
    updateManualModule,
} from '@/app/actions/admin-training-manuals';
import { getManualModules } from '@/app/actions/training-manuals';

interface ModuleListProps {
    subjectId: number;
    subjectName: string;
    moduleLib: any[];
    topicLib: any[];
    isAdmin: boolean;
    searchQuery?: string;
    onSelectModule: (subjectModule: any) => void;
    onPreview?: () => void;
    onBack: () => void;
}

export default function ModuleList({ subjectId, subjectName, moduleLib, topicLib, isAdmin, searchQuery = '', onSelectModule, onPreview, onBack }: ModuleListProps) {
    const [isPending, startTransition] = useTransition();
    const [linkedModules, setLinkedModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [moduleToLink, setModuleToLink] = useState('');
    const [mode, setMode] = useState<'link' | 'create'>('link');
    const [newModuleName, setNewModuleName] = useState('');
    const [newModulePdf, setNewModulePdf] = useState('');

    // Edit Module
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCode, setEditCode] = useState('');
    const [editPdf, setEditPdf] = useState('');

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
            const result = await createAndLinkModuleToSubject(subjectId, newModuleName, newModulePdf);
            if (result.error) alert(result.error);
            else { setNewModuleName(''); setNewModulePdf(''); refreshModules(); }
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

    function startEditModule(e: React.MouseEvent, m: any) {
        e.stopPropagation();
        setEditingModuleId(m.id);
        setEditName(m.name);
        setEditCode(m.moduleCode || '');
        setEditPdf(m.pdfUrl || '');
    }

    function handleUpdateModule(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        if (!editName.trim()) return;
        startTransition(async () => {
            const result = await updateManualModule(id, { name: editName.trim(), moduleCode: editCode.trim(), pdfUrl: editPdf.trim() });
            if (result.error) alert(result.error);
            else {
                setEditingModuleId(null);
                refreshModules();
            }
        });
    }

    const availableModules = moduleLib.filter(
        m => !linkedModules.some(lm => lm.moduleId === m.id)
    );

    // Filter modules by search
    const filteredModules = searchQuery
        ? linkedModules.filter(lm =>
            lm.module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lm.module.moduleCode || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : linkedModules;

    if (loading) {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                {/* Header skeleton */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-64 mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-40" />
                </div>
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
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* ── Header ──────────────────────────────────────── */}
            <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-air p-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Back to subjects"
                    >
                        <HiOutlineArrowLeft size={20} />
                    </button>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                        <HiOutlineBookOpen size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black text-slate-900 truncate tracking-tight">{subjectName}</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">{linkedModules.length} module{linkedModules.length !== 1 ? 's' : ''} in this subject</p>
                    </div>

                    {/* Preview Button */}
                    {onPreview && (
                        <button
                            onClick={onPreview}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                        >
                            <HiOutlineBookOpen size={18} />
                            Preview Syllabus
                        </button>
                    )}
                </div>
            </div>

            {/* ── Add/Link Module (Admin) ──────────────────────── */}
            {isAdmin && (
                <div className="bg-slate-50 rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="flex border-b border-slate-200 bg-white/50">
                        <button
                            onClick={() => setMode('link')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'link' ? 'bg-white text-blue-700 shadow-sm border-b-2 border-blue-600' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600'}`}
                        >
                            Link Existing Module
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'create' ? 'bg-white text-blue-700 shadow-sm border-b-2 border-blue-600' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600'}`}
                        >
                            Create New Module
                        </button>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        {mode === 'link' ? (
                            <div className="flex items-center gap-3">
                                <HiOutlineLink size={18} className="text-blue-500 shrink-0" />
                                <select
                                    value={moduleToLink}
                                    onChange={(e) => setModuleToLink(e.target.value)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                                >
                                    <option value="">Link a module to &quot;{subjectName}&quot;...</option>
                                    {availableModules.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleLinkModule}
                                    disabled={!moduleToLink || isPending}
                                    className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlineLink size={16} />}
                                    Link
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <HiOutlinePlus size={18} className="text-blue-500 shrink-0" />
                                    <input
                                        type="text"
                                        value={newModuleName}
                                        onChange={(e) => setNewModuleName(e.target.value)}
                                        placeholder="Enter new module name..."
                                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
                                    />
                                    <button
                                        onClick={handleCreateModule}
                                        disabled={!newModuleName.trim() || isPending}
                                        className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlinePlus size={16} />}
                                        Create & Link
                                    </button>
                                </div>
                                <div className="ml-8 pl-1">
                                    <input
                                        type="text"
                                        value={newModulePdf}
                                        onChange={(e) => setNewModulePdf(e.target.value)}
                                        placeholder="PDF URL (optional)"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Module List ─────────────────────────────────── */}
            {filteredModules.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineRectangleGroup size={28} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">
                        {searchQuery ? 'No Matching Modules' : 'No Modules Yet'}
                    </h3>
                    <p className="text-slate-500 text-sm">
                        {searchQuery
                            ? 'Try a different search term.'
                            : isAdmin ? 'Use the toolbar above to add modules to this subject.' : 'Modules for this subject haven\'t been added yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredModules.map((lm, index) => (
                        <div
                            key={lm.id}
                            className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-air-md hover:border-blue-300 transition-all duration-300 overflow-hidden cursor-pointer"
                            onClick={() => {
                                if (!editingModuleId) onSelectModule(lm);
                            }}
                        >
                            <div className="flex items-center gap-5 p-5">
                                {/* Index */}
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-black text-sm shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100 shadow-sm">
                                    {index + 1}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    {editingModuleId === lm.module.id ? (
                                        <div className="space-y-3 py-1" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                    placeholder="Module Name"
                                                    autoFocus
                                                />
                                                <input
                                                    value={editCode}
                                                    onChange={(e) => setEditCode(e.target.value)}
                                                    className="w-28 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                    placeholder="Code"
                                                />
                                            </div>
                                            <input
                                                value={editPdf}
                                                onChange={(e) => setEditPdf(e.target.value)}
                                                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                placeholder="PDF URL"
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={(e) => handleUpdateModule(e, lm.module.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingModuleId(null); }}
                                                    className="px-4 py-2 text-slate-500 bg-slate-100 text-xs font-bold hover:bg-slate-200 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate tracking-tight">
                                                    {lm.module.name}
                                                </h3>
                                                {lm.module.pdfUrl && (
                                                    <a
                                                        href={lm.module.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors shadow-sm border border-blue-100"
                                                    >
                                                        📄 PDF
                                                    </a>
                                                )}
                                            </div>
                                            {lm.module.moduleCode && (
                                                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{lm.module.moduleCode}</span>
                                            )}
                                            {lm.description && (
                                                <p className="text-sm font-medium text-slate-500 mt-2 line-clamp-1">{lm.description}</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {!editingModuleId && (
                                        <div className="flex items-center gap-1.5 text-sm text-blue-500 font-bold group-hover:text-blue-700 transition-colors">
                                            <HiOutlineDocumentText size={18} />
                                            <span className="hidden sm:inline">Topics</span>
                                            <HiOutlineChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}

                                    {/* Admin controls — always visible */}
                                    {isAdmin && !editingModuleId && (
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => startEditModule(e, lm.module)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="Edit module"
                                            >
                                                <HiOutlinePencil size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleUnlink(e, lm.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Unlink module"
                                            >
                                                <HiOutlineTrash size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
