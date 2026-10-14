'use client';

import { useState, useTransition } from 'react';
import {
    HiOutlineAcademicCap,
    HiOutlineUsers,
    HiOutlineClock,
    HiOutlineStar,
    HiOutlineArrowDownTray,
    HiOutlineSparkles,
    HiOutlineTableCells,
    HiOutlineUserGroup,
    HiOutlineArrowRight,
    HiOutlineMagnifyingGlass,
    HiOutlineCalendarDays,
    HiOutlineArrowPath,
    HiOutlinePlus
} from 'react-icons/hi2';
import * as XLSX from 'xlsx';
import { TrainerComparisonItem, TrainerReportStats, getAdminTrainersLeaderboard, getTrainerReportData } from '@/app/actions/trainer-reports';
import TrainerReportView from '@/components/trainer/TrainerReportView';

interface AdminTrainerPerformanceClientProps {
    leaderboard: TrainerComparisonItem[];
    globalSummary: {
        totalTrainers: number;
        totalSessions: number;
        totalPrograms?: number;
        totalHours: number;
        totalTrainees: number;
        totalFirstTimers: number;
        firstTimerPercentage: number;
        avgRating: number | null;
    };
    initialReport: TrainerReportStats;
    availableTrainers: string[];
    availableYears?: string[];
}

