'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    HiOutlineUsers,
    HiOutlineClock,
    HiOutlineMagnifyingGlass,
    HiOutlineArrowDownTray,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineBuildingOffice2,
    HiOutlineMapPin,
    HiOutlineBookOpen,
    HiOutlinePlus,
    HiOutlineXMark,
    HiOutlineFunnel,
    HiOutlineChartPie,
    HiOutlineCheck
} from 'react-icons/hi2';
import * as XLSX from 'xlsx';
import {
    WorkforceTrainingAnalyticsData,
    DeficitBreakdownItem
} from '@/app/actions/workforce-reports';

interface WorkforceTrainingReportViewProps {
    initialData: WorkforceTrainingAnalyticsData;
    backHref?: string;
    backLabel?: string;
}

// Available master fields that can be added as custom dynamic filters
const CUSTOM_FILTER_DEFINITIONS = [
    { key: 'organization', label: 'Organization', optionsKey: 'organizations' as const },
    { key: 'region', label: 'Region', optionsKey: 'regions' as const },
    { key: 'projectLocation', label: 'Project Location', optionsKey: 'projectLocations' as const },
    { key: 'grade', label: 'Grade', optionsKey: 'grades' as const },
    { key: 'gender', label: 'Gender', optionsKey: 'genders' as const },
    { key: 'employeeGroupMNmw', label: 'Employee Group (M/NM/W)', optionsKey: 'employeeGroups' as const },
    { key: 'highestQualification', label: 'Highest Qualification', optionsKey: 'highestQualifications' as const },
    { key: 'managerName', label: 'Reporting Manager', optionsKey: 'managers' as const },
    { key: 'department', label: 'Department', optionsKey: 'departments' as const },
] as const;

type CustomFilterKey = typeof CUSTOM_FILTER_DEFINITIONS[number]['key'];

interface ActiveCustomFilter {
    id: string;
    field: CustomFilterKey;
    values: string[];
}

interface MultiSelectFilterProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    onRemove?: () => void;
}

/**
 * Reusable, compact, searchable multi-select dropdown filter with checkboxes
 */
