'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    HiOutlineChevronRight,
    HiOutlineUserPlus,
    HiOutlineCalendarDays,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineTrash,
    HiOutlineArrowPath,
    HiOutlineAcademicCap,
    HiOutlineDocumentText,
    HiOutlinePlayCircle,
    HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
import AddMembersModal from '@/components/admin/cohort/AddMembersModal';
import ScheduleSessionModal from '@/components/admin/cohort/ScheduleSessionModal';
import { removeMemberFromCohort, updateCohort, markCohortProgramComplete } from '@/app/actions/cohorts';
import { useRouter } from 'next/navigation';

interface CohortDetailClientProps {
    cohort: any;
    trainers: any[];
    locations: any[];
}

export default function CohortDetailClient({ cohort, trainers, locations }: CohortDetailClientProps) {
    const router = useRouter();
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [scheduleFor, setScheduleFor] = useState<any>(null); // CohortProgram to schedule
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [markingComplete, setMarkingComplete] = useState<string | null>(null);
    const [activatingCohort, setActivatingCohort] = useState(false);

    const completedCount = cohort.programs.filter((p: any) => p.status === 'Completed').length;
    const totalPrograms = cohort.programs.length;
    const progressPercent = totalPrograms > 0 ? Math.round((completedCount / totalPrograms) * 100) : 0;

    const handleRemoveMember = async (employeeId: string, name: string) => {
        if (!confirm(`Remove ${name} from this cohort?`)) return;
        setRemovingId(employeeId);
        await removeMemberFromCohort(cohort.id, employeeId);
        setRemovingId(null);
        router.refresh();
    };

    const handleMarkComplete = async (cohortProgramId: string) => {
        if (!confirm('Mark this program as completed for the cohort?')) return;
        setMarkingComplete(cohortProgramId);
        const result = await markCohortProgramComplete(cohortProgramId);
        setMarkingComplete(null);
        if (result.cohortCompleted) {
            alert('🎓 All programs completed! Cohort members have graduated.');
        }
        router.refresh();
    };

    const handleActivate = async () => {
        setActivatingCohort(true);
        await updateCohort(cohort.id, { status: 'Active' });
        setActivatingCohort(false);
        router.refresh();
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed': return <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />;
            case 'InProgress': return <HiOutlineClock className="w-5 h-5 text-blue-500" />;
            default: return <div className="w-5 h-5 rounded-full border-2 border-slate-300" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'Active': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Completed': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-8">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <Link href="/admin" className="hover:text-slate-700 transition-colors">Admin</Link>
                        <HiOutlineChevronRight className="w-3 h-3" />
                        <Link href="/admin/cohorts" className="hover:text-slate-700 transition-colors">Cohorts</Link>
                        <HiOutlineChevronRight className="w-3 h-3" />
                        <span className="text-slate-900 font-medium">{cohort.name}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{cohort.name}</h1>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(cohort.status)}`}>
                                    {cohort.status}
                                </span>
                            </div>
                            {cohort.description && (
                                <p className="text-slate-500 text-sm max-w-2xl">{cohort.description}</p>
                            )}
                            {/* Progress */}
                            <div className="mt-4 flex items-center gap-4">
                                <div className="flex-1 max-w-xs">
                                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                    {completedCount}/{totalPrograms} programs
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 self-start">
                            {cohort.status === 'Draft' && (
                                <button
                                    onClick={handleActivate}
                                    disabled={activatingCohort || cohort.members.length === 0}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                                    title={cohort.members.length === 0 ? 'Add members first' : 'Activate cohort'}
                                >
                                    {activatingCohort ? <HiOutlineArrowPath className="w-4 h-4 animate-spin" /> : <HiOutlinePlayCircle className="w-4 h-4" />}
                                    Activate
                                </button>
                            )}
                            <button
                                onClick={() => setShowAddMembers(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                <HiOutlineUserPlus className="w-4 h-4" />
                                Add Members
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Program Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
                                    Program Journey
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Programs can be scheduled in any order based on trainer availability.</p>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {cohort.programs.map((cp: any, index: number) => (
                                    <div key={cp.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                        {/* Status Icon + Line */}
                                        <div className="flex flex-col items-center gap-1 pt-0.5">
                                            {getStatusIcon(cp.status)}
                                            {index < cohort.programs.length - 1 && (
                                                <div className={`w-0.5 h-8 rounded-full ${cp.status === 'Completed' ? 'bg-green-200' : 'bg-slate-200'}`} />
                                            )}
                                        </div>

                                        {/* Program Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-slate-400">#{cp.seq}</span>
                                                <h3 className="font-bold text-slate-900">{cp.program.name}</h3>
                                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${cp.status === 'Completed'
                                                    ? 'bg-green-50 text-green-600'
                                                    : cp.status === 'InProgress'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {cp.status === 'InProgress' ? 'In Progress' : cp.status}
                                                </span>
                                            </div>

                                            {/* Session Info */}
                                            {cp.session ? (
                                                <div className="text-xs text-slate-500 space-y-1 mt-2 bg-slate-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-4 flex-wrap">
                                                        <span>📅 {new Date(cp.session.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        {cp.session.trainerName && <span>👤 {cp.session.trainerName}</span>}
                                                        {cp.session.location && <span>📍 {cp.session.location}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Link
                                                            href={`/admin/sessions/${cp.session.id}/manage`}
                                                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                                                        >
                                                            Manage Session <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 mt-1">Not scheduled yet</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 shrink-0">
                                            {!cp.session && cp.status === 'Pending' && (
                                                <button
                                                    onClick={() => setScheduleFor(cp)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-100 active:scale-95"
                                                >
                                                    <HiOutlineCalendarDays className="w-4 h-4" />
                                                    Schedule
                                                </button>
                                            )}
                                            {cp.session && cp.status === 'InProgress' && (
                                                <button
                                                    onClick={() => handleMarkComplete(cp.id)}
                                                    disabled={markingComplete === cp.id}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                                >
                                                    {markingComplete === cp.id ? (
                                                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <HiOutlineCheckCircle className="w-4 h-4" />
                                                    )}
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Members */}
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <HiOutlineAcademicCap className="w-5 h-5 text-blue-600" />
                                Cohort Stats
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Status</span>
                                    <span className={`font-medium px-2 py-0.5 rounded text-xs ${getStatusBadge(cohort.status)}`}>{cohort.status}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Members</span>
                                    <span className="font-bold text-slate-900">{cohort.members.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Programs</span>
                                    <span className="font-bold text-slate-900">{completedCount}/{totalPrograms}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Feedbacks</span>
                                    <span className="font-bold text-slate-900">{cohort.feedbacks.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 text-sm">Members ({cohort.members.length})</h3>
                                <button
                                    onClick={() => setShowAddMembers(true)}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                                >
                                    <HiOutlineUserPlus className="w-3.5 h-3.5" /> Add
                                </button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                                {cohort.members.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">
                                        No members yet. Add employees to get started.
                                    </div>
                                ) : (
                                    cohort.members.map((member: any) => (
                                        <div key={member.id} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{member.employee.name}</div>
                                                <div className="text-[10px] text-slate-400 truncate">{member.employee.id} · {member.employee.sectionName || 'N/A'}</div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${member.status === 'Completed'
                                                ? 'bg-green-50 text-green-600'
                                                : member.status === 'Dropped'
                                                    ? 'bg-red-50 text-red-600'
                                                    : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {member.status}
                                            </span>
                                            {member.status === 'Active' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.employee.id, member.employee.name)}
                                                    disabled={removingId === member.employee.id}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 shrink-0"
                                                >
                                                    {removingId === member.employee.id ? (
                                                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddMembers && (
                <AddMembersModal cohortId={cohort.id} onClose={() => setShowAddMembers(false)} />
            )}

            {scheduleFor && (
                <ScheduleSessionModal
                    cohortProgram={scheduleFor}
                    cohortName={cohort.name}
                    trainers={trainers}
                    locations={locations}
                    onClose={() => setScheduleFor(null)}
                />
            )}
        </div>
    );
}
