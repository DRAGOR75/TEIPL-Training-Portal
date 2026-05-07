'use client';

import { useState, useEffect } from 'react';
import { 
    HiOutlineChevronDown, 
    HiOutlineChevronUp, 
    HiOutlineBookOpen,
    HiOutlineFolderOpen,
    HiOutlineSquares2X2,
    HiOutlineDocumentText,
    HiOutlineDocumentArrowDown,
    HiOutlineArrowTopRightOnSquare
} from 'react-icons/hi2';

interface ManualOverviewProps {
    subjectTree: any;
}

export default function ManualOverview({ subjectTree }: ManualOverviewProps) {
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    // Initialize all modules to expanded by default
    useEffect(() => {
        if (subjectTree) {
            const newModules: Record<string, boolean> = {};
            subjectTree.subjectModules.forEach((sm: any) => {
                newModules[sm.id] = true;
            });
            setExpandedModules(newModules);
        }
    }, [subjectTree]);

    const toggleModule = (id: string) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        if (!subjectTree) return;
        const newModules: Record<string, boolean> = {};
        subjectTree.subjectModules.forEach((sm: any) => {
            newModules[sm.id] = true;
        });
        setExpandedModules(newModules);
    };

    const collapseAll = () => {
        setExpandedModules({});
    };

    if (!subjectTree) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header / Controls */}
            <div className="flex items-center justify-between bg-white rounded-[1.5rem] p-5 border border-slate-200 shadow-air">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <HiOutlineBookOpen className="text-blue-600" size={24} />
                        Course Syllabus
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Comprehensive overview of all training modules and topics.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={expandAll}
                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Tree View */}
            <div className="space-y-4">
                <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                    {/* Subject Header (Always visible/expanded) */}
                    <div className="flex items-center gap-4 p-5 bg-slate-50 border-b border-slate-100 select-none">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-sm border border-blue-200 shrink-0">
                            <HiOutlineFolderOpen size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                {subjectTree.name}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">
                                {subjectTree.subjectModules.length} Modules
                            </p>
                        </div>
                    </div>

                    {/* Subject Modules (Level 2) */}
                    <div className="bg-slate-50/50 p-4 space-y-3">
                        {subjectTree.subjectModules.length === 0 && (
                            <p className="text-sm text-slate-500 italic p-4 text-center">No modules available for this subject.</p>
                        )}
                        {subjectTree.subjectModules.map((sm: any, mIdx: number) => (
                                    <div key={sm.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        {/* Module Header */}
                                        <div 
                                            onClick={() => toggleModule(sm.id)}
                                            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors select-none group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 shrink-0 group-hover:bg-slate-200 transition-colors">
                                                <HiOutlineSquares2X2 size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-md font-bold text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
                                                    {mIdx + 1}. {sm.module.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {sm.module.moduleCode && (
                                                        <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                                            {sm.module.moduleCode}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-500 font-medium">{sm.topics.length} Topics</span>
                                                </div>
                                            </div>
                                            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                                {expandedModules[sm.id] ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                                            </div>
                                        </div>

                                        {/* Module Topics (Level 3) */}
                                        {expandedModules[sm.id] && (
                                            <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                                                {sm.topics.length === 0 && (
                                                    <p className="text-sm text-slate-500 italic p-2 text-center">No topics available for this module.</p>
                                                )}
                                                {sm.topics.map((mt: any, tIdx: number) => (
                                                    <div key={mt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                <div className="mt-0.5">
                                                                    <HiOutlineDocumentText className="text-blue-500" size={20} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="text-sm font-bold text-slate-900">
                                                                        {mIdx + 1}.{tIdx + 1} {mt.topic.name}
                                                                    </h5>
                                                                    {mt.topic.manualRef && (
                                                                        <span className="inline-block mt-1 text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                            Ref: {mt.topic.manualRef}
                                                                        </span>
                                                                    )}
                                                                    
                                                                    {/* Full Content Inline */}
                                                                    {mt.topic.content && (
                                                                        <div className="mt-3 text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-inner">
                                                                            {mt.topic.content}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* PDF Link */}
                                                            {mt.topic.pdfUrl && (
                                                                <a
                                                                    href={mt.topic.pdfUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors border border-blue-100 shadow-sm"
                                                                >
                                                                    <HiOutlineDocumentArrowDown size={14} />
                                                                    PDF
                                                                    <HiOutlineArrowTopRightOnSquare size={10} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
