'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    HiOutlineDocumentText,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineArrowPath,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineDocumentArrowDown,
    HiOutlinePencil,
    HiOutlineArrowLeft,
    HiOutlineRectangleGroup,
} from 'react-icons/hi2';
import {
    addTopicToModule,
    removeTopicFromModule,
    updateTopicSequenceOrder,
    createAndLinkTopicToModule,
    updateManualTopic
} from '@/app/actions/admin-training-manuals';
import { getModuleTopicSequence } from '@/app/actions/training-manuals';

interface TopicViewerProps {
    subjectModuleId: string;
    moduleName: string;
    subjectName: string;
    topicLib: any[];
    isAdmin: boolean;
    searchQuery?: string;
    onBack: () => void;
}

export default function TopicViewer({ subjectModuleId, moduleName, subjectName, topicLib, isAdmin, searchQuery = '', onBack }: TopicViewerProps) {
    const [isPending, startTransition] = useTransition();
    const [topicSequence, setTopicSequence] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [topicToLink, setTopicToLink] = useState('');
    const [mode, setMode] = useState<'link' | 'create'>('link');
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicPdf, setNewTopicPdf] = useState('');
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

    // Edit Topic
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPdf, setEditPdf] = useState('');
    const [editRef, setEditRef] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        setLoading(true);
        getModuleTopicSequence(subjectModuleId).then((res) => {
            if (res.success && res.data) setTopicSequence(res.data);
            setLoading(false);
        });
    }, [subjectModuleId]);

    function refreshTopics() {
        setLoading(true);
        getModuleTopicSequence(subjectModuleId).then((res) => {
            if (res.success && res.data) setTopicSequence(res.data);
            setLoading(false);
        });
    }

    function handleAddTopic() {
        if (!topicToLink) return;
        const nextSeq = topicSequence.length > 0 ? Math.max(...topicSequence.map(t => t.seq)) + 1 : 1;
        startTransition(async () => {
            const result = await addTopicToModule(subjectModuleId, topicToLink, nextSeq);
            if (result.error) alert(result.error);
            else { setTopicToLink(''); refreshTopics(); }
        });
    }

    function handleCreateTopic() {
        if (!newTopicName.trim()) return;
        const nextSeq = topicSequence.length > 0 ? Math.max(...topicSequence.map(t => t.seq)) + 1 : 1;
        startTransition(async () => {
            const result = await createAndLinkTopicToModule(subjectModuleId, newTopicName, nextSeq, newTopicPdf);
            if (result.error) alert(result.error);
            else { setNewTopicName(''); setNewTopicPdf(''); refreshTopics(); }
        });
    }

    function startEditTopic(e: React.MouseEvent, t: any) {
        e.stopPropagation();
        setEditingTopicId(t.id);
        setEditName(t.name);
        setEditPdf(t.pdfUrl || '');
        setEditRef(t.manualRef || '');
        setEditContent(t.content || '');
    }

    function handleUpdateTopic(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        if (!editName.trim()) return;
        startTransition(async () => {
            const result = await updateManualTopic(id, { name: editName.trim(), pdfUrl: editPdf.trim(), manualRef: editRef.trim(), content: editContent.trim() });
            if (result.error) alert(result.error);
            else {
                setEditingTopicId(null);
                refreshTopics();
            }
        });
    }

    function handleRemove(id: string) {
        if (!confirm('Remove this topic from the sequence?')) return;
        startTransition(async () => {
            const result = await removeTopicFromModule(id);
            if (result.error) alert(result.error);
            else refreshTopics();
        });
    }

    function handleMoveUp(index: number) {
        if (index === 0) return;
        const newSeq = [...topicSequence];
        [newSeq[index - 1], newSeq[index]] = [newSeq[index], newSeq[index - 1]];
        const updates = newSeq.map((item, i) => ({ id: item.id, seq: i + 1 }));
        startTransition(async () => {
            await updateTopicSequenceOrder(updates);
            refreshTopics();
        });
    }

    function handleMoveDown(index: number) {
        if (index >= topicSequence.length - 1) return;
        const newSeq = [...topicSequence];
        [newSeq[index], newSeq[index + 1]] = [newSeq[index + 1], newSeq[index]];
        const updates = newSeq.map((item, i) => ({ id: item.id, seq: i + 1 }));
        startTransition(async () => {
            await updateTopicSequenceOrder(updates);
            refreshTopics();
        });
    }

    const availableTopics = topicLib.filter(
        t => !topicSequence.some(ts => ts.topicId === t.id)
    );

    // Filter topics by search
    const filteredTopics = searchQuery
        ? topicSequence.filter(ts =>
            ts.topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ts.topic.manualRef || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : topicSequence;

    if (loading) {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-64 mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-40" />
                </div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200" />
                            <div className="flex-1">
                                <div className="h-4 bg-slate-200 rounded w-56 mb-2" />
                                <div className="h-3 bg-slate-100 rounded w-32" />
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
                        title="Back to modules"
                    >
                        <HiOutlineArrowLeft size={20} />
                    </button>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                        <HiOutlineRectangleGroup size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black text-slate-900 truncate tracking-tight">{moduleName}</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            {topicSequence.length} topic{topicSequence.length !== 1 ? 's' : ''} · {subjectName}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Add Topic (Admin) ───────────────────────────── */}
            {isAdmin && (
                <div className="bg-slate-50 rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="flex border-b border-slate-200 bg-white/50">
                        <button
                            onClick={() => setMode('link')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'link' ? 'bg-white text-blue-700 shadow-sm border-b-2 border-blue-600' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600'}`}
                        >
                            Add Existing Topic
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'create' ? 'bg-white text-blue-700 shadow-sm border-b-2 border-blue-600' : 'text-slate-500 hover:bg-white/80 hover:text-blue-600'}`}
                        >
                            Create New Topic
                        </button>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        {mode === 'link' ? (
                            <div className="flex items-center gap-3">
                                <HiOutlineDocumentText size={18} className="text-blue-500 shrink-0" />
                                <select
                                    value={topicToLink}
                                    onChange={(e) => setTopicToLink(e.target.value)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                                >
                                    <option value="">Add a topic to &quot;{moduleName}&quot;...</option>
                                    {availableTopics.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddTopic}
                                    disabled={!topicToLink || isPending}
                                    className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlinePlus size={16} />}
                                    Add
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <HiOutlinePlus size={18} className="text-blue-500 shrink-0" />
                                    <input
                                        type="text"
                                        value={newTopicName}
                                        onChange={(e) => setNewTopicName(e.target.value)}
                                        placeholder="Enter new topic name..."
                                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
                                    />
                                    <button
                                        onClick={handleCreateTopic}
                                        disabled={!newTopicName.trim() || isPending}
                                        className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlinePlus size={16} />}
                                        Create & Add
                                    </button>
                                </div>
                                <div className="ml-8 pl-1">
                                    <input
                                        type="text"
                                        value={newTopicPdf}
                                        onChange={(e) => setNewTopicPdf(e.target.value)}
                                        placeholder="PDF URL (optional)"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Topic List ──────────────────────────────────── */}
            {filteredTopics.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineDocumentText size={28} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">
                        {searchQuery ? 'No Matching Topics' : 'No Topics Yet'}
                    </h3>
                    <p className="text-slate-500 text-sm">
                        {searchQuery
                            ? 'Try a different search term.'
                            : isAdmin ? 'Use the toolbar above to add topics to this module.' : 'Topics for this module haven\'t been added yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTopics.map((ts, index) => (
                        <div
                            key={ts.id}
                            className="group bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-air-md hover:border-blue-300 transition-all duration-300 overflow-hidden"
                        >
                            <div className="flex items-center gap-5 p-5">
                                {/* Step Number */}
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-black text-sm shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100 shadow-sm">
                                    {index + 1}
                                </div>

                                {/* Topic Info */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => setExpandedTopic(expandedTopic === ts.id ? null : ts.id)}
                                >
                                    {editingTopicId === ts.topic.id ? (
                                        <div className="space-y-3 py-1" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                    placeholder="Topic Name"
                                                    autoFocus
                                                />
                                                <input
                                                    value={editRef}
                                                    onChange={(e) => setEditRef(e.target.value)}
                                                    className="w-28 px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                    placeholder="Ref"
                                                />
                                            </div>
                                            <input
                                                value={editPdf}
                                                onChange={(e) => setEditPdf(e.target.value)}
                                                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none"
                                                placeholder="PDF URL"
                                            />
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                                                placeholder="Content"
                                                rows={3}
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={(e) => handleUpdateTopic(e, ts.topic.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingTopicId(null); }}
                                                    className="px-4 py-2 text-slate-500 bg-slate-100 text-xs font-bold hover:bg-slate-200 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors">{ts.topic.name}</p>
                                            {ts.topic.manualRef && (
                                                <p className="text-xs text-slate-400 font-mono font-bold mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">Ref: {ts.topic.manualRef}</p>
                                            )}
                                            {ts.topic.content && (
                                                <p className="text-sm font-medium text-blue-500 mt-2 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                                    {expandedTopic === ts.id ? 'Click to collapse ▲' : 'Click to expand content ▼'}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* PDF Link */}
                                    {ts.topic.pdfUrl && !editingTopicId && (
                                        <a
                                            href={ts.topic.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                                        >
                                            <HiOutlineDocumentArrowDown size={16} />
                                            PDF
                                            <HiOutlineArrowTopRightOnSquare size={12} />
                                        </a>
                                    )}

                                    {/* Admin: Edit + Reorder + Remove — always visible */}
                                    {isAdmin && !editingTopicId && (
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => startEditTopic(e, ts.topic)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                title="Edit topic"
                                            >
                                                <HiOutlinePencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0 || isPending}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 transition-colors"
                                            >
                                                <HiOutlineChevronUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === topicSequence.length - 1 || isPending}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 transition-colors"
                                            >
                                                <HiOutlineChevronDown size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(ts.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Remove"
                                            >
                                                <HiOutlineTrash size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedTopic === ts.id && ts.topic.content && (
                                <div className="px-5 pb-5 pt-0 border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">
                                    <div className="bg-slate-50 rounded-[1rem] p-5 text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap mt-4 ml-16 shadow-sm border border-slate-100">
                                        {ts.topic.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
