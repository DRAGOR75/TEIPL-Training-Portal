'use client';

import { useState, useTransition, useEffect } from 'react';
import {
    HiOutlineAcademicCap,
    HiOutlineUsers,
    HiOutlineClock,
    HiOutlineStar,
    HiOutlineArrowDownTray,
    HiOutlineMagnifyingGlass,
    HiOutlineCalendarDays,
    HiOutlineBuildingOffice2,
    HiOutlineCheckCircle,
    HiOutlineArrowPath,
    HiOutlineChatBubbleLeftRight,
    HiOutlinePlus,
    HiOutlineBookOpen
} from 'react-icons/hi2';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { TrainerReportStats, getTrainerReportData } from '@/app/actions/trainer-reports';

interface TrainerReportViewProps {
    initialReport: TrainerReportStats;
    availableTrainers?: string[];
    availableYears?: string[];
    canSwitchTrainer?: boolean;
    currentUserName?: string;
    selectedYear?: string;
    onYearChange?: (year: string) => void;
}

const PIE_COLORS = ['#10b981', '#6366f1']; // Emerald for First-Timers, Indigo for Refresher
const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function TrainerReportView({
    initialReport,
    availableTrainers = [],
    availableYears = [],
    canSwitchTrainer = false,
    currentUserName,
    selectedYear: selectedYearProp,
    onYearChange
}: TrainerReportViewProps) {
    const [report, setReport] = useState<TrainerReportStats>(initialReport);
    const [selectedTrainer, setSelectedTrainer] = useState<string>(initialReport.trainerName);
    const [selectedYear, setSelectedYear] = useState<string>(
        selectedYearProp || initialReport.selectedFinancialYear || 'ALL'
    );
    const [activeTab, setActiveTab] = useState<'overview' | 'firstTimers' | 'sessions' | 'feedback'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Session Ledger search & pagination state
    const [sessionSearch, setSessionSearch] = useState('');
    const [sessionPage, setSessionPage] = useState(1);
    const sessionPageSize = 15;

    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setReport(initialReport);
        setSelectedTrainer(initialReport.trainerName);
    }, [initialReport]);

    useEffect(() => {
        if (selectedYearProp && selectedYearProp !== selectedYear) {
            setSelectedYear(selectedYearProp);
        }
    }, [selectedYearProp]);

    const pageSize = 15;

    // Filter first-timer roster based on search query
    const filteredFirstTimers = report.firstTimers.firstTimersRoster.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            item.empId.toLowerCase().includes(query) ||
            item.name.toLowerCase().includes(query) ||
            item.department.toLowerCase().includes(query) ||
            item.location.toLowerCase().includes(query) ||
            item.programName.toLowerCase().includes(query)
        );
    });

    const totalPages = Math.ceil(filteredFirstTimers.length / pageSize) || 1;
    const paginatedFirstTimers = filteredFirstTimers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Filter all sessions based on session search
    const filteredSessions = (report.recentSessions || []).filter(s => {
        const q = sessionSearch.toLowerCase();
        return (
            s.programName.toLowerCase().includes(q) ||
            (s.category && s.category.toLowerCase().includes(q)) ||
            s.status.toLowerCase().includes(q) ||
            (s.location && s.location.toLowerCase().includes(q)) ||
            (s.startDate && s.startDate.includes(q))
        );
    });

    const totalSessionPages = Math.ceil(filteredSessions.length / sessionPageSize) || 1;
    const paginatedSessions = filteredSessions.slice(
        (sessionPage - 1) * sessionPageSize,
        sessionPage * sessionPageSize
    );

    // Minimal neutral tag style
    const getCategoryBadgeClass = () => 'bg-slate-100 text-slate-600 border border-slate-200/60';

    // Trainer switch handler (Admin mode only)
    const handleTrainerChange = (newTrainer: string) => {
        setSelectedTrainer(newTrainer);
        startTransition(async () => {
            const res = await getTrainerReportData(newTrainer, selectedYear);
            if (res.report) {
                setReport(res.report);
                setCurrentPage(1);
            }
        });
    };

    // Financial Year switch handler
    const handleYearChange = (newYear: string) => {
        setSelectedYear(newYear);
        if (onYearChange) {
            onYearChange(newYear);
        }
        startTransition(async () => {
            const res = await getTrainerReportData(selectedTrainer, newYear);
            if (res.report) {
                setReport(res.report);
                setCurrentPage(1);
            }
        });
    };

    // Excel Export function
    const exportToExcel = (type: 'all' | 'firstTimers') => {
        const workbook = XLSX.utils.book_new();

        if (type === 'all' || type === 'firstTimers') {
            const rosterData = report.firstTimers.firstTimersRoster.map(item => ({
                'Employee ID': item.empId,
                'Employee Name': item.name,
                'Department': item.department,
                'Section': item.section,
                'Location / Site': item.location,
                'Grade / Cadre': item.grade,
                'First Training Program': item.programName,
                'Induction Date': item.date,
                'Training Hours': item.hours,
                'Facilitating Trainer': report.trainerName
            }));
            const ws1 = XLSX.utils.json_to_sheet(rosterData);
            XLSX.utils.book_append_sheet(workbook, ws1, 'First-Time Trainees');
        }

        if (type === 'all') {
            const sessionsData = report.recentSessions.map(s => ({
                'Program Name': s.programName,
                'Predefined Category / Tag': s.category || 'Functional / Other',
                'Status': s.status,
                'Start Date': s.startDate,
                'End Date': s.endDate,
                'Training Hours': s.trainingHours,
                'Training Days': s.trainingDays,
                'Location': s.location,
                'Attended': s.attendedCount,
                'Trainer': report.trainerName
            }));
            const ws2 = XLSX.utils.json_to_sheet(sessionsData);
            XLSX.utils.book_append_sheet(workbook, ws2, 'Sessions Delivery');
        }

        const fyLabel = selectedYear === 'ALL' ? 'All_Time' : `FY${selectedYear}`;
        const fileName = `${report.trainerName.replace(/\s+/g, '_')}_${fyLabel}_Training_Impact_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // Donut chart data for Conversion
    const conversionData = [
        { name: 'First-Time Trainees (Newly Inducted)', value: report.firstTimers.totalFirstTimers },
        { name: 'Refresher / Returning Trainees', value: report.firstTimers.refresherCount }
    ];

    return (
        <div className={`space-y-8 transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {/* TOP HEADER & CONTROLS */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <HiOutlineStar className="w-3.5 h-3.5" />
                            Trainer Performance
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                            selectedYear === 'ALL'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                            <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                            {selectedYear === 'ALL' ? 'All-Time Record' : `FY ${selectedYear}`}
                        </span>
                        {canSwitchTrainer && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                                Admin View
                            </span>
                        )}
                        {isPending && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                                <HiOutlineArrowPath className="w-3 h-3 animate-spin" />
                                Updating...
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        {report.trainerName}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

                    {/* Admin Trainer Switcher */}
                    {canSwitchTrainer && availableTrainers.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trainer:</span>
                            <select
                                value={selectedTrainer}
                                onChange={(e) => handleTrainerChange(e.target.value)}
                                disabled={isPending}
                                className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">All Trainers (Company Total)</option>
                                {availableTrainers.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => exportToExcel('all')}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all"
                    >
                        <HiOutlineArrowDownTray className="w-4 h-4" />
                        Export Excel Record
                    </button>
                </div>
            </div>

            {/* KEY METRIC KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* CARD 1: SESSIONS / PROGRAMS COMPLETED */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-all flex flex-col justify-between">
                    <div>
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                            <HiOutlineAcademicCap className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Programs</span>
                        <div className="mt-1">
                            <span className="text-3xl font-black text-slate-900">{report.pipeline.completedSessions}</span>
                        </div>

                        {/* Exact Status Numbers Breakdown */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                {report.pipeline.completedSessions} Completed
                            </span>
                            {report.pipeline.scheduledSessions > 0 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                                    {report.pipeline.scheduledSessions} Scheduled
                                </span>
                            )}
                            {report.pipeline.formingSessions > 0 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                                    {report.pipeline.formingSessions} Forming
                                </span>
                            )}
                            {report.pipeline.cancelledSessions > 0 && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60">
                                    {report.pipeline.cancelledSessions} Cancelled
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                        <span>{report.output.totalTrainingHours} Hours Logged</span>
                        <span className="text-slate-500 font-medium">{report.pipeline.totalSessions} Total Pipeline</span>
                    </div>
                </div>

                {/* CARD 2: UNIQUE PROGRAMS DONE */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-purple-400 transition-all flex flex-col justify-between">
                    <div>
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                            <HiOutlineBookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Programs</span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-slate-900">{report.output.totalPrograms ?? report.programBreakdown.length}</span>
                            <span className="text-xs text-slate-500 font-semibold">Distinct Topics</span>
                        </div>
                    </div>
                </div>

                {/* CARD 3: TOTAL PERSONS TRAINED */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-indigo-400 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <HiOutlineUsers className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workforce Trained</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-slate-900">{report.output.uniquePersonsTrained.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-semibold">Unique Trainees</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                        <span>{report.output.totalTraineeSessions.toLocaleString()} Attendances</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">Total Reach</span>
                    </div>
                </div>

                {/* CARD 4: FIRST-TIME TRAINEES */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <HiOutlinePlus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">First-Time Attendees</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-slate-900">{report.firstTimers.totalFirstTimers.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-semibold">Inductions</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                        <span>{report.firstTimers.firstTimerPercentage}% of Trainees</span>
                        <span className="bg-emerald-50 px-2 py-0.5 rounded-full font-bold">{report.firstTimers.refresherCount} Refresher</span>
                    </div>
                </div>

                {/* CARD 5: TRAINER QUALITY & FEEDBACK */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                        <HiOutlineStar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trainer Rating</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-slate-900">
                            {report.quality.averageRating ? `${report.quality.averageRating}★` : 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">out of 5.0</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                        <span>{report.quality.totalRatingsCount} Reviews</span>
                        {report.quality.recommendationRate !== null && (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                                {report.quality.recommendationRate}% Rec.
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'overview'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                >
                    Overview & Trends
                </button>
                <button
                    onClick={() => setActiveTab('firstTimers')}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'firstTimers'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                >
                    <span>First-Time Trainees</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'firstTimers' ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                        {report.firstTimers.totalFirstTimers}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'sessions'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                >
                    Sessions ({filteredSessions.length})
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'feedback'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                >
                    Trainee Feedback
                </button>
            </div>

            {/* TAB 1: OVERVIEW & TRENDS */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CONVERSION DONUT: FIRST-TIMERS VS REFRESHER */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Workforce Induction Breakdown
                                </h3>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                    {report.firstTimers.firstTimerPercentage}% First-Time
                                </span>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={conversionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {conversionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => [val.toLocaleString(), 'Trainees']}
                                        contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
                            <div className="bg-emerald-50/60 p-3 rounded-2xl">
                                <span className="block text-2xl font-black text-emerald-700">
                                    {report.firstTimers.totalFirstTimers.toLocaleString()}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                                    First-Time Inductees
                                </span>
                            </div>
                            <div className="bg-indigo-50/60 p-3 rounded-2xl">
                                <span className="block text-2xl font-black text-indigo-700">
                                    {report.firstTimers.refresherCount.toLocaleString()}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                                    Returning / Refresher
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* MONTHLY DELIVERY TREND */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">
                                Monthly Training Trend
                            </h3>
                        </div>

                        <div className="h-64 w-full">
                            {report.monthlyTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={report.monthlyTrend}>
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                        <Bar dataKey="trainees" name="Total Trainees" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="firstTimers" name="First-Time Inductees" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                                    No monthly trend data recorded yet.
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>Showing last {report.monthlyTrend.length} recorded months</span>
                            <span className="text-slate-800 font-bold">{report.output.totalTraineeSessions} Total Trainee Records</span>
                        </div>
                    </div>
                    {/* TOP PROGRAMS DELIVERED */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm lg:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Top Programs Delivered
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Curriculum breakdown showing canonical programs and their alternate titles
                                </p>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                                {report.programBreakdown.length} Completed Programs
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="pb-3 pl-3 w-12 text-center">#</th>
                                        <th className="pb-3 px-4">Program Name</th>
                                        <th className="pb-3 px-4">Alt Program Name</th>
                                        <th className="pb-3 px-4 text-center">Category</th>
                                        <th className="pb-3 px-4 text-center">Sessions</th>
                                        <th className="pb-3 px-4 text-center">Hours</th>
                                        <th className="pb-3 pr-4 text-right">Trained</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {report.programBreakdown.map((prog, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 pl-3 text-center">
                                                <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-black text-xs inline-flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                {prog.name}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {prog.altPrograms && prog.altPrograms.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5 max-w-md">
                                                        {prog.altPrograms.map((alt, aIdx) => (
                                                            <span 
                                                                key={aIdx} 
                                                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60"
                                                            >
                                                                {alt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">
                                                        Standard (Core)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {prog.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                                {prog.sessionsCount}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                                {prog.totalHours} hrs
                                            </td>
                                            <td className="py-3.5 pr-4 text-right">
                                                <span className="block font-black text-slate-900 text-base">
                                                    {prog.personsTrained.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    trainees
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {report.programBreakdown.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-sm text-slate-400">
                                                No completed programs recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CATEGORY / TAG DISTRIBUTION */}
                    {report.categoryBreakdown && report.categoryBreakdown.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm lg:col-span-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Category Breakdown
                                </h3>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                    {report.categoryBreakdown.length} Categories
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                                {report.categoryBreakdown.map((cat, idx) => (
                                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                        <div className="text-xs font-semibold text-slate-600 truncate">{cat.category}</div>
                                        <div className="text-xl font-black text-slate-900 mt-1">
                                            {cat.sessionsCount} <span className="text-xs font-normal text-slate-400">{cat.sessionsCount === 1 ? 'session' : 'sessions'}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium mt-1">
                                            {cat.totalHours} hrs • {cat.personsTrained} trainees
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DEPARTMENT / SITE REACH */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4">
                            Department Reach
                        </h3>

                        <div className="space-y-4">
                            {report.departmentBreakdown.map((dept, idx) => {
                                const firstTimerRatio = dept.count > 0 ? Math.round((dept.firstTimers / dept.count) * 100) : 0;
                                return (
                                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-bold text-slate-800">{dept.name}</span>
                                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                {dept.firstTimers} First-Timers ({firstTimerRatio}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, firstTimerRatio)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {report.departmentBreakdown.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-8">No department records available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: FIRST-TIME TRAINEES ROSTER */}
            {activeTab === 'firstTimers' && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                First-Time Trainees
                            </h3>
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {report.firstTimers.totalFirstTimers}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Name, Dept..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <button
                                onClick={() => exportToExcel('firstTimers')}
                                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shrink-0"
                            >
                                <HiOutlineArrowDownTray className="w-4 h-4" />
                                Export List
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                <tr>
                                    <th className="py-3 px-4">Emp ID</th>
                                    <th className="py-3 px-4">Employee Name</th>
                                    <th className="py-3 px-4">Department / Section</th>
                                    <th className="py-3 px-4">Location / Site</th>
                                    <th className="py-3 px-4">Cadre</th>
                                    <th className="py-3 px-4">First Program</th>
                                    <th className="py-3 px-4">Induction Date</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedFirstTimers.map((emp, idx) => (
                                    <tr key={`${emp.empId}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{emp.empId}</td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">{emp.name}</td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-semibold text-slate-800">{emp.department}</span>
                                            {emp.section && emp.section !== 'N/A' && (
                                                <span className="block text-[10px] text-slate-400 font-medium">{emp.section}</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-700">{emp.location}</td>
                                        <td className="py-3.5 px-4">
                                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                                {emp.grade}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-800">{emp.programName}</td>
                                        <td className="py-3.5 px-4 font-mono text-slate-500">{emp.date}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-200/60">
                                                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                                Trained Inductee
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedFirstTimers.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                            No first-time trainees found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">
                                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredFirstTimers.length)} of {filteredFirstTimers.length} records
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-bold text-slate-800">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: SESSIONS */}
            {activeTab === 'sessions' && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                Training Sessions
                            </h3>
                            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                                {filteredSessions.length}
                            </span>
                        </div>

                        {/* Search Input for Sessions */}
                        <div className="relative w-full md:w-72">
                            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search program, category, location..."
                                value={sessionSearch}
                                onChange={(e) => {
                                    setSessionSearch(e.target.value);
                                    setSessionPage(1);
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                <tr>
                                    <th className="py-3 px-4">Program</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Dates</th>
                                    <th className="py-3 px-4">Duration</th>
                                    <th className="py-3 px-4">Location</th>
                                    <th className="py-3 px-4 text-center">Attended</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedSessions.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-semibold text-slate-900">{s.programName}</td>
                                        <td className="py-3.5 px-4">
                                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                                                {s.category || 'Functional'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    s.status === 'Completed' ? 'bg-emerald-500' :
                                                    s.status === 'Scheduled' ? 'bg-blue-500' :
                                                    s.status === 'Cancelled' ? 'bg-rose-500' :
                                                    'bg-amber-500'
                                                }`} />
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-600">
                                            {s.startDate} {s.endDate && s.endDate !== s.startDate && `– ${s.endDate}`}
                                        </td>
                                        <td className="py-3.5 px-4 font-medium text-slate-700">
                                            {s.trainingHours}h ({s.trainingDays}d)
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">{s.location}</td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">{s.attendedCount}</td>
                                    </tr>
                                ))}
                                {paginatedSessions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                                            No training sessions found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for Sessions */}
                    {totalSessionPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">
                                Showing {(sessionPage - 1) * sessionPageSize + 1} to {Math.min(sessionPage * sessionPageSize, filteredSessions.length)} of {filteredSessions.length} sessions
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                                    disabled={sessionPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-bold text-slate-800">
                                    Page {sessionPage} of {totalSessionPages}
                                </span>
                                <button
                                    onClick={() => setSessionPage(p => Math.min(totalSessionPages, p + 1))}
                                    disabled={sessionPage === totalSessionPages}
                                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: TRAINEE FEEDBACK */}
            {activeTab === 'feedback' && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            Trainee Feedback
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.quality.recentFeedback.map((fb, idx) => (
                            <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-sm text-slate-900">{fb.empName}</span>
                                        {fb.rating && (
                                            <span className="text-amber-500 font-black text-xs bg-amber-50 px-2 py-0.5 rounded-full">
                                                {fb.rating} ★
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-semibold block mb-3">
                                        {fb.programName} • {fb.date}
                                    </span>

                                    {fb.topicsLearned && (
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium mb-2">
                                            <strong className="text-slate-900 font-bold">Key Takeaways: </strong>
                                            {fb.topicsLearned}
                                        </p>
                                    )}

                                    {fb.actionPlan && (
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                            <strong className="text-slate-900 font-bold">Action Plan: </strong>
                                            {fb.actionPlan}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {report.quality.recentFeedback.length === 0 && (
                            <div className="col-span-2 py-12 text-center text-slate-400 font-medium">
                                No detailed feedback remarks recorded yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
