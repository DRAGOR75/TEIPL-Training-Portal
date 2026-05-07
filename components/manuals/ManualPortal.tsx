'use client';

import { useState } from 'react';
import {
    HiOutlineBookOpen,
    HiOutlineAcademicCap,
    HiOutlineMagnifyingGlass,
    HiOutlineShieldCheck,
    HiOutlineBars3,
    HiOutlineXMark,
    HiOutlineChevronRight,
    HiOutlineHome,
    HiOutlineRectangleGroup,
    HiOutlineDocumentText,
    HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
import SubjectGrid from './SubjectGrid';
import ModuleList from './ModuleList';
import TopicViewer from './TopicViewer';
import LearningPathDesigner from './LearningPathDesigner';
import LearningPathViewer from './LearningPathViewer';
import ManualOverview from './ManualOverview';

type View = 'overview' | 'subjects' | 'subject-detail' | 'module-detail' | 'learning-paths';

interface ManualPortalProps {
    subjects: any[];
    fullTree?: any[];
    moduleLib: any[];
    topicLib: any[];
    learningPaths: any[];
    isAdmin: boolean;
    userName?: string;
}

export default function ManualPortal({ subjects, fullTree = [], moduleLib, topicLib, learningPaths, isAdmin, userName }: ManualPortalProps) {
    const [currentView, setCurrentView] = useState<View>('subjects');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Navigation state
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [selectedModule, setSelectedModule] = useState<any>(null); // SubjectModule bridge row

    // ── Navigation ──────────────────────────────────────────────
    function goToSubjects() {
        setCurrentView('subjects');
        setSelectedSubject(null);
        setSelectedModule(null);
        setSidebarOpen(false);
    }

    function goToSubjectDetail(subject: any) {
        setSelectedSubject(subject);
        setSelectedModule(null);
        setCurrentView('subject-detail');
        setSearchQuery('');
    }

    function goToModuleDetail(subjectModule: any) {
        setSelectedModule(subjectModule);
        setCurrentView('module-detail');
        setSearchQuery('');
    }

    function goToSubjectOverview(subject: any) {
        setSelectedSubject(subject);
        setCurrentView('overview');
        setSearchQuery('');
    }

    function renderBreadcrumbs() {
        const crumbs: { label: string; onClick?: () => void; icon?: any }[] = [
            { label: 'Training Library', onClick: goToSubjects, icon: HiOutlineHome },
        ];

        if (currentView === 'subject-detail' && selectedSubject) {
            crumbs.push({ label: selectedSubject.name });
        } else if (currentView === 'overview' && selectedSubject) {
            crumbs.push({ label: `${selectedSubject.name} (Syllabus)` });
        } else if (currentView === 'module-detail' && selectedSubject && selectedModule) {
            crumbs.push({ label: selectedSubject.name, onClick: () => goToSubjectDetail(selectedSubject) });
            crumbs.push({ label: selectedModule.module?.name || 'Module' });
        } else if (currentView === 'learning-paths') {
            crumbs.push({ label: 'Learning Paths' });
        }

        return (
            <nav className="flex items-center gap-1.5 text-sm mb-6 animate-in fade-in slide-in-from-left-2 duration-300 flex-wrap">
                {crumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <HiOutlineChevronRight size={12} className="text-slate-300 mx-0.5" />}
                        {crumb.onClick ? (
                            <button
                                onClick={crumb.onClick}
                                className="text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline underline-offset-2 flex items-center gap-1"
                            >
                                {crumb.icon && <crumb.icon size={14} className="-mt-0.5" />}
                                {crumb.label}
                            </button>
                        ) : (
                            <span className="text-slate-800 font-bold flex items-center gap-1">
                                {crumb.icon && <crumb.icon size={14} className="-mt-0.5" />}
                                {crumb.label}
                            </span>
                        )}
                    </span>
                ))}
            </nav>
        );
    }

    // ── Cross-level search results ──────────────────────────────
    function renderSearchResults() {
        if (!searchQuery.trim() || currentView !== 'subjects') return null;
        const q = searchQuery.toLowerCase();

        const matchingModules = moduleLib.filter(m =>
            m.name.toLowerCase().includes(q) || (m.moduleCode || '').toLowerCase().includes(q)
        );
        const matchingTopics = topicLib.filter(t =>
            t.name.toLowerCase().includes(q) || (t.manualRef || '').toLowerCase().includes(q)
        );

        if (matchingModules.length === 0 && matchingTopics.length === 0) return null;

        return (
            <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                {matchingModules.length > 0 && (
                    <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-air overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-blue-50/50">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                                <HiOutlineRectangleGroup size={14} />
                                Matching Modules ({matchingModules.length})
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {matchingModules.slice(0, 8).map(m => (
                                <div key={m.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{m.name}</p>
                                        {m.moduleCode && <span className="text-[10px] text-slate-400 font-mono">{m.moduleCode}</span>}
                                    </div>
                                    {m.pdfUrl && (
                                        <a href={m.pdfUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-[10px] text-blue-600 font-bold flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                                            📄 PDF <HiOutlineArrowTopRightOnSquare size={8} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {matchingTopics.length > 0 && (
                    <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-air overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-emerald-50/50">
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                                <HiOutlineDocumentText size={14} />
                                Matching Topics ({matchingTopics.length})
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {matchingTopics.slice(0, 8).map(t => (
                                <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {t.manualRef && <span className="text-[10px] text-slate-400 font-mono">Ref: {t.manualRef}</span>}
                                        </div>
                                    </div>
                                    {t.pdfUrl && (
                                        <a href={t.pdfUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-[10px] text-blue-600 font-bold flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                                            📄 PDF <HiOutlineArrowTopRightOnSquare size={8} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Sidebar items ───────────────────────────────────────────
    const sidebarItems = [
        { id: 'subjects' as View, label: isAdmin ? 'Training Library (Edit)' : 'Training Library', icon: HiOutlineBookOpen, count: subjects.length },
        { id: 'learning-paths' as View, label: 'Learning Paths', icon: HiOutlineAcademicCap, count: learningPaths.length },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 text-slate-900 pt-6 pb-6">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <HiOutlineBookOpen size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                                    Training <span className="text-blue-600">Library</span>
                                </h1>
                                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                                    {isAdmin ? 'Admin Portal — Full Content Management' : 'Browse training materials & learning paths'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                {sidebarOpen ? <HiOutlineXMark size={20} /> : <HiOutlineBars3 size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-6 max-w-xl">
                        <div className="relative">
                            <HiOutlineMagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search subjects, modules, topics..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex gap-6">
                {/* Sidebar */}
                <aside className={`
                    ${sidebarOpen ? 'fixed inset-0 z-40 bg-black/50 lg:relative lg:inset-auto lg:z-auto lg:bg-transparent' : 'hidden lg:block'}
                    lg:w-64 lg:shrink-0
                `}>
                    <div className={`
                        ${sidebarOpen ? 'fixed right-0 top-0 h-full w-72 bg-white shadow-2xl p-4 animate-in slide-in-from-right duration-300 z-50' : ''}
                        lg:relative lg:right-auto lg:top-auto lg:h-auto lg:w-auto lg:shadow-none lg:p-0 lg:animate-none
                    `}>
                        {sidebarOpen && (
                            <div className="lg:hidden flex justify-end mb-4">
                                <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                                    <HiOutlineXMark size={20} />
                                </button>
                            </div>
                        )}

                        <div className="sticky top-24">
                            <nav className="bg-white rounded-[1.5rem] border border-slate-200 shadow-air overflow-hidden p-2">
                                <div className="p-3 border-b border-slate-100 mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</span>
                                </div>
                                <div className="space-y-1">
                                    {sidebarItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                if (item.id === 'subjects') goToSubjects();
                                                else setCurrentView(item.id);
                                                setSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                                                (currentView === item.id || (item.id === 'subjects' && (currentView === 'subject-detail' || currentView === 'module-detail')))
                                                    ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                                            }`}
                                        >
                                            <item.icon size={18} className={
                                                (currentView === item.id || (item.id === 'subjects' && (currentView === 'subject-detail' || currentView === 'module-detail')))
                                                    ? 'text-blue-600' : 'text-slate-400'
                                            } />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {item.count !== undefined && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                    (currentView === item.id || (item.id === 'subjects' && (currentView === 'subject-detail' || currentView === 'module-detail')))
                                                        ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                    {item.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </nav>
                        </div>
                    </div>
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Breadcrumbs — always show except on root subjects/overview view */}
                    {currentView !== 'subjects' && currentView !== 'overview' && renderBreadcrumbs()}

                    {/* ── Overview View ─────────────────────────── */}
                    {currentView === 'overview' && selectedSubject && (
                        <ManualOverview 
                            subjectTree={fullTree.find(s => s.id === selectedSubject.id)} 
                        />
                    )}

                    {/* ── Subjects View ─────────────────────────── */}
                    {currentView === 'subjects' && (
                        <div className="space-y-6">
                            {!isAdmin && learningPaths.length > 0 && (
                                <LearningPathViewer
                                    learningPaths={learningPaths}
                                    onSelectSubject={(id) => {
                                        const subj = subjects.find(s => s.id === id);
                                        if (subj) goToSubjectDetail(subj);
                                    }}
                                />
                            )}

                            <SubjectGrid
                                subjects={subjects}
                                isAdmin={isAdmin}
                                searchQuery={searchQuery}
                                onSelectSubject={!isAdmin ? goToSubjectOverview : goToSubjectDetail}
                                onPreviewSubject={goToSubjectOverview}
                            />

                            {/* Cross-level search results */}
                            {renderSearchResults()}
                        </div>
                    )}

                    {/* ── Subject Detail View (Modules) ────────── */}
                    {currentView === 'subject-detail' && selectedSubject && (
                        <ModuleList
                            subjectId={selectedSubject.id}
                            subjectName={selectedSubject.name}
                            moduleLib={moduleLib}
                            topicLib={topicLib}
                            isAdmin={isAdmin}
                            searchQuery={searchQuery}
                            onSelectModule={goToModuleDetail}
                            onPreview={() => goToSubjectOverview(selectedSubject)}
                            onBack={() => goToSubjects()}
                        />
                    )}

                    {/* ── Module Detail View (Topics) ──────────── */}
                    {currentView === 'module-detail' && selectedModule && selectedSubject && (
                        <TopicViewer
                            subjectModuleId={selectedModule.id}
                            moduleName={selectedModule.module?.name || 'Module'}
                            subjectName={selectedSubject.name}
                            topicLib={topicLib}
                            isAdmin={isAdmin}
                            searchQuery={searchQuery}
                            onBack={() => goToSubjectDetail(selectedSubject)}
                        />
                    )}

                    {/* ── Learning Paths View ──────────────────── */}
                    {currentView === 'learning-paths' && (
                        isAdmin ? (
                            <LearningPathDesigner
                                learningPaths={learningPaths}
                                subjects={subjects}
                                moduleLib={moduleLib}
                            />
                        ) : (
                            <LearningPathViewer
                                learningPaths={learningPaths}
                                onSelectSubject={(id) => {
                                    const subj = subjects.find(s => s.id === id);
                                    if (subj) goToSubjectDetail(subj);
                                }}
                            />
                        )
                    )}
                </main>
            </div>
        </div>
    );
}
