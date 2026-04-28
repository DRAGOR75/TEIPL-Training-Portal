'use client';

import { HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineUserGroup, HiOutlineRectangleGroup, HiOutlineDocumentArrowDown, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';

interface LearningPathViewerProps {
    learningPaths: any[];
    onSelectSubject?: (subjectId: number) => void;
}

const ROAD_COLORS = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-600', 'from-sky-500 to-cyan-600',
];

export default function LearningPathViewer({ learningPaths, onSelectSubject }: LearningPathViewerProps) {
    const activePaths = learningPaths.filter(p => p.status === 'Active');
    if (activePaths.length === 0) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
                <HiOutlineAcademicCap size={22} className="text-violet-600" />
                <h2 className="text-lg font-bold text-slate-800">Your Learning Roadmap</h2>
            </div>

            {activePaths.map((path) => (
                <div key={path.id} className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl border border-violet-200 overflow-hidden">
                    {/* Path Header */}
                    <div className="p-5 pb-3">
                        <h3 className="text-base font-bold text-violet-900">{path.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs text-violet-600"><HiOutlineUserGroup size={12} /> {path.groupName}</span>
                            <span className="text-xs text-violet-300">•</span>
                            <span className="text-xs text-violet-500">{path.subjects.length} stop{path.subjects.length !== 1 ? 's' : ''}</span>
                        </div>
                        {path.description && <p className="text-xs text-violet-600/70 mt-1">{path.description}</p>}
                    </div>

                    {/* Visual Road */}
                    <div className="px-5 pb-6">
                        <div className="relative ml-1">
                            {/* Road line */}
                            {path.subjects.length > 1 && (
                                <div className="absolute left-5 top-5 bottom-5 w-1 bg-gradient-to-b from-violet-300 via-purple-300 to-indigo-300 rounded-full" />
                            )}

                            <div className="space-y-0">
                                {path.subjects.map((ps: any, index: number) => {
                                    const color = ROAD_COLORS[index % ROAD_COLORS.length];
                                    const pathModules = ps.modules || [];

                                    return (
                                        <div key={ps.id} className="relative flex items-start gap-4 group">
                                            {/* Road node */}
                                            <div className={`relative z-10 w-11 h-11 rounded-full bg-gradient-to-br ${color} text-white text-sm font-black flex items-center justify-center shrink-0 shadow-lg ring-4 ring-violet-50 group-hover:scale-110 transition-transform`}>
                                                {index + 1}
                                            </div>

                                            {/* Subject card */}
                                            <div className="flex-1 mb-5">
                                                <div
                                                    onClick={() => onSelectSubject?.(ps.subjectId)}
                                                    className="bg-white rounded-xl border border-violet-100 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer p-4"
                                                >
                                                    <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors flex items-center gap-1.5">
                                                        <HiOutlineBookOpen size={14} className="text-violet-500 shrink-0" />
                                                        {ps.subject.name}
                                                    </p>

                                                    {/* Modules under this subject */}
                                                    {pathModules.length > 0 && (
                                                        <div className="mt-3 space-y-1.5 ml-5">
                                                            {pathModules.map((pm: any, mi: number) => (
                                                                <div key={pm.id} className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <span className="w-4 h-4 rounded bg-violet-100 text-violet-700 text-[9px] font-bold flex items-center justify-center shrink-0">{mi + 1}</span>
                                                                    <HiOutlineRectangleGroup size={11} className="text-violet-400 shrink-0" />
                                                                    <span className="truncate">{pm.module.name}</span>
                                                                    {pm.module.pdfUrl && (
                                                                        <a href={pm.module.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="ml-auto text-[10px] text-blue-600 font-bold flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 rounded hover:bg-blue-100 shrink-0">
                                                                            <HiOutlineDocumentArrowDown size={10} /> PDF
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
