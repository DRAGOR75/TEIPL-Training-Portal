'use client';

import { useState } from 'react';
import {
    HiOutlineBookOpen,
    HiOutlineAcademicCap,
    HiOutlineMagnifyingGlass,
    HiOutlineRectangleGroup,
    HiOutlineDocumentText,
    HiOutlinePlusCircle,
    HiOutlineShieldCheck,
    HiOutlineBars3,
    HiOutlineXMark
} from 'react-icons/hi2';
import ManualBreadcrumb, { BreadcrumbItem } from './ManualBreadcrumb';
import SubjectGrid from './SubjectGrid';
import ModuleList from './ModuleList';
import TopicViewer from './TopicViewer';
import LearningPathDesigner from './LearningPathDesigner';
import LearningPathViewer from './LearningPathViewer';

type View = 'subjects' | 'learning-paths' | 'manage-subjects' | 'manage-modules' | 'manage-topics';

interface ManualPortalProps {
    subjects: any[];
    moduleLib: any[];
    topicLib: any[];
    learningPaths: any[];
    isAdmin: boolean;
    userName?: string;
}

export default function ManualPortal({ subjects, moduleLib, topicLib, learningPaths, isAdmin, userName }: ManualPortalProps) {
    const [currentView, setCurrentView] = useState<View>('subjects');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Navigation helpers
    function goToSubjects() {
        setCurrentView('subjects');
        setSidebarOpen(false);
    }

    // Build breadcrumbs
    function getBreadcrumbs(): BreadcrumbItem[] {
        const crumbs: BreadcrumbItem[] = [{ label: 'Subjects', onClick: goToSubjects }];

        if (currentView === 'learning-paths') {
            crumbs.push({ label: 'Learning Paths' });
        } else if (currentView === 'manage-subjects' || currentView === 'manage-modules' || currentView === 'manage-topics') {
            crumbs.push({ label: 'Content Manager' });
        }

        return crumbs;
    }

    // Sidebar items
    const sidebarItems = [
        { id: 'subjects' as View, label: 'Browse Subjects', icon: HiOutlineBookOpen, count: subjects.length },
        { id: 'learning-paths' as View, label: 'Learning Paths', icon: HiOutlineAcademicCap, count: learningPaths.length, adminOnly: false },
    ];

    if (isAdmin) {
        sidebarItems.push(
            { id: 'manage-subjects' as View, label: 'Manage Subjects', icon: HiOutlineRectangleGroup, count: subjects.length, adminOnly: true },
            { id: 'manage-modules' as View, label: 'Manage Modules', icon: HiOutlineDocumentText, count: moduleLib.length, adminOnly: true },
            { id: 'manage-topics' as View, label: 'Manage Topics', icon: HiOutlinePlusCircle, count: topicLib.length, adminOnly: true },
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 text-white">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                                <HiOutlineBookOpen size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Training Manuals</h1>
                                <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">
                                    {isAdmin ? 'Admin Portal — Full Content Management' : 'Browse training materials & learning paths'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Role Badge */}
                            {isAdmin && (
                                <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <HiOutlineShieldCheck size={14} />
                                    Admin
                                </span>
                            )}
                            {userName && (
                                <span className="hidden sm:block text-xs text-indigo-200">{userName}</span>
                            )}
                            {/* Mobile sidebar toggle */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                            >
                                {sidebarOpen ? <HiOutlineXMark size={20} /> : <HiOutlineBars3 size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4 max-w-xl">
                        <div className="relative">
                            <HiOutlineMagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search subjects, modules, topics..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder:text-indigo-300 focus:ring-2 focus:ring-white/30 outline-none transition-all"
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
                        {/* Mobile close button */}
                        {sidebarOpen && (
                            <div className="lg:hidden flex justify-end mb-4">
                                <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                                    <HiOutlineXMark size={20} />
                                </button>
                            </div>
                        )}

                        <div className="sticky top-24">
                            <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-3 border-b border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
                                </div>
                                <div className="p-1.5">
                                    {sidebarItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setCurrentView(item.id); setSidebarOpen(false); if (item.id === 'subjects') goToSubjects(); }}
                                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm transition-all ${currentView === item.id
                                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                                                }`}
                                        >
                                            <item.icon size={18} className={currentView === item.id ? 'text-indigo-600' : 'text-slate-400'} />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {item.count !== undefined && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${currentView === item.id ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {item.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {isAdmin && (
                                    <>
                                        <div className="p-3 border-t border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Tools</span>
                                        </div>
                                        <div className="p-1.5 pt-0">
                                            {sidebarItems.filter(i => i.adminOnly).map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }}
                                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm transition-all ${currentView === item.id
                                                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                            : 'text-slate-600 hover:bg-slate-50 font-medium'
                                                        }`}
                                                >
                                                    <item.icon size={18} className={currentView === item.id ? 'text-indigo-600' : 'text-slate-400'} />
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    {item.count !== undefined && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${currentView === item.id ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {item.count}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                    {/* Backdrop for mobile */}
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Breadcrumbs */}
                    {(currentView !== 'subjects') && (
                        <ManualBreadcrumb items={getBreadcrumbs()} />
                    )}

                    {/* Content Views */}
                    {currentView === 'subjects' && (
                        <div className="space-y-8">
                            {/* Learning Path Viewer (Read-only for teachers, below subjects for admin) */}
                            {!isAdmin && learningPaths.length > 0 && (
                                <LearningPathViewer
                                    learningPaths={learningPaths}
                                    onSelectSubject={(id) => {
                                        goToSubjects();
                                    }}
                                />
                            )}

                            <SubjectGrid
                                subjects={subjects}
                                moduleLib={moduleLib}
                                topicLib={topicLib}
                                isAdmin={isAdmin}
                                searchQuery={searchQuery}
                            />
                        </div>
                    )}



                    {currentView === 'learning-paths' && (
                        isAdmin ? (
                            <LearningPathDesigner
                                learningPaths={learningPaths}
                                subjects={subjects}
                            />
                        ) : (
                            <LearningPathViewer
                                learningPaths={learningPaths}
                                onSelectSubject={(id) => {
                                    goToSubjects();
                                }}
                            />
                        )
                    )}

                    {/* Admin Content Management Views */}
                    {currentView === 'manage-subjects' && isAdmin && (
                        <AdminSubjectManager subjects={subjects} />
                    )}

                    {currentView === 'manage-modules' && isAdmin && (
                        <AdminModuleManager modules={moduleLib} />
                    )}

                    {currentView === 'manage-topics' && isAdmin && (
                        <AdminTopicManager topics={topicLib} />
                    )}
                </main>
            </div>
        </div>
    );
}

// ── Admin Manager Sub-Components ──────────────────────────────────────
// These are the "library manager" views for creating/editing the raw data

import { useTransition } from 'react';
import {
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineCheck,
    HiOutlineArrowPath,
    HiOutlineEye,
    HiOutlineEyeSlash,
} from 'react-icons/hi2';
import {
    createManualSubject,
    updateManualSubject,
    deleteManualSubject,
    toggleManualSubjectStatus,
    createManualModule,
    deleteManualModule,
    createManualTopic,
    updateManualTopic,
} from '@/app/actions/admin-training-manuals';

function AdminSubjectManager({ subjects }: { subjects: any[] }) {
    const [isPending, startTransition] = useTransition();
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSeq, setNewSeq] = useState(99);

    function handleAdd() {
        if (!newName.trim()) return;
        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('viewSeq', String(newSeq));
        startTransition(async () => {
            const result = await createManualSubject(fd);
            if (result.error) alert(result.error);
            else { setNewName(''); setNewSeq(99); setShowNew(false); }
        });
    }

    function handleDelete(id: number) {
        if (!confirm('Delete this subject and all its module links?')) return;
        startTransition(async () => {
            const result = await deleteManualSubject(id);
            if (result.error) alert(result.error);
        });
    }

    function handleToggle(id: number, status: number) {
        startTransition(async () => {
            const result = await toggleManualSubjectStatus(id, status);
            if (result.error) alert(result.error);
        });
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Subject Library</h2>
                    <p className="text-xs text-slate-500">Manage top-level subject categories</p>
                </div>
                <button onClick={() => setShowNew(!showNew)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <HiOutlinePlus size={16} /> Add Subject
                </button>
            </div>

            {showNew && (
                <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Subject Name" className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
                    <input type="number" value={newSeq} onChange={(e) => setNewSeq(parseInt(e.target.value) || 0)} className="w-20 px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white text-center" placeholder="Seq" />
                    <button onClick={handleAdd} disabled={isPending} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"><HiOutlineCheck size={16} /></button>
                    <button onClick={() => setShowNew(false)} className="p-2 text-slate-400 hover:text-slate-600 "><HiOutlineXMark size={16} /></button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 text-left">
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">Seq</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Visible</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {subjects.map((s) => (
                            <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3 text-sm text-slate-500 font-mono">{s.viewSeq}</td>
                                <td className="px-5 py-3 text-sm font-semibold text-slate-800">{s.name}</td>
                                <td className="px-5 py-3">
                                    <button onClick={() => handleToggle(s.id, s.userView)} className={`p-1.5 rounded-lg transition-all ${s.userView === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {s.userView === 1 ? <HiOutlineEye size={18} /> : <HiOutlineEyeSlash size={18} />}
                                    </button>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        <HiOutlineTrash size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {subjects.length === 0 && (
                            <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-sm">No subjects yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminModuleManager({ modules }: { modules: any[] }) {
    const [isPending, startTransition] = useTransition();
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');

    function handleAdd() {
        if (!newName.trim()) return;
        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('moduleCode', newCode.trim());
        startTransition(async () => {
            const result = await createManualModule(fd);
            if (result.error) alert(result.error);
            else { setNewName(''); setNewCode(''); setShowNew(false); }
        });
    }

    function handleDelete(id: string) {
        if (!confirm('Delete this module from the library?')) return;
        startTransition(async () => {
            const result = await deleteManualModule(id);
            if (result.error) alert(result.error);
        });
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Module Library</h2>
                    <p className="text-xs text-slate-500">Reusable modules that can be linked to subjects</p>
                </div>
                <button onClick={() => setShowNew(!showNew)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <HiOutlinePlus size={16} /> Add Module
                </button>
            </div>

            {showNew && (
                <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Module Name" className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
                    <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Code (optional)" className="w-32 px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white" />
                    <button onClick={handleAdd} disabled={isPending} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"><HiOutlineCheck size={16} /></button>
                    <button onClick={() => setShowNew(false)} className="p-2 text-slate-400 hover:text-slate-600"><HiOutlineXMark size={16} /></button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 text-left">
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Module Name</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-32">Code</th>
                            <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-20 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {modules.map((m) => (
                            <tr key={m.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3 text-sm font-semibold text-slate-800">{m.name}</td>
                                <td className="px-5 py-3 text-xs text-slate-400 font-mono">{m.moduleCode || '—'}</td>
                                <td className="px-5 py-3 text-right">
                                    <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        <HiOutlineTrash size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {modules.length === 0 && (
                            <tr><td colSpan={3} className="px-5 py-12 text-center text-slate-400 text-sm">No modules yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminTopicManager({ topics }: { topics: any[] }) {
    const [isPending, startTransition] = useTransition();
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPdf, setNewPdf] = useState('');
    const [newRef, setNewRef] = useState('');
    const [newContent, setNewContent] = useState('');

    // Edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPdf, setEditPdf] = useState('');
    const [editRef, setEditRef] = useState('');
    const [editContent, setEditContent] = useState('');

    function handleAdd() {
        if (!newName.trim()) return;
        const fd = new FormData();
        fd.set('name', newName.trim());
        fd.set('pdfUrl', newPdf.trim());
        fd.set('manualRef', newRef.trim());
        fd.set('content', newContent.trim());
        startTransition(async () => {
            const result = await createManualTopic(fd);
            if (result.error) alert(result.error);
            else { setNewName(''); setNewPdf(''); setNewRef(''); setNewContent(''); setShowNew(false); }
        });
    }

    function startEdit(t: any) {
        setEditingId(t.id);
        setEditName(t.name);
        setEditPdf(t.pdfUrl || '');
        setEditRef(t.manualRef || '');
        setEditContent(t.content || '');
    }

    function handleSaveEdit(id: string) {
        startTransition(async () => {
            const result = await updateManualTopic(id, { name: editName, pdfUrl: editPdf, manualRef: editRef, content: editContent });
            if (result.error) alert(result.error);
            else setEditingId(null);
        });
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Topic Library</h2>
                    <p className="text-xs text-slate-500">Individual topics with content and PDF resources</p>
                </div>
                <button onClick={() => setShowNew(!showNew)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <HiOutlinePlus size={16} /> Add Topic
                </button>
            </div>

            {showNew && (
                <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 space-y-3">
                    <div className="flex gap-3">
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Topic Name" className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" autoFocus />
                        <input value={newRef} onChange={(e) => setNewRef(e.target.value)} placeholder="Ref" className="w-28 px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white" />
                    </div>
                    <input value={newPdf} onChange={(e) => setNewPdf(e.target.value)} placeholder="PDF URL (optional)" className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" />
                    <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Content (optional)" rows={3} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none resize-none" />
                    <div className="flex gap-2">
                        <button onClick={handleAdd} disabled={isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"><HiOutlineCheck size={16} />Add</button>
                        <button onClick={() => setShowNew(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
                    </div>
                </div>
            )}

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {topics.map((t) => (
                    <div key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                        {editingId === t.id ? (
                            <div className="px-5 py-4 space-y-2">
                                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50/50" />
                                <div className="flex gap-2">
                                    <input value={editPdf} onChange={(e) => setEditPdf(e.target.value)} placeholder="PDF URL" className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50/50" />
                                    <input value={editRef} onChange={(e) => setEditRef(e.target.value)} placeholder="Ref" className="w-28 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50/50" />
                                </div>
                                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Content" rows={3} className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50/50 resize-none" />
                                <div className="flex gap-1">
                                    <button onClick={() => handleSaveEdit(t.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">Save</button>
                                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-slate-500 text-xs">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-5 py-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {t.manualRef && <span className="text-[10px] text-slate-400 font-mono">Ref: {t.manualRef}</span>}
                                        {t.pdfUrl && <span className="text-[10px] text-blue-500">📄 PDF</span>}
                                        {t.content && <span className="text-[10px] text-emerald-500">📝 Content</span>}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><HiOutlinePencil size={14} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {topics.length === 0 && (
                    <div className="px-5 py-12 text-center text-slate-400 text-sm">No topics yet.</div>
                )}
            </div>
        </div>
    );
}
