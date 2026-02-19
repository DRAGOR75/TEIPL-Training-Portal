'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    HiOutlineAcademicCap,
    HiOutlineUserGroup,
    HiOutlinePlusCircle,
    HiOutlineChevronRight,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineDocumentText,
} from 'react-icons/hi2';
import CreateCohortModal from '@/components/admin/cohort/CreateCohortModal';

interface CohortsDashboardProps {
    initialCohorts: any[];
    programs: { id: string; name: string; category: string }[];
}

export default function CohortsDashboard({ initialCohorts, programs }: CohortsDashboardProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'Draft' | 'Active' | 'Completed'>('all');

    const filteredCohorts = filter === 'all'
        ? initialCohorts
        : initialCohorts.filter(c => c.status === filter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'Active': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Completed': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getProgress = (cohort: any) => {
        const completed = cohort.programs.filter((p: any) => p.status === 'Completed').length;
        const total = cohort.programs.length;
        return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-8">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                <Link href="/admin" className="hover:text-slate-700 transition-colors">Admin</Link>
                                <HiOutlineChevronRight className="w-3 h-3" />
                                <span className="text-slate-900 font-medium">Cohorts</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Training Cohorts</h1>
                            <p className="text-slate-500 mt-1">Multi-program learning journeys for your teams.</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 self-start"
                        >
                            <HiOutlinePlusCircle className="w-5 h-5" />
                            Create Cohort
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'Draft', 'Active', 'Completed'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === tab
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                                }`}
                        >
                            {tab === 'all' ? 'All' : tab}
                            <span className="ml-1.5 text-xs text-slate-400">
                                ({tab === 'all' ? initialCohorts.length : initialCohorts.filter(c => c.status === tab).length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Cohort Grid */}
                {filteredCohorts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineAcademicCap className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No cohorts found</h3>
                        <p className="text-slate-500 text-sm mb-6">Create your first multi-program learning journey!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                            Create Cohort
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCohorts.map((cohort) => {
                            const progress = getProgress(cohort);
                            return (
                                <Link
                                    key={cohort.id}
                                    href={`/admin/cohorts/${cohort.id}`}
                                    className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl shadow-sm transition-all duration-300 overflow-hidden block"
                                >
                                    <div className="p-6">
                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(cohort.status)}`}>
                                                {cohort.status}
                                            </span>
                                            <HiOutlineChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>

                                        {/* Name */}
                                        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                                            {cohort.name}
                                        </h3>
                                        {cohort.description && (
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{cohort.description}</p>
                                        )}

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-slate-500 font-medium">Programs</span>
                                                <span className="font-bold text-slate-700">{progress.completed}/{progress.total}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress.percent}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <HiOutlineUserGroup className="w-4 h-4" />
                                                {cohort._count.members} members
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <HiOutlineDocumentText className="w-4 h-4" />
                                                {cohort._count.programs} programs
                                            </span>
                                        </div>

                                        {/* Program Pills */}
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {cohort.programs.slice(0, 4).map((cp: any) => (
                                                <span
                                                    key={cp.id}
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cp.status === 'Completed'
                                                        ? 'bg-green-50 text-green-600'
                                                        : cp.status === 'InProgress'
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'bg-slate-50 text-slate-500'
                                                        }`}
                                                >
                                                    {cp.status === 'Completed' && <HiOutlineCheckCircle className="w-3 h-3 inline mr-0.5" />}
                                                    {cp.status === 'InProgress' && <HiOutlineClock className="w-3 h-3 inline mr-0.5" />}
                                                    {cp.program.name}
                                                </span>
                                            ))}
                                            {cohort.programs.length > 4 && (
                                                <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5">
                                                    +{cohort.programs.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateCohortModal
                    programs={programs}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
}
