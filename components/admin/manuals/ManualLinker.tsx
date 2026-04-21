'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineArrowPath,
    HiOutlineChevronRight,
    HiOutlineLink,
    HiOutlineArrowsUpDown,
    HiOutlineDocumentText
} from 'react-icons/hi2';
import {
    linkModuleToSubject,
    unlinkModuleFromSubject,
    addTopicToModule,
    removeTopicFromModule,
    updateTopicSequenceOrder
} from '@/app/actions/admin-training-manuals';
import { getManualModules, getModuleTopicSequence } from '@/app/actions/training-manuals';

interface ManualLinkerProps {
    subjects: any[];
    moduleLib: any[];
    topicLib: any[];
}

export default function ManualLinker({ subjects, moduleLib, topicLib }: ManualLinkerProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [linkedModules, setLinkedModules] = useState<any[]>([]);
    const [selectedSubjectModuleId, setSelectedSubjectModuleId] = useState<string | null>(null);
    const [topicSequence, setTopicSequence] = useState<any[]>([]);

    const [loadingModules, setLoadingModules] = useState(false);
    const [loadingTopics, setLoadingTopics] = useState(false);

    // Module linking state
    const [moduleToLink, setModuleToLink] = useState('');
    // Topic linking state
    const [topicToLink, setTopicToLink] = useState('');

    // Fetch linked modules when subject changes
    useEffect(() => {
        if (!selectedSubjectId) {
            setLinkedModules([]);
            setSelectedSubjectModuleId(null);
            setTopicSequence([]);
            return;
        }
        setLoadingModules(true);
        setSelectedSubjectModuleId(null);
        setTopicSequence([]);
        getManualModules(selectedSubjectId).then((res) => {
            if (res.success && res.data) {
                setLinkedModules(res.data);
            }
            setLoadingModules(false);
        });
    }, [selectedSubjectId]);

    // Fetch topic sequence when module is selected
    useEffect(() => {
        if (!selectedSubjectModuleId) {
            setTopicSequence([]);
            return;
        }
        setLoadingTopics(true);
        getModuleTopicSequence(selectedSubjectModuleId).then((res) => {
            if (res.success && res.data) {
                setTopicSequence(res.data);
            }
            setLoadingTopics(false);
        });
    }, [selectedSubjectModuleId]);

    function refreshModules() {
        if (!selectedSubjectId) return;
        setLoadingModules(true);
        getManualModules(selectedSubjectId).then((res) => {
            if (res.success && res.data) setLinkedModules(res.data);
            setLoadingModules(false);
        });
    }

    function refreshTopics() {
        if (!selectedSubjectModuleId) return;
        setLoadingTopics(true);
        getModuleTopicSequence(selectedSubjectModuleId).then((res) => {
            if (res.success && res.data) setTopicSequence(res.data);
            setLoadingTopics(false);
        });
    }

    function handleLinkModule() {
        if (!selectedSubjectId || !moduleToLink) return;
        startTransition(async () => {
            const result = await linkModuleToSubject(selectedSubjectId, moduleToLink);
            if (result.error) {
                alert(result.error);
            } else {
                setModuleToLink('');
                refreshModules();
            }
        });
    }

    function handleUnlinkModule(subjectModuleId: string) {
        if (!confirm('Unlink this module from the subject? Topic links within will also be removed.')) return;
        startTransition(async () => {
            const result = await unlinkModuleFromSubject(subjectModuleId);
            if (result.error) {
                alert(result.error);
            } else {
                if (selectedSubjectModuleId === subjectModuleId) {
                    setSelectedSubjectModuleId(null);
                }
                refreshModules();
            }
        });
    }

    function handleAddTopic() {
        if (!selectedSubjectModuleId || !topicToLink) return;
        const nextSeq = topicSequence.length > 0 ? Math.max(...topicSequence.map(t => t.seq)) + 1 : 1;
        startTransition(async () => {
            const result = await addTopicToModule(selectedSubjectModuleId, topicToLink, nextSeq);
            if (result.error) {
                alert(result.error);
            } else {
                setTopicToLink('');
                refreshTopics();
            }
        });
    }

    function handleRemoveTopic(moduleTopicId: string) {
        startTransition(async () => {
            const result = await removeTopicFromModule(moduleTopicId);
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

    // Filter out already-linked modules
    const availableModules = moduleLib.filter(
        m => !linkedModules.some(lm => lm.moduleId === m.id)
    );

    // Filter out already-linked topics in the current module
    const availableTopics = topicLib.filter(
        t => !topicSequence.some(ts => ts.topicId === t.id)
    );

    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Subject Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700">① Select Subject</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {subjects.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedSubjectId(s.id)}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                                selectedSubjectId === s.id
                                    ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                                    : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent'
                            }`}
                        >
                            <span className="truncate">{s.name}</span>
                            {selectedSubjectId === s.id && <HiOutlineChevronRight size={14} />}
                        </button>
                    ))}
                    {subjects.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No subjects. Create one in the Subjects tab.
                        </div>
                    )}
                </div>
            </div>

            {/* Column 2: Linked Modules */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700">
                        ② Modules {selectedSubject ? `in "${selectedSubject.name}"` : ''}
                    </h3>
                </div>

                {selectedSubjectId ? (
                    <>
                        {/* Link new module */}
                        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                            <select
                                value={moduleToLink}
                                onChange={(e) => setModuleToLink(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="">Link a module...</option>
                                {availableModules.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <button onClick={handleLinkModule} disabled={!moduleToLink || isPending} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                                <HiOutlineLink size={16} />
                            </button>
                        </div>

                        {loadingModules ? (
                            <div className="p-8 text-center">
                                <HiOutlineArrowPath className="animate-spin mx-auto text-slate-400" size={24} />
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {linkedModules.map((lm) => (
                                    <div
                                        key={lm.id}
                                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                                            selectedSubjectModuleId === lm.id
                                                ? 'bg-emerald-50 border-l-4 border-emerald-500'
                                                : 'hover:bg-slate-50 border-l-4 border-transparent'
                                        }`}
                                        onClick={() => setSelectedSubjectModuleId(lm.id)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{lm.module.name}</p>
                                            {lm.module.moduleCode && <p className="text-xs text-slate-400 font-mono">{lm.module.moduleCode}</p>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {selectedSubjectModuleId === lm.id && <HiOutlineChevronRight size={14} className="text-emerald-600" />}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnlinkModule(lm.id); }}
                                                className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                                                title="Unlink module"
                                            >
                                                <HiOutlineTrash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {linkedModules.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No modules linked. Use the dropdown above.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        ← Select a subject first
                    </div>
                )}
            </div>

            {/* Column 3: Topic Sequence */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700">③ Topic Sequence</h3>
                </div>

                {selectedSubjectModuleId ? (
                    <>
                        {/* Add topic */}
                        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                            <select
                                value={topicToLink}
                                onChange={(e) => setTopicToLink(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="">Add a topic...</option>
                                {availableTopics.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button onClick={handleAddTopic} disabled={!topicToLink || isPending} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                <HiOutlinePlus size={16} />
                            </button>
                        </div>

                        {loadingTopics ? (
                            <div className="p-8 text-center">
                                <HiOutlineArrowPath className="animate-spin mx-auto text-slate-400" size={24} />
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {topicSequence.map((ts, index) => (
                                    <div key={ts.id} className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors">
                                        {/* Sequence number */}
                                        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </span>

                                        {/* Topic info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{ts.topic.name}</p>
                                            {ts.topic.pdfUrl && (
                                                <a href={ts.topic.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 truncate">
                                                    <HiOutlineDocumentText size={10} />
                                                    <span className="truncate">View PDF</span>
                                                </a>
                                            )}
                                        </div>

                                        {/* Reorder buttons */}
                                        <div className="flex flex-col gap-0.5 shrink-0">
                                            <button
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0 || isPending}
                                                className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                                            >
                                                <HiOutlineArrowsUpDown size={12} className="rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === topicSequence.length - 1 || isPending}
                                                className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                                            >
                                                <HiOutlineArrowsUpDown size={12} />
                                            </button>
                                        </div>

                                        {/* Remove */}
                                        <button
                                            onClick={() => handleRemoveTopic(ts.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors shrink-0"
                                            title="Remove topic"
                                        >
                                            <HiOutlineTrash size={14} />
                                        </button>
                                    </div>
                                ))}
                                {topicSequence.length === 0 && (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No topics yet. Use the dropdown above to add.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        ← Select a module first
                    </div>
                )}
            </div>
        </div>
    );
}