export default function AdminTrainerPerformanceClient({
    leaderboard,
    globalSummary,
    initialReport,
    availableTrainers,
    availableYears = []
}: AdminTrainerPerformanceClientProps) {
    const [viewMode, setViewMode] = useState<'leaderboard' | 'deepDive'>('leaderboard');
    const [selectedTrainer, setSelectedTrainer] = useState<string>(availableTrainers[0] || initialReport.trainerName);
    const [selectedYear, setSelectedYear] = useState<string>(initialReport.selectedFinancialYear || 'ALL');
    const [leaderboardData, setLeaderboardData] = useState<TrainerComparisonItem[]>(leaderboard);
    const [summaryData, setSummaryData] = useState(globalSummary);
    const [reportData, setReportData] = useState<TrainerReportStats>(initialReport);
    const [searchFilter, setSearchFilter] = useState('');
    const [isPending, startTransition] = useTransition();

    const filteredLeaderboard = leaderboardData.filter(t =>
        t.trainerName.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const handleYearChange = (newYear: string) => {
        setSelectedYear(newYear);
        startTransition(async () => {
            const [leadRes, repRes] = await Promise.all([
                getAdminTrainersLeaderboard(newYear),
                getTrainerReportData(selectedTrainer, newYear)
            ]);
            if (leadRes.leaderboard && leadRes.globalSummary) {
                setLeaderboardData(leadRes.leaderboard);
                setSummaryData(leadRes.globalSummary);
            }
            if (repRes.report) {
                setReportData(repRes.report);
            }
        });
    };

    const exportLeaderboard = () => {
        const rows = leaderboardData.map((t, idx) => ({
            'Rank': idx + 1,
            'Trainer Name': t.trainerName,
            'Financial Year': selectedYear === 'ALL' ? 'All Years' : `FY ${selectedYear}`,
            'Completed Programs': t.completedSessions,
            'Unique Programs': t.totalPrograms,
            'Total Training Hours': t.trainingHours,
            'Unique Persons Trained': t.uniquePersonsTrained,
            'Total Attendances': t.totalTraineeSessions,
            'First-Time Trainees Inducted': t.firstTimeTrainees,
            'First-Timer Conversion %': `${t.firstTimerPercentage}%`,
            'Average Rating': t.averageRating ? `${t.averageRating} / 5` : 'N/A'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Trainers Leaderboard');
        const fyLabel = selectedYear === 'ALL' ? 'All_Time' : `FY${selectedYear}`;
        XLSX.writeFile(wb, `Company_Trainer_Performance_${fyLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleInspectTrainer = (trainerName: string) => {
        setSelectedTrainer(trainerName);
        startTransition(async () => {
            const repRes = await getTrainerReportData(trainerName, selectedYear);
            if (repRes.report) {
                setReportData(repRes.report);
            }
            setViewMode('deepDive');
        });
    };

    return (
        <div className={`space-y-8 transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {/* VIEW MODE TOGGLE & FY FILTER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setViewMode('leaderboard')}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'leaderboard'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                    >
                        <HiOutlineUserGroup className="w-4 h-4" />
                        <span>All Trainers Leaderboard</span>
                    </button>
                    <button
                        onClick={() => setViewMode('deepDive')}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'deepDive'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        <span>Individual Trainer Record</span>
                    </button>
                    {isPending && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full animate-pulse">
                            <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
                            Recalculating...
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Financial Year Selector */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
                        <HiOutlineCalendarDays className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FY Year:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(e.target.value)}
                            disabled={isPending}
                            className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">All Financial Years</option>
                            {availableYears.map(yr => (
                                <option key={yr} value={yr}>
                                    FY {yr}
                                </option>
                            ))}
                        </select>
                    </div>

                    {viewMode === 'leaderboard' && (
                        <button
                            onClick={exportLeaderboard}
                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-2xl shadow-xs transition-colors shrink-0"
                        >
                            <HiOutlineArrowDownTray className="w-4 h-4" />
                            Export Leaderboard
                        </button>
                    )}
                </div>
            </div>

            {/* MODE 1: LEADERBOARD & GLOBAL SUMMARY */}
            {viewMode === 'leaderboard' && (
                <div className="space-y-8">
                    {/* GLOBAL COMPANY SUMMARY CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                <HiOutlineAcademicCap className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Programs Completed</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">{summaryData.totalSessions.toLocaleString()}</span>
                                <span className="text-xs text-slate-500 font-semibold">Across {summaryData.totalTrainers} Trainers</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                                <span>{summaryData.totalHours.toLocaleString()} Training Hours</span>
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">{summaryData.totalPrograms} Distinct Titles</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                                <HiOutlineUsers className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Workforce Trained</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">{summaryData.totalTrainees.toLocaleString()}</span>
                                <span className="text-xs text-slate-500 font-semibold">Unique Employees</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-indigo-600 font-semibold">
                                Organization-wide certified reach
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl p-6 shadow-md shadow-emerald-500/10">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-4">
                                <HiOutlineSparkles className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Untrained → Trained</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-white">{summaryData.totalFirstTimers.toLocaleString()}</span>
                                <span className="text-xs text-emerald-100 font-semibold">First-Time Inductees</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100 font-semibold">
                                <span>{summaryData.firstTimerPercentage}% of All Trainees</span>
                                <span className="bg-white/25 px-2 py-0.5 rounded-full font-bold text-white">Company Impact</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                                <HiOutlineStar className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Company Trainer Rating</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">
                                    {summaryData.avgRating ? `${summaryData.avgRating}★` : 'N/A'}
                                </span>
                                <span className="text-xs text-slate-500 font-semibold">Overall Quality</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                                High participant satisfaction benchmark
                            </div>
                        </div>
                    </div>

                    {/* TRAINER LEADERBOARD TABLE */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                Trainer Comparison Leaderboard
                            </h3>

                            <div className="relative w-full sm:w-64">
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search trainer..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Trainer Name</th>
                                        <th className="py-3 px-4 text-center">Completed Programs</th>
                                        <th className="py-3 px-4 text-center">Unique Topics</th>
                                        <th className="py-3 px-4 text-center">Training Hours</th>
                                        <th className="py-3 px-4 text-center">Unique Persons Trained</th>
                                        <th className="py-3 px-4 text-center">First-Time Inductees</th>
                                        <th className="py-3 px-4 text-center">First-Timer %</th>
                                        <th className="py-3 px-4 text-center">Avg Rating</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLeaderboard.map((t, idx) => (
                                        <tr key={t.trainerName} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{t.trainerName}</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">{t.completedSessions}</td>
                                            <td className="py-3.5 px-4 text-center font-semibold text-purple-700">{t.totalPrograms}</td>
                                            <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{t.trainingHours} hrs</td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-900">{t.uniquePersonsTrained.toLocaleString()}</td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                                                    {t.firstTimeTrainees.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-700">{t.firstTimerPercentage}%</td>
                                            <td className="py-3.5 px-4 text-center">
                                                {t.averageRating ? (
                                                    <span className="text-amber-500 font-black">{t.averageRating} ★</span>
                                                ) : (
                                                    <span className="text-slate-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => handleInspectTrainer(t.trainerName)}
                                                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold text-xs uppercase tracking-wider hover:underline"
                                                >
                                                    <span>View Record</span>
                                                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLeaderboard.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                                                No trainers found matching "{searchFilter}".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODE 2: DEEP DIVE TRAINER RECORD */}
            {viewMode === 'deepDive' && (
                <TrainerReportView
                    initialReport={reportData}
                    availableTrainers={availableTrainers}
                    availableYears={availableYears}
                    selectedYear={selectedYear}
                    onYearChange={handleYearChange}
                    canSwitchTrainer={true}
                />
            )}
        </div>
    );
}
