'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
    HiOutlineUsers,
    HiOutlineAcademicCap,
    HiOutlineClock,
    HiOutlineMagnifyingGlass,
    HiOutlineArrowDownTray,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineChevronDown,
    HiOutlineEnvelope,
    HiOutlineBuildingOffice2,
    HiOutlineMapPin,
    HiOutlineUserPlus,
    HiOutlineUserMinus,
    HiOutlineXMark,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineArrowTopRightOnSquare
} from 'react-icons/hi2';
import * as XLSX from 'xlsx';
import {
    ManagerDirectoryItem,
    ManagerTeamReportData,
    TeamMemberTrainingSummary,
    EmployeeSearchCandidate,
    getManagerTeamReport,
    addEmployeeToManager,
    removeEmployeeFromManager,
    searchEmployeesToAdd
} from '@/app/actions/manager-reports';

interface ManagerTeamReportViewProps {
    initialManagers: ManagerDirectoryItem[];
    initialReport: ManagerTeamReportData | null;
    initialSelectedManagerEmail: string;
    backHref: string;
    backLabel: string;
}

export default function ManagerTeamReportView({
    initialManagers,
    initialReport,
    initialSelectedManagerEmail,
    backHref,
    backLabel
}: ManagerTeamReportViewProps) {
    const [managers, setManagers] = useState<ManagerDirectoryItem[]>(initialManagers);
    const [selectedManagerEmail, setSelectedManagerEmail] = useState<string>(initialSelectedManagerEmail);
    const [report, setReport] = useState<ManagerTeamReportData | null>(initialReport);
    const [isPending, startTransition] = useTransition();

    // Manager selector search
    const [managerSearch, setManagerSearch] = useState('');
    const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);

    // Team members search & status filter
    const [memberSearch, setMemberSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'trained' | 'untrained' | 'pending'>('all');
    const isAdmin = backHref.startsWith('/admin');
    const getTniProfileUrl = (empId: string) => {
        const base = isAdmin ? '/admin/employee-tni' : '/trainer/employee-tni';
        return `${base}?empId=${encodeURIComponent(empId)}`;
    };

    // Add Member Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addSearchQuery, setAddSearchQuery] = useState('');
    const [candidateResults, setCandidateResults] = useState<EmployeeSearchCandidate[]>([]);
    const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
    const [addingEmpId, setAddingEmpId] = useState<string | null>(null);

    // Remove Member Confirmation State
    const [memberToRemove, setMemberToRemove] = useState<TeamMemberTrainingSummary | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // Feedback Toast / Alert
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Auto-clear feedback message after 4 seconds
    useEffect(() => {
        if (feedbackMessage) {
            const t = setTimeout(() => setFeedbackMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [feedbackMessage]);

    // Search candidates when addSearchQuery changes
    useEffect(() => {
        if (!isAddModalOpen) return;
        const q = addSearchQuery.trim();
        if (q.length < 2) {
            setCandidateResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingCandidates(true);
            const res = await searchEmployeesToAdd(q, selectedManagerEmail);
            if (res.candidates) {
                setCandidateResults(res.candidates);
            }
            setIsSearchingCandidates(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [addSearchQuery, isAddModalOpen, selectedManagerEmail]);

    // Filter managers for the combobox
    const filteredManagers = useMemo(() => {
        if (!managerSearch.trim()) return managers;
        const q = managerSearch.toLowerCase();
        return managers.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        );
    }, [managers, managerSearch]);

    // Handle switching manager
    const handleSelectManager = (email: string) => {
        setSelectedManagerEmail(email);
        setIsManagerDropdownOpen(false);
        setManagerSearch('');
        setMemberSearch('');
        setFeedbackMessage(null);

        startTransition(async () => {
            const res = await getManagerTeamReport(email);
            if (res.data) {
                setReport(res.data);
            }
        });
    };

    // Refresh current manager's report data
    const refreshCurrentReport = async () => {
        if (!selectedManagerEmail) return;
        const res = await getManagerTeamReport(selectedManagerEmail);
        if (res.data) {
            setReport(res.data);
            // Update manager list count if needed
            setManagers(prev => prev.map(m =>
                m.email.toLowerCase() === selectedManagerEmail.toLowerCase()
                    ? { ...m, directReportsCount: res.data!.members.length }
                    : m
            ));
        }
    };

    // Handle Adding an employee to manager team
    const handleAddEmployee = async (candidate: EmployeeSearchCandidate) => {
        if (!report) return;
        setAddingEmpId(candidate.id);
        const res = await addEmployeeToManager(
            candidate.id,
            report.manager.email,
            report.manager.name
        );
        setAddingEmpId(null);

        if (res.success) {
            setFeedbackMessage({
                type: 'success',
                text: `Successfully added ${candidate.name} (${candidate.id}) to ${report.manager.name}'s team.`
            });
            // Remove candidate from current search list
            setCandidateResults(prev => prev.filter(c => c.id !== candidate.id));
            await refreshCurrentReport();
        } else {
            setFeedbackMessage({
                type: 'error',
                text: res.error || 'Failed to add employee to team.'
            });
        }
    };

    // Handle Removing an employee from manager team
    const handleConfirmRemove = async () => {
        if (!memberToRemove || !report) return;
        setIsRemoving(true);
        const res = await removeEmployeeFromManager(memberToRemove.empId);
        setIsRemoving(false);

        if (res.success) {
            setFeedbackMessage({
                type: 'success',
                text: `Removed ${memberToRemove.name} from ${report.manager.name}'s team. Manager fields cleared in master.`
            });
            setMemberToRemove(null);
            await refreshCurrentReport();
        } else {
            setFeedbackMessage({
                type: 'error',
                text: res.error || 'Failed to remove employee from team.'
            });
        }
    };

    // Filter team members based on search and status
    const filteredMembers = useMemo(() => {
        if (!report) return [];
        return report.members.filter(member => {
            // Status filter
            if (statusFilter === 'trained' && member.status !== 'Trained') return false;
            if (statusFilter === 'untrained' && member.status !== 'Untrained') return false;
            if (statusFilter === 'pending' && member.pendingNominations.length === 0) return false;

            // Search filter
            if (!memberSearch.trim()) return true;
            const q = memberSearch.toLowerCase();
            return (
                member.name.toLowerCase().includes(q) ||
                member.empId.toLowerCase().includes(q) ||
                (member.section && member.section.toLowerCase().includes(q)) ||
                member.department.toLowerCase().includes(q) ||
                member.designation.toLowerCase().includes(q) ||
                member.location.toLowerCase().includes(q) ||
                member.email.toLowerCase().includes(q)
            );
        });
    }, [report, memberSearch, statusFilter]);

    // Excel Export
    const exportToExcel = () => {
        if (!report) return;
        const workbook = XLSX.utils.book_new();

        // 1. Team Summary Roster
        const rosterRows = report.members.map(m => ({
            'Employee ID': m.empId,
            'Employee Name': m.name,
            'Email': m.email,
            'Department': m.department,
            'Section': m.section,
            'Location': m.location,
            'Designation': m.designation,
            'Grade': m.grade,
            'Training Status': m.status,
            'Completed Programs Count': m.totalCompletedPrograms,
            'Total Training Hours': m.totalTrainingHours,
            'Latest Program': m.latestTraining?.programName || 'None',
            'Latest Training Date': m.latestTraining?.date || 'N/A',
            'Pending Nominations Count': m.pendingNominations.length,
            'Pending Programs': m.pendingNominations.map(p => p.programName).join('; ') || 'None',
            'Reporting Manager Email': report.manager.email,
            'Reporting Manager Name': report.manager.name
        }));
        const ws1 = XLSX.utils.json_to_sheet(rosterRows);
        XLSX.utils.book_append_sheet(workbook, ws1, 'Team Overview');

        // 2. Detailed Training Logs
        const detailRows: any[] = [];
        report.members.forEach(m => {
            m.recentTrainings.forEach(t => {
                detailRows.push({
                    'Employee ID': m.empId,
                    'Employee Name': m.name,
                    'Department': m.department,
                    'Program Name': t.programName,
                    'Category': t.category || 'Training',
                    'Start Date': t.startDate,
                    'End Date': t.endDate || t.startDate,
                    'Training Hours': t.trainingHours,
                    'Trainer': t.trainerName || 'N/A',
                    'Reporting Manager': report.manager.name
                });
            });
        });
        const ws2 = XLSX.utils.json_to_sheet(detailRows.length > 0 ? detailRows : [{ Note: 'No training logs recorded' }]);
        XLSX.utils.book_append_sheet(workbook, ws2, 'Training History Logs');

        const safeManagerName = report.manager.name.replace(/\s+/g, '_');
        XLSX.writeFile(workbook, `${safeManagerName}_Team_Training_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const currentManagerOption = managers.find(m => m.email.toLowerCase() === selectedManagerEmail.toLowerCase());

    return (
        <div className={`space-y-8 transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {/* Feedback Alert Banner */}
            {feedbackMessage && (
                <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
                    feedbackMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                    <div className="flex items-center gap-2">
                        {feedbackMessage.type === 'success' ? (
                            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <HiOutlineExclamationCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <span>{feedbackMessage.text}</span>
                    </div>
                    <button
                        onClick={() => setFeedbackMessage(null)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <HiOutlineXMark className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Top Navigation & Manager Selector */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors group mb-3"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> {backLabel}
                    </Link>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        Manager & Team Training
                    </h1>
                </div>

                {/* Manager Filter / Dropdown & Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-80">
                        <button
                            type="button"
                            onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
                            className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-left hover:border-slate-300 transition-colors"
                        >
                            <div className="truncate mr-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Manager:</span>
                                <span className="text-sm font-black text-slate-800 truncate block">
                                    {report?.manager.name || currentManagerOption?.name || 'Select a Manager'}
                                </span>
                                <span className="text-xs text-slate-400 font-medium block truncate">
                                    {selectedManagerEmail || 'Click to choose from directory'}
                                </span>
                            </div>
                            <HiOutlineChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>

                        {/* Dropdown Popover */}
                        {isManagerDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-full sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2 max-h-96 flex flex-col">
                                <div className="relative">
                                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search manager name or email..."
                                        value={managerSearch}
                                        onChange={(e) => setManagerSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                        autoFocus
                                    />
                                </div>

                                <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
                                    {filteredManagers.map(m => {
                                        const isSelected = m.email.toLowerCase() === selectedManagerEmail.toLowerCase();
                                        return (
                                            <button
                                                key={m.email}
                                                type="button"
                                                onClick={() => handleSelectManager(m.email)}
                                                className={`w-full text-left py-2.5 px-3 rounded-xl transition-colors flex items-center justify-between gap-3 ${
                                                    isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <div className="truncate">
                                                    <span className="block text-xs font-bold text-slate-900 truncate">{m.name}</span>
                                                    <span className="block text-[11px] text-slate-500 font-mono truncate">{m.email}</span>
                                                </div>
                                                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                    {m.directReportsCount} reports
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {filteredManagers.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-6">No matching managers found.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {report && (
                        <>
                            {/* Add Team Member Button */}
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(true);
                                    setAddSearchQuery('');
                                    setCandidateResults([]);
                                }}
                                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-2xl shadow-sm transition-all shrink-0"
                            >
                                <HiOutlineUserPlus className="w-4 h-4" />
                                <span>Add Member</span>
                            </button>

                            {/* Export Excel Button */}
                            <button
                                onClick={exportToExcel}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-2xl shadow-sm transition-all shrink-0"
                            >
                                <HiOutlineArrowDownTray className="w-4 h-4" />
                                <span>Export Report</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {report ? (
                <>
                    {/* Manager Overview Card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xl flex items-center justify-center border border-emerald-100">
                                {report.manager.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{report.manager.name}</h2>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                                    <span className="inline-flex items-center gap-1 font-mono">
                                        <HiOutlineEnvelope className="w-3.5 h-3.5 text-slate-400" />
                                        {report.manager.email}
                                    </span>
                                    {report.manager.department && (
                                        <span className="inline-flex items-center gap-1">
                                            <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-slate-400" />
                                            {report.manager.department}
                                        </span>
                                    )}
                                    {report.manager.location && (
                                        <span className="inline-flex items-center gap-1">
                                            <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400" />
                                            {report.manager.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200">
                                {report.summary.totalMembers} Direct Reports
                            </span>
                        </div>
                    </div>

                    {/* KPI SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Total Members */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                <HiOutlineUsers className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Size</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">{report.summary.totalMembers}</span>
                                <span className="text-xs text-slate-500 font-semibold">Employees</span>
                            </div>
                        </div>

                        {/* Trained Count */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                <HiOutlineCheckCircle className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trained Personnel</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">{report.summary.trainedMembers}</span>
                                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {report.summary.trainingPercentage}% of team
                                </span>
                            </div>
                        </div>

                        {/* Untrained Count */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                                <HiOutlineExclamationCircle className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Untrained / No History</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">{report.summary.untrainedMembers}</span>
                                <span className="text-xs text-slate-500 font-semibold">Need Induction</span>
                            </div>
                        </div>

                        {/* Total Training Hours */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                                <HiOutlineClock className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Training Hours Logged</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">{report.summary.totalTrainingHours}</span>
                                <span className="text-xs text-slate-500 font-semibold">Hours</span>
                            </div>
                        </div>

                        {/* Total Completed Programs */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                                <HiOutlineAcademicCap className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Courses Completed by Team</span>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl font-black text-slate-900">{report.summary.totalProgramsCompleted}</span>
                                <span className="text-xs text-slate-500 font-semibold">Courses Done</span>
                            </div>
                        </div>
                    </div>

                    {/* Team Members List Card */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                        {/* Filters & Search Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        statusFilter === 'all'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    All Members ({report.members.length})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('trained')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        statusFilter === 'trained'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Trained ({report.summary.trainedMembers})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('untrained')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        statusFilter === 'untrained'
                                            ? 'bg-amber-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Untrained ({report.summary.untrainedMembers})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('pending')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        statusFilter === 'pending'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Pending TNIs ({report.summary.pendingNominationsCount})
                                </button>
                            </div>

                            <div className="relative w-full md:w-72">
                                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, dept..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Members Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Section & Site</th>
                                        <th className="py-3 px-4">Training Status</th>
                                        <th className="py-3 px-4 text-center">Hours</th>
                                        <th className="py-3 px-4">Latest Program</th>
                                        <th className="py-3 px-4 text-center">Pending TNIs</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMembers.map((member) => (
                                        <tr
                                            key={member.empId}
                                            className="hover:bg-slate-50/70 transition-colors"
                                        >
                                            <td className="py-3.5 px-4">
                                                <Link
                                                    href={getTniProfileUrl(member.empId)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-slate-900 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 group"
                                                    title="Open Employee Profile & TNI Section"
                                                >
                                                    <span>{member.name}</span>
                                                    <HiOutlineArrowTopRightOnSquare className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                </Link>
                                                <div className="text-[11px] text-slate-400 font-mono">
                                                    ID: {member.empId} • {member.designation}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-semibold text-slate-800 block">{member.section && member.section !== 'N/A' ? member.section : member.department}</span>
                                                <span className="text-[11px] text-slate-400 block">{member.location}</span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {member.status === 'Trained' ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                                                        <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                                        Trained ({member.totalCompletedPrograms})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                        Untrained
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                                                {member.totalTrainingHours}h
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {member.latestTraining ? (
                                                    <div>
                                                        <span className="font-semibold text-slate-800 block truncate max-w-xs" title={member.latestTraining.programName}>
                                                            {member.latestTraining.programName}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-mono block">
                                                            {member.latestTraining.date} • {member.latestTraining.hours}h
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">No records</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {member.pendingNominations.length > 0 ? (
                                                    <span className="inline-block text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                                        {member.pendingNominations.length} Pending
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">None</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* View Profile & TNI Link */}
                                                    <Link
                                                        href={getTniProfileUrl(member.empId)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0"
                                                        title="Check full Training History, Employee Profile & TNI Section"
                                                    >
                                                        <span>Profile & TNI</span>
                                                        <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                                                    </Link>

                                                    {/* Remove From Team Button */}
                                                    <button
                                                        type="button"
                                                        title="Remove from this manager's team"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMemberToRemove(member);
                                                        }}
                                                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0"
                                                    >
                                                        <HiOutlineUserMinus className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Remove</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredMembers.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                                                No team members found matching your filter criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
                    <HiOutlineUsers className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-800">No Manager Selected</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Please choose a reporting manager from the dropdown above to inspect their team members and view training compliance.
                    </p>
                </div>
            )}

            {/* ADD MEMBER MODAL */}
            {isAddModalOpen && report && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Add Team Member</h3>
                                <span className="text-xs text-slate-500 font-medium">
                                    Assigning to {report.manager.name} ({report.manager.email})
                                </span>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
                            >
                                <HiOutlineXMark className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Type employee name, Emp ID, or email to search..."
                                value={addSearchQuery}
                                onChange={(e) => setAddSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                                autoFocus
                            />
                            {isSearchingCandidates && (
                                <HiOutlineArrowPath className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                            )}
                        </div>

                        {/* Search Results List */}
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-80 pr-1">
                            {candidateResults.map(candidate => {
                                const isAddingThis = addingEmpId === candidate.id;
                                return (
                                    <div
                                        key={candidate.id}
                                        className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        <div className="truncate">
                                            <div className="font-bold text-xs text-slate-900 truncate">
                                                {candidate.name} <span className="font-mono text-slate-400 font-normal">({candidate.id})</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 truncate">
                                                {candidate.designation} • {candidate.department} • {candidate.location}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                                {candidate.currentManagerEmail ? (
                                                    <span>Current Manager: <strong className="text-slate-600">{candidate.currentManagerName || candidate.currentManagerEmail}</strong></span>
                                                ) : (
                                                    <span className="text-amber-600 font-semibold">Currently Unassigned</span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isAddingThis}
                                            onClick={() => handleAddEmployee(candidate)}
                                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 transition-colors disabled:opacity-50"
                                        >
                                            {isAddingThis ? (
                                                <>
                                                    <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Adding...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <HiOutlineUserPlus className="w-3.5 h-3.5" />
                                                    <span>Add to Team</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}

                            {candidateResults.length === 0 && addSearchQuery.trim().length >= 2 && !isSearchingCandidates && (
                                <p className="text-xs text-slate-400 text-center py-8 font-medium">
                                    No eligible employees found matching "{addSearchQuery}".
                                </p>
                            )}

                            {addSearchQuery.trim().length < 2 && (
                                <p className="text-xs text-slate-400 text-center py-8 font-medium">
                                    Type at least 2 characters to search employees across the organization.
                                </p>
                            )}
                        </div>

                        <div className="border-t border-slate-100 pt-3 text-right">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMOVE MEMBER CONFIRMATION MODAL */}
            {memberToRemove && report && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <HiOutlineTrash className="w-6 h-6" />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-900">Remove from Team?</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Are you sure you want to remove <strong className="text-slate-800">{memberToRemove.name}</strong> ({memberToRemove.empId}) from <strong className="text-slate-800">{report.manager.name}</strong>'s team?
                            </p>
                            <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                This will clear the reporting manager fields in the Employee master record. Their training history and employee profile will remain intact.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                disabled={isRemoving}
                                onClick={() => setMemberToRemove(null)}
                                className="px-4 py-2.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isRemoving}
                                onClick={handleConfirmRemove}
                                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isRemoving ? (
                                    <>
                                        <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
                                        <span>Removing...</span>
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineUserMinus className="w-3.5 h-3.5" />
                                        <span>Confirm Remove</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
