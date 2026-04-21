'use client';

import {
    HiOutlineAcademicCap,
    HiOutlineBookOpen,
    HiOutlineUserGroup,
    HiOutlineCheckCircle
} from 'react-icons/hi2';

interface LearningPathViewerProps {
    learningPaths: any[];
    onSelectSubject?: (subjectId: number) => void;
}

export default function LearningPathViewer({ learningPaths, onSelectSubject }: LearningPathViewerProps) {
    if (learningPaths.length === 0) {
        return null;
    }

    const activePaths = learningPaths.filter(p => p.status === 'Active');

    if (activePaths.length === 0) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-2">
                <HiOutlineAcademicCap size={22} className="text-violet-600" />
                <h2 className="text-lg font-bold text-slate-800">Learning Paths</h2>
            </div>

            {activePaths.map((path) => (
                <div key={path.id} className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 overflow-hidden">
                    {/* Path Header */}
                    <div className="p-5 pb-3">
                        <h3 className="text-base font-bold text-violet-900">{path.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs text-violet-600">
                                <HiOutlineUserGroup size={12} />
                                {path.groupName}
                            </span>
                            <span className="text-xs text-violet-300">•</span>
                            <span className="text-xs text-violet-500">{path.subjects.length} subjects</span>
                        </div>
                        {path.description && (
                            <p className="text-xs text-violet-600/70 mt-1">{path.description}</p>
                        )}
                    </div>

                    {/* Subject Timeline */}
                    <div className="px-5 pb-5">
                        <div className="relative">
                            {/* Timeline Line */}
                            {path.subjects.length > 1 && (
                                <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-violet-200" />
                            )}

                            <div className="space-y-3">
                                {path.subjects.map((ps: any, index: number) => (
                                    <div
                                        key={ps.id}
                                        onClick={() => onSelectSubject?.(ps.subjectId)}
                                        className="relative flex items-center gap-4 bg-white rounded-xl p-3 border border-violet-100 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        {/* Timeline Node */}
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0 relative z-10 group-hover:scale-110 transition-transform">
                                            {index + 1}
                                        </div>

                                        {/* Subject Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors flex items-center gap-1.5">
                                                <HiOutlineBookOpen size={14} className="text-violet-500 shrink-0" />
                                                <span className="truncate">{ps.subject.name}</span>
                                            </p>
                                            {ps.subject.keywords && (
                                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 ml-5">{ps.subject.keywords}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
