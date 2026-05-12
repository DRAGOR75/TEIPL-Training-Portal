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
                <div className="bg-white rounded-3xl border border-slate-200 shadow-air overflow-hidden transition-all duration-500">
                    {/* Subject Header (Prominent & Integrated) */}
                    <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 text-blue-50/50 pointer-events-none">
                            <HiOutlineFolderOpen size={180} />
                        </div>
                        
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                                <HiOutlineFolderOpen size={32} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {subjectTree.name}
                                </h3>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1.5 flex items-center gap-2">
                                    {subjectTree.subjectModules.length} Modules Total
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Modules List (Full Width Rows) */}
                    <div className="divide-y divide-slate-100">
                        {subjectTree.subjectModules.length === 0 && (
                            <p className="text-sm text-slate-500 italic p-12 text-center bg-slate-50/30">No modules available for this subject.</p>
                        )}
                        {subjectTree.subjectModules.map((sm: any, mIdx: number) => (
                            <div key={sm.id} className="group">
                                {/* Module Header (Wide Row) */}
                                <div 
                                    onClick={() => toggleModule(sm.id)}
                                    className={`flex items-center gap-5 p-6 cursor-pointer transition-all select-none relative
                                        ${expandedModules[sm.id] ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'}
                                    `}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300
                                        ${expandedModules[sm.id] ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                                    `}>
                                        {mIdx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-lg font-bold tracking-tight transition-colors duration-300
                                            ${expandedModules[sm.id] ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}
                                        `}>
                                            {sm.module.name}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            {sm.module.moduleCode && (
                                                <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">
                                                    {sm.module.moduleCode}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                {sm.topics.length} Topics
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`transition-all duration-300 ${expandedModules[sm.id] ? 'text-blue-600 rotate-0' : 'text-slate-300 rotate-0'}`}>
                                        {expandedModules[sm.id] ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Module Content (Indented List for Topics) */}
                                {expandedModules[sm.id] && (
                                    <div className="bg-slate-50/30 pb-8 animate-in slide-in-from-top-2 duration-300">
                                        <div className="ml-11 mr-8 pl-8 border-l-2 border-slate-100 space-y-8 mt-2">
                                            {sm.topics.length === 0 && (
                                                <p className="text-sm text-slate-400 italic py-4">No topics available for this module.</p>
                                            )}
                                            {sm.topics.map((mt: any, tIdx: number) => (
                                                <div key={mt.id} className="relative pt-2 group/topic">
                                                    {/* Timeline Connector Dot */}
                                                    <div className="absolute -left-[37px] top-[18px] w-4 h-4 rounded-full bg-white border-4 border-slate-200 group-hover/topic:border-blue-400 transition-colors z-10" />
                                                    
                                                    <div className="flex items-start justify-between gap-6">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover/topic:bg-blue-600 group-hover/topic:text-white transition-all">
                                                                    <HiOutlineDocumentText size={16} />
                                                                </div>
                                                                <h5 className="text-[15px] font-bold text-slate-900 group-hover/topic:text-blue-700 transition-colors">
                                                                    {mt.topic.name}
                                                                </h5>
                                                            </div>
                                                            
                                                            {mt.topic.manualRef && (
                                                                <div className="mt-2 ml-11">
                                                                    <span className="text-[10px] text-slate-400 font-mono font-bold px-2 py-0.5 bg-white border border-slate-100 rounded shadow-sm">
                                                                        REF: {mt.topic.manualRef}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            
                                                            {mt.topic.content && (
                                                                <div className="mt-4 ml-11 text-sm text-slate-600 leading-relaxed font-medium bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                                                    <div className="absolute left-0 top-0 w-1 h-full bg-blue-100" />
                                                                    <div className="whitespace-pre-wrap">{mt.topic.content}</div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {mt.topic.pdfUrl && (
                                                            <a
                                                                href={mt.topic.pdfUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
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
