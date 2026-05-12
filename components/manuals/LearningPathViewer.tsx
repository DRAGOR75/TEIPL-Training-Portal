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

                                            {/* Subject item */}
                                            <div className="flex-1 mb-6 mt-2.5">
                                                <div
                                                    onClick={() => onSelectSubject?.(ps.subjectId)}
                                                    className="cursor-pointer group/subject"
                                                >
                                                    <p className="text-[15px] font-bold text-slate-900 group-hover/subject:text-violet-700 transition-colors flex items-center gap-2">
                                                        <div className="p-1 bg-violet-100 text-violet-600 rounded">
                                                            <HiOutlineBookOpen size={14} className="shrink-0" />
                                                        </div>
                                                        {ps.subject.name}
                                                    </p>

                                                    {/* Modules under this subject */}
                                                    {pathModules.length > 0 && (
                                                        <div className="mt-4 space-y-3 ml-7 border-l-2 border-violet-100/50 pl-4">
                                                            {pathModules.map((pm: any, mi: number) => (
                                                                <div key={pm.id} className="flex items-center gap-3 text-sm text-slate-600 group-hover/subject:text-slate-800 transition-colors">
                                                                    <span className="w-5 h-5 rounded-md bg-white border border-violet-200 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">{mi + 1}</span>
                                                                    <span className="font-medium truncate">{pm.module.name}</span>
                                                                    {pm.module.pdfUrl && (
                                                                        <a href={pm.module.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="ml-auto text-[10px] text-blue-600 font-bold flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md hover:bg-blue-600 hover:text-white transition-colors shrink-0 uppercase tracking-wider">
                                                                            <HiOutlineDocumentArrowDown size={12} /> PDF
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
