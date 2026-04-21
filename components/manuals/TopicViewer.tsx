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
    HiOutlineDocumentArrowDown
} from 'react-icons/hi2';
import {
    addTopicToModule,
    removeTopicFromModule,
    updateTopicSequenceOrder,
    createAndLinkTopicToModule
} from '@/app/actions/admin-training-manuals';
import { getModuleTopicSequence } from '@/app/actions/training-manuals';

interface TopicViewerProps {
    subjectModuleId: string;
    moduleName: string;
    topicLib: any[];
    isAdmin: boolean;
}

export default function TopicViewer({ subjectModuleId, moduleName, topicLib, isAdmin }: TopicViewerProps) {
    const [isPending, startTransition] = useTransition();
    const [topicSequence, setTopicSequence] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [topicToLink, setTopicToLink] = useState('');
    const [mode, setMode] = useState<'link' | 'create'>('link');
    const [newTopicName, setNewTopicName] = useState('');
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

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
            const result = await createAndLinkTopicToModule(subjectModuleId, newTopicName, nextSeq);
            if (result.error) alert(result.error);
            else { setNewTopicName(''); refreshTopics(); }
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

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200" />
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
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Add Topic (Admin) */}
            {isAdmin && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 overflow-hidden">
                    <div className="flex border-b border-emerald-100">
                        <button
                            onClick={() => setMode('link')}
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${mode === 'link' ? 'bg-emerald-100 text-emerald-800' : 'text-emerald-500 hover:bg-white/50 hover:text-emerald-700'}`}
                        >
                            Add Existing Topic
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-2 text-sm font-bold transition-colors ${mode === 'create' ? 'bg-emerald-100 text-emerald-800' : 'text-emerald-500 hover:bg-white/50 hover:text-emerald-700'}`}
                        >
                            Create New Topic
                        </button>
                    </div>
                    
                    <div className="p-4 flex items-center gap-3">
                        {mode === 'link' ? (
                            <>
                                <HiOutlineDocumentText size={18} className="text-emerald-600 shrink-0" />
                                <select
                                    value={topicToLink}
                                    onChange={(e) => setTopicToLink(e.target.value)}
                                    className="flex-1 px-3 py-2.5 border border-emerald-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                                >
                                    <option value="">Add a topic to &quot;{moduleName}&quot;...</option>
                                    {availableTopics.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddTopic}
                                    disabled={!topicToLink || isPending}
                                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlinePlus size={16} />}
                                    Add Topic
                                </button>
                            </>
                        ) : (
                            <>
                                <HiOutlinePlus size={18} className="text-emerald-600 shrink-0" />
                                <input
                                    type="text"
                                    value={newTopicName}
                                    onChange={(e) => setNewTopicName(e.target.value)}
                                    placeholder="Enter new topic name..."
                                    className="flex-1 px-3 py-2.5 border border-emerald-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
                                />
                                <button
                                    onClick={handleCreateTopic}
                                    disabled={!newTopicName.trim() || isPending}
                                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? <HiOutlineArrowPath className="animate-spin" size={16} /> : <HiOutlinePlus size={16} />}
                                    Create & Add
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Topic List */}
            {topicSequence.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineDocumentText size={28} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No Topics Yet</h3>
                    <p className="text-slate-500 text-sm">
                        {isAdmin ? 'Use the bar above to add topics to this module.' : 'Topics for this module haven\'t been added yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {topicSequence.map((ts, index) => (
                        <div
                            key={ts.id}
                            className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                            <div className="flex items-center gap-4 p-4">
                                {/* Step Number */}
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 text-sm font-black flex items-center justify-center shrink-0">
                                    {index + 1}
                                </div>

                                {/* Topic Info */}
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => setExpandedTopic(expandedTopic === ts.id ? null : ts.id)}
                                >
                                    <p className="text-sm font-bold text-slate-800">{ts.topic.name}</p>
                                    {ts.topic.manualRef && (
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {ts.topic.manualRef}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* PDF Link */}
                                    {ts.topic.pdfUrl && (
                                        <a
                                            href={ts.topic.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                                        >
                                            <HiOutlineDocumentArrowDown size={14} />
                                            PDF
                                            <HiOutlineArrowTopRightOnSquare size={10} />
                                        </a>
                                    )}

                                    {/* Admin: Reorder + Remove */}
                                    {isAdmin && (
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                            <button
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0 || isPending}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-20 transition-colors"
                                            >
                                                <HiOutlineChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === topicSequence.length - 1 || isPending}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-20 transition-colors"
                                            >
                                                <HiOutlineChevronDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(ts.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove"
                                            >
                                                <HiOutlineTrash size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedTopic === ts.id && ts.topic.content && (
                                <div className="px-4 pb-4 pt-0 ml-13 border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">
                                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-3">
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