function MultiSelectFilter({
    label,
    options,
    selected,
    onChange,
    placeholder = 'All',
    onRemove
}: MultiSelectFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(opt => opt.toLowerCase().includes(q));
    }, [options, search]);

    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(item => item !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const handleSelectAll = () => {
        onChange([...options]);
    };

    const handleClearAll = () => {
        onChange([]);
    };

    const hasSelection = selected.length > 0;

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 text-xs rounded-xl border transition-all text-left bg-white ${
                        hasSelection
                            ? 'border-indigo-400 ring-2 ring-indigo-500/10 text-indigo-950 font-semibold'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                >
                    <span className="truncate max-w-[130px]">
                        {hasSelection ? (
                            selected.length === 1 ? (
                                selected[0]
                            ) : (
                                `${selected.length} selected`
                            )
                        ) : (
                            <span className="text-slate-400">{placeholder}</span>
                        )}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                        {hasSelection && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700">
                                {selected.length}
                            </span>
                        )}
                        <HiOutlineChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                        title="Remove custom filter"
                    >
                        <HiOutlineXMark className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 space-y-2">
                    {/* Header with Quick Actions */}
                    <div className="flex items-center justify-between px-1 text-[11px] border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-700">{label}</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                            >
                                Select All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Search inside options if many */}
                    {options.length > 5 && (
                        <div className="relative">
                            <HiOutlineMagnifyingGlass className="absolute left-2.5 top-2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={`Filter ${label}...`}
                                className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                            />
                        </div>
                    )}

                    {/* Options List */}
                    <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                        {filteredOptions.length === 0 ? (
                            <div className="text-slate-400 text-xs text-center py-2 italic">
                                No matching options
                            </div>
                        ) : (
                            filteredOptions.map(opt => {
                                const isChecked = selected.includes(opt);
                                return (
                                    <label
                                        key={opt}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                            isChecked
                                                ? 'bg-indigo-50 text-indigo-900 font-semibold'
                                                : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleOption(opt)}
                                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="truncate">{opt}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WorkforceTrainingReportView({
    initialData,
    backHref = '/admin/reports',
    backLabel = 'Back to Reports Hub'
}: WorkforceTrainingReportViewProps) {
    const { employees: allEmployees, filterOptions } = initialData;

    // Active Tab state
    const [activeTab, setActiveTab] = useState<'roster' | 'sections' | 'deptGroups' | 'locations' | 'tni'>('roster');

    // Preset Multi-Select Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTniStatuses, setSelectedTniStatuses] = useState<string[]>([]);
    const [selectedDeptGroups, setSelectedDeptGroups] = useState<string[]>([]);
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedOnRollContracts, setSelectedOnRollContracts] = useState<string[]>([]);

    // Dynamic Custom Multi-Select Filters
    const [customFilters, setCustomFilters] = useState<ActiveCustomFilter[]>([]);
    const [showAddFilterMenu, setShowAddFilterMenu] = useState(false);

    // Row expansion in Roster
    const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

    // Pagination for Roster
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Add a custom filter
    const handleAddCustomFilter = (field: CustomFilterKey) => {
        const newFilter: ActiveCustomFilter = {
            id: `${field}_${Date.now()}`,
            field,
            values: []
        };
        setCustomFilters(prev => [...prev, newFilter]);
        setShowAddFilterMenu(false);
    };

    // Update custom filter multi-select values
    const handleUpdateCustomFilter = (id: string, values: string[]) => {
        setCustomFilters(prev => prev.map(f => f.id === id ? { ...f, values } : f));
        setCurrentPage(1);
    };

    // Remove a custom filter
    const handleRemoveCustomFilter = (id: string) => {
        setCustomFilters(prev => prev.filter(f => f.id !== id));
        setCurrentPage(1);
    };

    // Clear all filters
    const handleResetAllFilters = () => {
        setSearchTerm('');
        setSelectedStatuses([]);
        setSelectedTniStatuses([]);
        setSelectedDeptGroups([]);
        setSelectedSections([]);
        setSelectedLocations([]);
        setSelectedOnRollContracts([]);
        setCustomFilters([]);
        setCurrentPage(1);
    };

    // Filtered Workforce Records based on ALL multi-select filters
    const filteredEmployees = useMemo(() => {
        return allEmployees.filter(emp => {
            // Status multi-select
            if (selectedStatuses.length > 0 && !selectedStatuses.includes(emp.status)) {
                return false;
            }

            // TNI Status multi-select
            if (selectedTniStatuses.length > 0) {
                const hasPending = emp.pendingTNICount > 0;
                const matchesHas = selectedTniStatuses.includes('Has Pending TNI') && hasPending;
                const matchesNone = selectedTniStatuses.includes('No Pending TNI') && !hasPending;
                if (!matchesHas && !matchesNone) return false;
            }

            // Department Group multi-select
            if (selectedDeptGroups.length > 0 && !selectedDeptGroups.includes(emp.departmentGroup)) {
                return false;
            }

            // Section multi-select
            if (selectedSections.length > 0 && !selectedSections.includes(emp.section)) {
                return false;
            }

            // Location multi-select
            if (selectedLocations.length > 0 && !selectedLocations.includes(emp.location)) {
                return false;
            }

            // On-Roll / Contract multi-select
            if (selectedOnRollContracts.length > 0 && !selectedOnRollContracts.includes(emp.onRollContract)) {
                return false;
            }

            // Custom Dynamic Multi-Select Filters
            for (const cf of customFilters) {
                if (cf.values.length > 0) {
                    const empVal = String((emp as any)[cf.field] || '').trim();
                    if (!cf.values.includes(empVal)) {
                        return false;
                    }
                }
            }

            // Search Term
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const match =
                    emp.name.toLowerCase().includes(q) ||
                    emp.empId.toLowerCase().includes(q) ||
                    emp.email.toLowerCase().includes(q) ||
                    emp.designation.toLowerCase().includes(q) ||
                    emp.section.toLowerCase().includes(q) ||
                    emp.department.toLowerCase().includes(q) ||
                    emp.location.toLowerCase().includes(q);
                if (!match) return false;
            }

            return true;
        });
    }, [
        allEmployees,
        selectedStatuses,
        selectedTniStatuses,
        selectedDeptGroups,
        selectedSections,
        selectedLocations,
        selectedOnRollContracts,
        customFilters,
        searchTerm
    ]);

    // Summary Statistics for current filtered view
    const currentSummary = useMemo(() => {
        const totalEmployees = filteredEmployees.length;
        let trainedEmployees = 0;
        let totalHours = 0;
        let totalPrograms = 0;
        let totalPendingTNIs = 0;

        for (const e of filteredEmployees) {
            if (e.status === 'Trained') trainedEmployees++;
            totalHours += e.trainingHours;
            totalPrograms += e.programsCompleted;
            totalPendingTNIs += e.pendingTNICount;
        }

        const untrainedEmployees = totalEmployees - trainedEmployees;
        const trainedPercentage = totalEmployees > 0 ? Math.round((trainedEmployees / totalEmployees) * 100) : 0;
        const untrainedPercentage = totalEmployees > 0 ? Math.round((untrainedEmployees / totalEmployees) * 100) : 0;

        return {
            totalEmployees,
            trainedEmployees,
            untrainedEmployees,
            trainedPercentage,
            untrainedPercentage,
            totalHours: Math.round(totalHours * 10) / 10,
            totalPrograms,
            totalPendingTNIs
        };
    }, [filteredEmployees]);

    // Dynamically calculate Section Deficit Breakdown based on current filters
    const sectionBreakdown = useMemo(() => {
        const map = new Map<string, { total: number; trained: number; hours: number; pending: number }>();
        for (const e of filteredEmployees) {
            const sec = e.section || 'Unassigned';
            const curr = map.get(sec) || { total: 0, trained: 0, hours: 0, pending: 0 };
            curr.total++;
            if (e.status === 'Trained') curr.trained++;
            curr.hours += e.trainingHours;
            curr.pending += e.pendingTNICount;
            map.set(sec, curr);
        }

        return Array.from(map.entries())
            .map(([name, val]): DeficitBreakdownItem => {
                const untrained = val.total - val.trained;
                const untrainedPercentage = val.total > 0 ? Math.round((untrained / val.total) * 100) : 0;
                return {
                    name,
                    total: val.total,
                    trained: val.trained,
                    untrained,
                    untrainedPercentage,
                    totalHours: Math.round(val.hours * 10) / 10,
                    pendingTNIs: val.pending
                };
            })
            .sort((a, b) => b.untrained - a.untrained);
    }, [filteredEmployees]);

    // Dynamically calculate Department Group Breakdown based on current filters
    const departmentGroupBreakdown = useMemo(() => {
        const map = new Map<string, { total: number; trained: number; hours: number; pending: number }>();
        for (const e of filteredEmployees) {
            const grp = e.departmentGroup || 'General';
            const curr = map.get(grp) || { total: 0, trained: 0, hours: 0, pending: 0 };
            curr.total++;
            if (e.status === 'Trained') curr.trained++;
            curr.hours += e.trainingHours;
            curr.pending += e.pendingTNICount;
            map.set(grp, curr);
        }

        return Array.from(map.entries())
            .map(([name, val]): DeficitBreakdownItem => {
                const untrained = val.total - val.trained;
                const untrainedPercentage = val.total > 0 ? Math.round((untrained / val.total) * 100) : 0;
                return {
                    name,
                    total: val.total,
                    trained: val.trained,
                    untrained,
                    untrainedPercentage,
                    totalHours: Math.round(val.hours * 10) / 10,
                    pendingTNIs: val.pending
                };
            })
            .sort((a, b) => b.untrained - a.untrained);
    }, [filteredEmployees]);

    // Dynamically calculate Location Breakdown based on current filters
    const locationBreakdown = useMemo(() => {
        const map = new Map<string, { total: number; trained: number; hours: number; pending: number }>();
        for (const e of filteredEmployees) {
            const loc = e.location || 'Unassigned';
            const curr = map.get(loc) || { total: 0, trained: 0, hours: 0, pending: 0 };
            curr.total++;
            if (e.status === 'Trained') curr.trained++;
            curr.hours += e.trainingHours;
            curr.pending += e.pendingTNICount;
            map.set(loc, curr);
        }

        return Array.from(map.entries())
            .map(([name, val]): DeficitBreakdownItem => {
                const untrained = val.total - val.trained;
                const untrainedPercentage = val.total > 0 ? Math.round((untrained / val.total) * 100) : 0;
                return {
                    name,
                    total: val.total,
                    trained: val.trained,
                    untrained,
                    untrainedPercentage,
                    totalHours: Math.round(val.hours * 10) / 10,
                    pendingTNIs: val.pending
                };
            })
            .sort((a, b) => b.untrained - a.untrained);
    }, [filteredEmployees]);

    // Flat list of pending TNI nominations
    const allPendingTNIs = useMemo(() => {
        const list: Array<{
            empId: string;
            employeeName: string;
            email: string;
            department: string;
            section: string;
            location: string;
            managerName: string;
            programName: string;
            status: string;
        }> = [];

        filteredEmployees.forEach(e => {
            e.pendingTNIs.forEach(tni => {
                list.push({
                    empId: e.empId,
                    employeeName: e.name,
                    email: e.email,
                    department: e.department,
                    section: e.section,
                    location: e.location,
                    managerName: e.managerName,
                    programName: tni.programName,
                    status: tni.status
                });
            });
        });

        return list;
    }, [filteredEmployees]);

    // Total active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (searchTerm.trim()) count++;
        if (selectedStatuses.length > 0) count++;
        if (selectedTniStatuses.length > 0) count++;
        if (selectedDeptGroups.length > 0) count++;
        if (selectedSections.length > 0) count++;
        if (selectedLocations.length > 0) count++;
        if (selectedOnRollContracts.length > 0) count++;
        count += customFilters.filter(cf => cf.values.length > 0).length;
        return count;
    }, [
        searchTerm,
        selectedStatuses,
        selectedTniStatuses,
        selectedDeptGroups,
        selectedSections,
        selectedLocations,
        selectedOnRollContracts,
        customFilters
    ]);

    // Paginated Roster
    const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredEmployees.slice(start, start + pageSize);
    }, [filteredEmployees, currentPage, pageSize]);

    // ==========================================
    // EXCEL EXPORTS (Every Table Has Its Own)
    // ==========================================

    const exportSectionExcel = () => {
        const rows = sectionBreakdown.map(s => ({
            'Section Name': s.name,
            'Total Headcount': s.total,
            'Trained Headcount': s.trained,
            'Untrained Headcount': s.untrained,
            'Untrained Percentage': `${s.untrainedPercentage}%`,
            'Total Training Hours': s.totalHours,
            'Pending TNI Demands': s.pendingTNIs
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Section Deficit');
        XLSX.writeFile(wb, `Section_Training_Deficit_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportDeptGroupExcel = () => {
        const rows = departmentGroupBreakdown.map(d => ({
            'Department Group': d.name,
            'Total Headcount': d.total,
            'Trained Headcount': d.trained,
            'Untrained Headcount': d.untrained,
            'Untrained Percentage': `${d.untrainedPercentage}%`,
            'Total Training Hours': d.totalHours,
            'Pending TNI Demands': d.pendingTNIs
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Department Group Deficit');
        XLSX.writeFile(wb, `DeptGroup_Training_Deficit_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportLocationExcel = () => {
        const rows = locationBreakdown.map(l => ({
            'Location / Project Site': l.name,
            'Total Headcount': l.total,
            'Trained Headcount': l.trained,
            'Untrained Headcount': l.untrained,
            'Untrained Percentage': `${l.untrainedPercentage}%`,
            'Total Training Hours': l.totalHours,
            'Pending TNI Demands': l.pendingTNIs
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Location Deficit');
        XLSX.writeFile(wb, `Location_Training_Deficit_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportWorkforceRosterExcel = () => {
        const rows = filteredEmployees.map(e => ({
            'Employee ID': e.empId,
            'Employee Name': e.name,
            'Email': e.email,
            'Training Status': e.status,
            'Programs Completed': e.programsCompleted,
            'Training Hours': e.trainingHours,
            'Training Days': e.trainingDays,
            'Latest Completed Program': e.latestProgram?.name || 'None (Untrained)',
            'Latest Program Date': e.latestProgram?.date || 'N/A',
            'Pending TNI Demands Count': e.pendingTNICount,
            'Pending TNI Programs': e.pendingTNIs.map(p => p.programName).join('; ') || 'None',
            'Section': e.section,
            'Department': e.department,
            'Department Group': e.departmentGroup,
            'Location': e.location,
            'Project Location': e.projectLocation,
            'On-Roll / Contract': e.onRollContract,
            'Designation': e.designation,
            'Grade': e.grade,
            'Gender': e.gender,
            'Employee Group (M/NM/W)': e.employeeGroupMNmw,
            'Organization': e.organization,
            'Region': e.region,
            'Highest Qualification': e.highestQualification,
            'Reporting Manager': e.managerName,
            'Reporting Manager Email': e.managerEmail
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Workforce Roster');
        XLSX.writeFile(wb, `Workforce_Training_Roster_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportTniDemandsExcel = () => {
        const rows = allPendingTNIs.map(t => ({
            'Employee ID': t.empId,
            'Employee Name': t.employeeName,
            'Email': t.email,
            'Requested Program': t.programName,
            'Nomination Status': t.status,
            'Section': t.section,
            'Department': t.department,
            'Location': t.location,
            'Reporting Manager': t.managerName
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: 'No pending TNI demands found' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'TNI Demands');
        XLSX.writeFile(wb, `Workforce_TNI_Demands_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Master Combined Export (All Sheets in One Workbook)
    const exportMasterWorkbookExcel = () => {
        const wb = XLSX.utils.book_new();

        // 1. Executive Summary
        const summaryRows = [
            { Metric: 'Total Workforce Headcount', Value: currentSummary.totalEmployees },
            { Metric: 'Trained Employees Headcount', Value: currentSummary.trainedEmployees },
            { Metric: 'Untrained Employees Headcount', Value: currentSummary.untrainedEmployees },
            { Metric: 'Trained Workforce Percentage', Value: `${currentSummary.trainedPercentage}%` },
            { Metric: 'Untrained Deficit Percentage', Value: `${currentSummary.untrainedPercentage}%` },
            { Metric: 'Total Training Hours Delivered', Value: currentSummary.totalHours },
            { Metric: 'Total Program Completions', Value: currentSummary.totalPrograms },
            { Metric: 'Pending TNI Demands Across Workforce', Value: currentSummary.totalPendingTNIs },
            { Metric: 'Report Generated At', Value: new Date().toLocaleString() }
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

        // 2. Workforce Roster
        const rosterRows = filteredEmployees.map(e => ({
            'Employee ID': e.empId,
            'Employee Name': e.name,
            'Training Status': e.status,
            'Programs Completed': e.programsCompleted,
            'Training Hours': e.trainingHours,
            'Latest Completed Program': e.latestProgram?.name || 'None (Untrained)',
            'Latest Program Date': e.latestProgram?.date || 'N/A',
            'Pending TNI Count': e.pendingTNICount,
            'Section': e.section,
            'Department Group': e.departmentGroup,
            'Location': e.location,
            'On-Roll / Contract': e.onRollContract,
            'Designation': e.designation,
            'Grade': e.grade,
            'Reporting Manager': e.managerName
        }));
        const wsRoster = XLSX.utils.json_to_sheet(rosterRows);
        XLSX.utils.book_append_sheet(wb, wsRoster, 'Workforce Roster');

        // 3. Section Deficit
        const secRows = sectionBreakdown.map(s => ({
            'Section Name': s.name,
            'Total Headcount': s.total,
            'Trained': s.trained,
            'Untrained': s.untrained,
            '% Untrained': `${s.untrainedPercentage}%`,
            'Total Training Hours': s.totalHours,
            'Pending TNIs': s.pendingTNIs
        }));
        const wsSec = XLSX.utils.json_to_sheet(secRows);
        XLSX.utils.book_append_sheet(wb, wsSec, 'Section Deficit');

        // 4. Dept Group Deficit
        const deptRows = departmentGroupBreakdown.map(d => ({
            'Department Group': d.name,
            'Total Headcount': d.total,
            'Trained': d.trained,
            'Untrained': d.untrained,
            '% Untrained': `${d.untrainedPercentage}%`,
            'Total Hours': d.totalHours,
            'Pending TNIs': d.pendingTNIs
        }));
        const wsDept = XLSX.utils.json_to_sheet(deptRows);
        XLSX.utils.book_append_sheet(wb, wsDept, 'Dept Group Deficit');

        // 5. Location Deficit
        const locRows = locationBreakdown.map(l => ({
            'Location': l.name,
            'Total Headcount': l.total,
            'Trained': l.trained,
            'Untrained': l.untrained,
            '% Untrained': `${l.untrainedPercentage}%`,
            'Total Hours': l.totalHours,
            'Pending TNIs': l.pendingTNIs
        }));
        const wsLoc = XLSX.utils.json_to_sheet(locRows);
        XLSX.utils.book_append_sheet(wb, wsLoc, 'Location Deficit');

        // 6. Pending TNI Demands
        const tniRows = allPendingTNIs.map(t => ({
            'Employee ID': t.empId,
            'Employee Name': t.employeeName,
            'Requested Program': t.programName,
            'Status': t.status,
            'Section': t.section,
            'Location': t.location,
            'Reporting Manager': t.managerName
        }));
        const wsTni = XLSX.utils.json_to_sheet(tniRows.length > 0 ? tniRows : [{ Note: 'No pending TNI demands' }]);
        XLSX.utils.book_append_sheet(wb, wsTni, 'TNI Demands');

        XLSX.writeFile(wb, `Complete_Workforce_Training_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Top Navigation & Master Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
                    >
                        <span>←</span>
                        <span>{backLabel}</span>
                    </Link>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Workforce Intelligence
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={exportMasterWorkbookExcel}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all"
                    >
                        <HiOutlineArrowDownTray className="w-4 h-4" />
                        <span>Master Export (All Sheets)</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
                        <HiOutlineUsers className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{currentSummary.totalEmployees.toLocaleString()}</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">Active Master Headcount</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Trained Staff</span>
                        <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600">{currentSummary.trainedEmployees.toLocaleString()}</div>
                    <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        {currentSummary.trainedPercentage}% of total workforce
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Untrained Staff</span>
                        <HiOutlineExclamationCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-black text-rose-600">{currentSummary.untrainedEmployees.toLocaleString()}</div>
                    <div className="text-[11px] font-semibold text-rose-700 mt-0.5">
                        {currentSummary.untrainedPercentage}% training deficit
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hours Delivered</span>
                        <HiOutlineClock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{currentSummary.totalHours.toLocaleString()}</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-0.5">{currentSummary.totalPrograms.toLocaleString()} course completions</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending TNIs</span>
                        <HiOutlineBookOpen className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-600">{currentSummary.totalPendingTNIs.toLocaleString()}</div>
                    <div className="text-[11px] font-medium text-amber-700 mt-0.5">Identified learning demands</div>
                </div>
            </div>

            {/* Comprehensive Multi-Select Filter Bar with Dynamic Custom Filters */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <HiOutlineFunnel className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Multi-Select Workforce Filters
                        </span>
                        {activeFiltersCount > 0 && (
                            <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                {activeFiltersCount} active filter groups
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Add Custom Filter Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowAddFilterMenu(!showAddFilterMenu)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all"
                            >
                                <HiOutlinePlus className="w-3.5 h-3.5" />
                                <span>+ Add Custom Filter</span>
                            </button>

                            {showAddFilterMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Pick Employee Master Dimension
                                    </div>
                                    {CUSTOM_FILTER_DEFINITIONS.map(def => {
                                        const isAlreadyAdded = customFilters.some(f => f.field === def.key);
                                        return (
                                            <button
                                                key={def.key}
                                                type="button"
                                                onClick={() => handleAddCustomFilter(def.key)}
                                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50 transition-colors ${
                                                    isAlreadyAdded ? 'text-slate-400 bg-slate-50' : 'text-slate-700 font-medium'
                                                }`}
                                            >
                                                <span>{def.label}</span>
                                                {isAlreadyAdded && <span className="text-[10px] text-slate-400">(added)</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={handleResetAllFilters}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1"
                            >
                                <HiOutlineArrowPath className="w-3.5 h-3.5" />
                                <span>Reset All</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Preset Primary Multi-Select Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {/* Search */}
                    <div className="sm:col-span-2 relative">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Search Employee / Role
                        </label>
                        <div className="relative">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                placeholder="Name, Emp ID, Designation, Section..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            />
                        </div>
                    </div>

                    {/* Status Multi-Select */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Training Status
                        </label>
                        <MultiSelectFilter
                            label="Training Status"
                            options={['Trained', 'Untrained']}
                            selected={selectedStatuses}
                            onChange={vals => { setSelectedStatuses(vals); setCurrentPage(1); }}
                            placeholder="All Statuses"
                        />
                    </div>

                    {/* Department Group Multi-Select */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Dept Group
                        </label>
                        <MultiSelectFilter
                            label="Department Group"
                            options={filterOptions.departmentGroups}
                            selected={selectedDeptGroups}
                            onChange={vals => { setSelectedDeptGroups(vals); setCurrentPage(1); }}
                            placeholder="All Dept Groups"
                        />
                    </div>

                    {/* Section Multi-Select */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Section
                        </label>
                        <MultiSelectFilter
                            label="Section"
                            options={filterOptions.sections}
                            selected={selectedSections}
                            onChange={vals => { setSelectedSections(vals); setCurrentPage(1); }}
                            placeholder="All Sections"
                        />
                    </div>

                    {/* Location Multi-Select */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Location / Site
                        </label>
                        <MultiSelectFilter
                            label="Location"
                            options={filterOptions.locations}
                            selected={selectedLocations}
                            onChange={vals => { setSelectedLocations(vals); setCurrentPage(1); }}
                            placeholder="All Locations"
                        />
                    </div>

                    {/* On-Roll / Contract Multi-Select */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Contract Type
                        </label>
                        <MultiSelectFilter
                            label="On-Roll / Contract"
                            options={filterOptions.onRollContract}
                            selected={selectedOnRollContracts}
                            onChange={vals => { setSelectedOnRollContracts(vals); setCurrentPage(1); }}
                            placeholder="All Contracts"
                        />
                    </div>
                </div>

                {/* Additional TNI Multi-Select Row & Dynamic Custom Multi-Select Filters */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    {/* TNI Demand Status Multi-Select */}
                    <div className="w-48">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            TNI Demands Status
                        </label>
                        <MultiSelectFilter
                            label="TNI Status"
                            options={['Has Pending TNI', 'No Pending TNI']}
                            selected={selectedTniStatuses}
                            onChange={vals => { setSelectedTniStatuses(vals); setCurrentPage(1); }}
                            placeholder="All TNI Statuses"
                        />
                    </div>

                    {/* Custom Added Multi-Select Filters */}
                    {customFilters.map(cf => {
                        const def = CUSTOM_FILTER_DEFINITIONS.find(d => d.key === cf.field);
                        const optionsList: string[] = def ? (filterOptions[def.optionsKey] as any) || [] : [];

                        return (
                            <div key={cf.id} className="w-56">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                                    {def?.label || cf.field} (Multi-Select)
                                </label>
                                <MultiSelectFilter
                                    label={def?.label || cf.field}
                                    options={optionsList}
                                    selected={cf.values}
                                    onChange={vals => handleUpdateCustomFilter(cf.id, vals)}
                                    placeholder={`All ${def?.label || cf.field}`}
                                    onRemove={() => handleRemoveCustomFilter(cf.id)}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Active Filter Pills Bar */}
                {activeFiltersCount > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-bold text-slate-400 mr-1">Active Filters:</span>

                        {searchTerm.trim() && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200">
                                <span>Search: &quot;{searchTerm}&quot;</span>
                                <button onClick={() => setSearchTerm('')} className="hover:text-rose-600">
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedStatuses.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-indigo-200">
                                <span>Status: {selectedStatuses.join(', ')}</span>
                                <button onClick={() => setSelectedStatuses([])} className="hover:text-rose-600">
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedDeptGroups.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-indigo-200">
                                <span>Dept Groups ({selectedDeptGroups.length}): {selectedDeptGroups.join(', ')}</span>
                                <button onClick={() => setSelectedDeptGroups([])} className="hover:text-rose-600">
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedSections.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-indigo-200">
                                <span>Sections ({selectedSections.length})</span>
                                <button onClick={() => setSelectedSections([])} className="hover:text-rose-600">
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedLocations.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-indigo-200">
                                <span>Locations ({selectedLocations.length}): {selectedLocations.join(', ')}</span>
                                <button onClick={() => setSelectedLocations([])} className="hover:text-rose-600">
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedOnRollContracts.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-indigo-200">
                                <span>Contract: {selectedOnRollContracts.join(', ')}</span>
                                <button onClick={() => setSelectedOnRollContracts([])} className="hover:text-rose-600">
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedTniStatuses.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-indigo-200">
                                <span>TNI: {selectedTniStatuses.join(', ')}</span>
                                <button onClick={() => setSelectedTniStatuses([])} className="hover:text-rose-600">
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}

                        {customFilters.map(cf => {
                            if (cf.values.length === 0) return null;
                            const def = CUSTOM_FILTER_DEFINITIONS.find(d => d.key === cf.field);
                            return (
                                <span key={cf.id} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-purple-200">
                                    <span>{def?.label || cf.field} ({cf.values.length}): {cf.values.join(', ')}</span>
                                    <button onClick={() => handleUpdateCustomFilter(cf.id, [])} className="hover:text-rose-600">
                                        <HiOutlineXMark className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            );
                        })}

                        <button
                            onClick={handleResetAllFilters}
                            className="text-[11px] font-bold text-rose-600 hover:underline ml-2"
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'roster'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                >
                    <HiOutlineUsers className="w-4 h-4" />
                    <span>Workforce Training Roster</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === 'roster' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {filteredEmployees.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('sections')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'sections'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                >
                    <HiOutlineBuildingOffice2 className="w-4 h-4" />
                    <span>Section Deficit Breakdown</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === 'sections' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {sectionBreakdown.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('deptGroups')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'deptGroups'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                >
                    <HiOutlineChartPie className="w-4 h-4" />
                    <span>Department Group Deficit</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === 'deptGroups' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {departmentGroupBreakdown.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('locations')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'locations'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                >
                    <HiOutlineMapPin className="w-4 h-4" />
                    <span>Location Deficit Breakdown</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === 'locations' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {locationBreakdown.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('tni')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'tni'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                >
                    <HiOutlineBookOpen className="w-4 h-4" />
                    <span>TNI Demands Ledger</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === 'tni' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {allPendingTNIs.length}
                    </span>
                </button>
            </div>

            {/* TAB CONTENT */}

            {/* TAB 1: WORKFORCE TRAINING ROSTER */}
            {activeTab === 'roster' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Workforce Training Master Ledger
                            </span>
                            <span className="text-xs text-slate-500">
                                ({filteredEmployees.length} matching employees)
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Page size */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span>Show:</span>
                                <select
                                    value={pageSize}
                                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none"
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={250}>250</option>
                                </select>
                            </div>

                            {/* Export to Excel for this table */}
                            <button
                                onClick={exportWorkforceRosterExcel}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                            >
                                <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                                <span>Export Roster to Excel</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-4">Employee</th>
                                    <th className="py-3 px-4">Section & Dept</th>
                                    <th className="py-3 px-4">Location / Contract</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-center">Programs Completed</th>
                                    <th className="py-3 px-4 text-right">Training Hours</th>
                                    <th className="py-3 px-4">Latest Program</th>
                                    <th className="py-3 px-4 text-center">Pending TNI</th>
                                    <th className="py-3 px-3 text-center">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-slate-400">
                                            No employees match the specified multi-select filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map(emp => {
                                        const isExpanded = expandedEmpId === emp.empId;
                                        const isTrained = emp.status === 'Trained';

                                        return (
                                            <>
                                                <tr
                                                    key={emp.empId}
                                                    className={`hover:bg-slate-50/80 transition-colors ${
                                                        !isTrained ? 'bg-rose-50/20' : ''
                                                    }`}
                                                >
                                                    {/* Employee */}
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{emp.name}</div>
                                                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                                                            <span>ID: {emp.empId}</span>
                                                            <span>•</span>
                                                            <span>{emp.designation}</span>
                                                        </div>
                                                    </td>

                                                    {/* Section & Dept */}
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-slate-800">{emp.section}</div>
                                                        <div className="text-[11px] text-slate-400">{emp.departmentGroup}</div>
                                                    </td>

                                                    {/* Location / Contract */}
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-slate-800">{emp.location}</div>
                                                        <div className="text-[11px] text-slate-400">{emp.onRollContract}</div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3 px-4">
                                                        {isTrained ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                                                <span>Trained</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                <span>Untrained</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Programs Completed - Untrained shows 0 */}
                                                    <td className="py-3 px-4 text-center">
                                                        {isTrained ? (
                                                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                {emp.programsCompleted}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                                                0
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Training Hours */}
                                                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                                                        {emp.trainingHours.toFixed(1)} hrs
                                                    </td>

                                                    {/* Latest Program */}
                                                    <td className="py-3 px-4 max-w-xs truncate">
                                                        {emp.latestProgram ? (
                                                            <div>
                                                                <div className="font-medium text-slate-800 truncate" title={emp.latestProgram.name}>
                                                                    {emp.latestProgram.name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-mono">
                                                                    {emp.latestProgram.date}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-[11px]">No prior records</span>
                                                        )}
                                                    </td>

                                                    {/* Pending TNI */}
                                                    <td className="py-3 px-4 text-center">
                                                        {emp.pendingTNICount > 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                {emp.pendingTNICount} Pending
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-[11px]">-</span>
                                                        )}
                                                    </td>

                                                    {/* Expansion Toggle */}
                                                    <td className="py-3 px-3 text-center">
                                                        <button
                                                            onClick={() => setExpandedEmpId(isExpanded ? null : emp.empId)}
                                                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                                                            title="Toggle History"
                                                        >
                                                            {isExpanded ? (
                                                                <HiOutlineChevronUp className="w-4 h-4" />
                                                            ) : (
                                                                <HiOutlineChevronDown className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Drawer */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/90 border-b border-slate-200">
                                                        <td colSpan={9} className="p-4 space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {/* Training History Ledger */}
                                                                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                                                            Completed Training History ({emp.trainings.length})
                                                                        </span>
                                                                    </div>
                                                                    {emp.trainings.length === 0 ? (
                                                                        <div className="text-slate-400 text-xs italic py-2">
                                                                            Employee has not attended any certified training program yet.
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                                            {emp.trainings.map((t, idx) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                                                                                >
                                                                                    <div>
                                                                                        <div className="font-semibold text-slate-800">{t.programName}</div>
                                                                                        <div className="text-[10px] text-slate-400">
                                                                                            {t.date} {t.trainer ? `• Trainer: ${t.trainer}` : ''}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="font-mono font-bold text-slate-600 text-right">
                                                                                        {t.hours} hrs
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Pending TNI Nominations */}
                                                                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                                                                            Pending TNI Demands ({emp.pendingTNIs.length})
                                                                        </span>
                                                                    </div>
                                                                    {emp.pendingTNIs.length === 0 ? (
                                                                        <div className="text-slate-400 text-xs italic py-2">
                                                                            No open training nominations recorded for this employee.
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                                            {emp.pendingTNIs.map((tni, idx) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/50 border border-amber-100"
                                                                                >
                                                                                    <div className="font-semibold text-slate-800">{tni.programName}</div>
                                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                                                                        {tni.status}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Manager info */}
                                                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                                                        <span>Reporting Manager: <strong className="text-slate-700">{emp.managerName}</strong></span>
                                                                        <span>Grade: <strong className="text-slate-700">{emp.grade}</strong></span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                        <div>
                            Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                            {Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length} entries
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Previous
                            </button>
                            <span className="px-2 font-semibold">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: SECTION DEFICIT BREAKDOWN */}
            {activeTab === 'sections' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Section-wise Trained vs. Untrained Breakdown
                            </span>
                            <span className="text-xs text-slate-500">
                                ({sectionBreakdown.length} sections)
                            </span>
                        </div>

                        <button
                            onClick={exportSectionExcel}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                        >
                            <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                            <span>Export Section Report to Excel</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-4">Section Name</th>
                                    <th className="py-3 px-4 text-center">Total Workforce</th>
                                    <th className="py-3 px-4 text-center">Trained</th>
                                    <th className="py-3 px-4 text-center">Untrained (Deficit)</th>
                                    <th className="py-3 px-4 w-48 text-center">% Untrained</th>
                                    <th className="py-3 px-4 text-right">Training Hours</th>
                                    <th className="py-3 px-4 text-center">Pending TNI Demands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {sectionBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            No section records available.
                                        </td>
                                    </tr>
                                ) : (
                                    sectionBreakdown.map(sec => (
                                        <tr key={sec.name} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-900">{sec.name}</td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-800">{sec.total}</td>
                                            <td className="py-3 px-4 text-center font-semibold text-emerald-600">{sec.trained}</td>
                                            <td className="py-3 px-4 text-center font-bold text-rose-600">{sec.untrained}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                sec.untrainedPercentage > 40
                                                                    ? 'bg-rose-500'
                                                                    : sec.untrainedPercentage > 15
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${Math.min(sec.untrainedPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700 w-9 text-right font-mono">
                                                        {sec.untrainedPercentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                                                {sec.totalHours.toFixed(1)} hrs
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {sec.pendingTNIs > 0 ? (
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        {sec.pendingTNIs} pending
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: DEPARTMENT GROUP BREAKDOWN */}
            {activeTab === 'deptGroups' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Department Group Trained vs. Untrained Breakdown
                            </span>
                            <span className="text-xs text-slate-500">
                                ({departmentGroupBreakdown.length} department groups)
                            </span>
                        </div>

                        <button
                            onClick={exportDeptGroupExcel}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                        >
                            <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                            <span>Export Dept Group Report to Excel</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-4">Department Group</th>
                                    <th className="py-3 px-4 text-center">Total Workforce</th>
                                    <th className="py-3 px-4 text-center">Trained</th>
                                    <th className="py-3 px-4 text-center">Untrained (Deficit)</th>
                                    <th className="py-3 px-4 w-48 text-center">% Untrained</th>
                                    <th className="py-3 px-4 text-right">Training Hours</th>
                                    <th className="py-3 px-4 text-center">Pending TNI Demands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {departmentGroupBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            No department group records available.
                                        </td>
                                    </tr>
                                ) : (
                                    departmentGroupBreakdown.map(dept => (
                                        <tr key={dept.name} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-900">{dept.name}</td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-800">{dept.total}</td>
                                            <td className="py-3 px-4 text-center font-semibold text-emerald-600">{dept.trained}</td>
                                            <td className="py-3 px-4 text-center font-bold text-rose-600">{dept.untrained}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                dept.untrainedPercentage > 40
                                                                    ? 'bg-rose-500'
                                                                    : dept.untrainedPercentage > 15
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${Math.min(dept.untrainedPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700 w-9 text-right font-mono">
                                                        {dept.untrainedPercentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                                                {dept.totalHours.toFixed(1)} hrs
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {dept.pendingTNIs > 0 ? (
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        {dept.pendingTNIs} pending
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: LOCATION BREAKDOWN */}
            {activeTab === 'locations' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Location & Project Site Trained vs. Untrained Breakdown
                            </span>
                            <span className="text-xs text-slate-500">
                                ({locationBreakdown.length} locations)
                            </span>
                        </div>

                        <button
                            onClick={exportLocationExcel}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                        >
                            <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                            <span>Export Location Report to Excel</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-4">Location / Project Site</th>
                                    <th className="py-3 px-4 text-center">Total Workforce</th>
                                    <th className="py-3 px-4 text-center">Trained</th>
                                    <th className="py-3 px-4 text-center">Untrained (Deficit)</th>
                                    <th className="py-3 px-4 w-48 text-center">% Untrained</th>
                                    <th className="py-3 px-4 text-right">Training Hours</th>
                                    <th className="py-3 px-4 text-center">Pending TNI Demands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {locationBreakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            No location records available.
                                        </td>
                                    </tr>
                                ) : (
                                    locationBreakdown.map(loc => (
                                        <tr key={loc.name} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-900">{loc.name}</td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-800">{loc.total}</td>
                                            <td className="py-3 px-4 text-center font-semibold text-emerald-600">{loc.trained}</td>
                                            <td className="py-3 px-4 text-center font-bold text-rose-600">{loc.untrained}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                loc.untrainedPercentage > 40
                                                                    ? 'bg-rose-500'
                                                                    : loc.untrainedPercentage > 15
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${Math.min(loc.untrainedPercentage, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-700 w-9 text-right font-mono">
                                                        {loc.untrainedPercentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                                                {loc.totalHours.toFixed(1)} hrs
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {loc.pendingTNIs > 0 ? (
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        {loc.pendingTNIs} pending
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 5: PENDING TNI DEMANDS LEDGER */}
            {activeTab === 'tni' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Identified Training Needs & Nominations Ledger
                            </span>
                            <span className="text-xs text-slate-500">
                                ({allPendingTNIs.length} pending demands)
                            </span>
                        </div>

                        <button
                            onClick={exportTniDemandsExcel}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
                        >
                            <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                            <span>Export TNI Demands to Excel</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-4">Employee</th>
                                    <th className="py-3 px-4">Requested Program</th>
                                    <th className="py-3 px-4">Section & Dept</th>
                                    <th className="py-3 px-4">Location</th>
                                    <th className="py-3 px-4">Reporting Manager</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {allPendingTNIs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            No open TNI demands found for the current multi-select filter selection.
                                        </td>
                                    </tr>
                                ) : (
                                    allPendingTNIs.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900">{t.employeeName}</div>
                                                <div className="text-[11px] text-slate-500 font-mono">ID: {t.empId}</div>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-indigo-700">{t.programName}</td>
                                            <td className="py-3 px-4">
                                                <div className="text-slate-800">{t.section}</div>
                                                <div className="text-[11px] text-slate-400">{t.department}</div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700">{t.location}</td>
                                            <td className="py-3 px-4 text-slate-700">{t.managerName}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
