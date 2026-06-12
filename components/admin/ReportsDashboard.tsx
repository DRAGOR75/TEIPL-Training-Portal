'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Sector, Treemap, RadialBarChart, RadialBar
} from 'recharts';
import { HiOutlineArrowDownTray, HiOutlineChartBar, HiOutlineFunnel, HiOutlineUsers, HiOutlineAcademicCap, HiOutlineMap, HiOutlineMagnifyingGlass, HiOutlineTrash, HiOutlineXMark, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';
import * as XLSX from 'xlsx';
import { getFilteredParticipantDepth, getTniReportData, getAllNominationsForExport, getUntrainedPendingTrainees } from '@/app/actions/reports';
import UntrainedPendingReport from '@/components/admin/UntrainedPendingReport';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const RADIAN = Math.PI / 180;

interface ReportsDashboardProps {
    data: any;
}

export default function ReportsDashboard({ data }: ReportsDashboardProps) {
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [selectedSite, setSelectedSite] = useState<string | null>(null);
    const [depthData, setDepthData] = useState<any[]>([]);
    const [isDepthLoading, setIsDepthLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'planning' | 'untrained'>('overview');
    const [untrainedData, setUntrainedData] = useState<any[] | null>(null);
    const [isUntrainedLoading, setIsUntrainedLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardData, setDashboardData] = useState(data);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filters (State)
    const [filters, setFilters] = useState({
        site: 'All',
        dept: 'All'
    });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Silence Recharts "width(-1)" warning which is a known noisy issue in development
        const originalError = console.error;
        console.error = (...args: any[]) => {
            if (typeof args[0] === 'string' && args[0].includes('The width(-1) and height(-1) of chart should be greater than 0')) {
                return;
            }
            originalError(...args);
        };

        const timer = setTimeout(() => setIsMounted(true), 200);
        return () => {
            console.error = originalError;
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'untrained' && untrainedData === null) {
            const fetchUntrained = async () => {
                setIsUntrainedLoading(true);
                try {
                    const data = await getUntrainedPendingTrainees();
                    setUntrainedData(data || []);
                } catch (error) {
                    console.error("Failed to fetch untrained data", error);
                    setUntrainedData([]);
                } finally {
                    setIsUntrainedLoading(false);
                }
            };
            fetchUntrained();
        }
    }, [activeTab, untrainedData]);

    if (!data) return <div className="p-10 text-center text-slate-500 font-medium">No report data available.</div>;

    const handleExport = async () => {
        setIsDataLoading(true);
        try {
            const rawData = await getAllNominationsForExport();
            if (!rawData) return;

            const workbook = XLSX.utils.book_new();

            // 1. Raw Data Sheet
            const exportData = rawData.map(item => ({
                EmployeeID: item.employee?.id || '',
                EmployeeName: item.employee?.name || '',
                Designation: item.employee?.designation || '',
                Grade: item.employee?.grade || '',
                Department: item.employee?.sectionName || '',
                Location: item.employee?.location || '',
                ManagerName: item.employee?.managerName || '',
                ProgramName: item.program?.name || '',
                ProgramCategory: item.program?.category || '',
                Status: item.status,
                Justification: item.justification || '',
                Date: new Date(item.createdAt).toLocaleDateString()
            }));

            const dataSheet = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(workbook, dataSheet, "All TNI Records");

            // 2. Summary Sheet
            const summaryData = [
                { Metric: 'Total Employees', Value: dashboardData.summary.totalEmployees },
                { Metric: 'Total Unique Programs', Value: dashboardData.summary.totalUniquePrograms },
                { Metric: 'Total Nominations', Value: dashboardData.summary.totalNominations },
                { Metric: 'Completion Rate %', Value: dashboardData.summary.completionRate.toFixed(2) }
            ];
            const summarySheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary Metrics");

            // 3. Site Demand
            const siteSheet = XLSX.utils.json_to_sheet(dashboardData.siteDemand);
            XLSX.utils.book_append_sheet(workbook, siteSheet, "Site Demand");

            // 4. Departmental Demand
            const deptSheet = XLSX.utils.json_to_sheet(dashboardData.deptDemand);
            XLSX.utils.book_append_sheet(workbook, deptSheet, "Department Demand");

            XLSX.writeFile(workbook, `TNI_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleExportFiltered = () => {
        if (depthData.length === 0) return;

        const workbook = XLSX.utils.book_new();
        const exportData = depthData.map(item => ({
            EmployeeID: item.employee.id,
            EmployeeName: item.employee.name,
            Email: item.employee.email,
            Grade: item.employee.grade,
            Department: item.employee.sectionName,
            Location: item.employee.location,
            ProgramName: item.program.name,
            Category: item.program.category,
            Status: item.status,
            Date: new Date(item.createdAt).toLocaleDateString()
        }));

        const sheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, sheet, "Filtered Records");
        
        const fileName = selectedProgram 
            ? `Program_${selectedProgram}_Report` 
            : `Site_${selectedSite}_Report`;

        XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const fetchData = async (programId: string | null, site: string | null) => {
        setIsDepthLoading(true);
        try {
            const result = await getFilteredParticipantDepth({ 
                programId: programId || undefined, 
                site: site || undefined 
            });
            setDepthData(result || []);
        } catch (error) {
            console.error("Failed to fetch depth", error);
        } finally {
            setIsDepthLoading(false);
        }
    };

    const handleProgramClick = (programId: string) => {
        const newProgram = selectedProgram === programId ? null : programId;
        setSelectedProgram(newProgram);
        fetchData(newProgram, selectedSite);
    };

    const handleSiteClick = async (siteName?: string) => {
        if (!siteName) return;
        const newSite = selectedSite === siteName ? null : siteName;
        setSelectedSite(newSite);
        
        // Refresh entire dashboard data for the site
        setIsDataLoading(true);
        try {
            const result = await getTniReportData(newSite || undefined);
            if (result) setDashboardData(result);
            fetchData(selectedProgram, newSite);
        } catch (error) {
            console.error("Failed to refresh dashboard data", error);
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSelectedProgram(null);
        setSelectedSite(null);
        setDepthData([]);
        setDashboardData(data); // Reset to global data
        setCurrentPage(1);
    };

    // Filtered programs based on search
    const filteredPrograms = dashboardData.topPrograms.filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
    const paginatedPrograms = filteredPrograms.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on search or site change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <HiOutlineChartBar className="text-blue-600" /> Executive TNI Analytics
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Real-time organizational demand & training planning.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95"
                    >
                        <HiOutlineArrowDownTray size={18} /> Export to Excel
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    System Overview
                </button>
                <button
                    onClick={() => setActiveTab('planning')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'planning' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Resource Planning
                </button>
                <button
                    onClick={() => setActiveTab('untrained')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'untrained' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Untrained Pending
                </button>
            </div>

            {activeTab === 'untrained' ? (
                <div className="mt-8 relative min-h-[400px]">
                    {isUntrainedLoading ? (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 rounded-3xl flex flex-col items-center justify-center border border-slate-200">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
                            <p className="text-slate-500 font-bold animate-pulse">Analyzing training records...</p>
                        </div>
                    ) : (
                        <UntrainedPendingReport employees={untrainedData || []} />
                    )}
                </div>
            ) : activeTab === 'overview' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {isDataLoading && (
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-20 rounded-3xl flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Employees</p>
                            <h3 className="text-3xl font-black text-slate-900">{dashboardData.summary.totalEmployees.toLocaleString()}</h3>
                            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                                <HiOutlineUsers /> {selectedSite ? `At ${selectedSite}` : 'Across all sites'}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active TNI Needs</p>
                            <h3 className="text-3xl font-black text-slate-900">{(dashboardData.statusCounts.find((s: any) => s.name === 'Pending')?.value || 0).toLocaleString()}</h3>
                            <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
                                <HiOutlineAcademicCap /> Pending fulfillment
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Courses in Catalog</p>
                            <h3 className="text-3xl font-black text-slate-900">{dashboardData.summary.totalUniquePrograms}</h3>
                            <div className="mt-2 text-xs text-purple-600 font-medium flex items-center gap-1">
                                <HiOutlineAcademicCap /> Unique modules
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion Rate</p>
                            <h3 className="text-3xl font-black text-emerald-600 truncate">{dashboardData.summary.completionRate.toFixed(1)}%</h3>
                            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <HiOutlineChartBar /> {selectedSite ? 'Site efficiency' : 'System efficiency'}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Status Breakdown (Pie) */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                                <span className="w-2 h-6 bg-blue-600 rounded-full mr-1"></span>
                                TNI Status Distribution
                            </h3>
                            <div className="h-[300px] w-full relative">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                        <PieChart>
                                            <Pie
                                                data={dashboardData.statusCounts}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {dashboardData.statusCounts.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Demand by Site (Interactive Pie/Donut) */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                                <span className="w-2 h-6 bg-emerald-600 rounded-full mr-1"></span>
                                Site Distribution
                            </h3>
                            <div className="h-[300px] w-full relative">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                        <PieChart>
                                            <Pie
                                                data={dashboardData.siteDemand}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                nameKey="name"
                                                onClick={(data) => data && handleSiteClick(data.name)}
                                                className="cursor-pointer outline-none"
                                            >
                                                {dashboardData.siteDemand.map((entry: any, index: number) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        stroke={selectedSite === entry.name ? '#000' : 'none'}
                                                        strokeWidth={2}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                height={36}
                                                onClick={(data) => data && handleSiteClick(data.value)}
                                                className="cursor-pointer"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            {selectedSite && (
                                <div className="mt-4 flex justify-center">
                                    <button 
                                        onClick={() => handleSiteClick(selectedSite)}
                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                    >
                                        Clear Site Filter: {selectedSite}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* PLANNING VIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Demand by Grade - Horizontal for variety */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                                <HiOutlineAcademicCap className="text-indigo-500" />
                                Demand by Employee Grade
                            </h3>
                            <div className="h-[300px] w-full relative">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                        <BarChart layout="vertical" data={dashboardData.gradeDemand} margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                            <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Radial Bar Chart: Site Demand Focus */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2 tracking-tight relative z-10">
                                <HiOutlineMap className="text-pink-500" />
                                Site Demand Radial Focus
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">
                                Click a ring to focus site metrics
                            </p>
                            
                            <div className="h-[320px] w-full relative">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                        <RadialBarChart 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius="30%" 
                                            outerRadius="100%" 
                                            barSize={15} 
                                            data={dashboardData.siteDemand.map((s: any, i: number) => ({
                                                ...s,
                                                fill: selectedSite === s.name ? COLORS[i % COLORS.length] : `${COLORS[i % COLORS.length]}88`
                                            }))}
                                        >
                                            <RadialBar
                                                label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 800 }}
                                                background
                                                dataKey="value"
                                                cornerRadius={15}
                                                onClick={(data) => handleSiteClick(data.name)}
                                                className="cursor-pointer transition-all duration-300"
                                            />
                                            <Tooltip 
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend 
                                                iconSize={10} 
                                                layout="vertical" 
                                                verticalAlign="middle" 
                                                align="right"
                                                onClick={(data) => handleSiteClick(data.value)}
                                                className="cursor-pointer"
                                                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                )}
                                {/* Center Label for Focused Site */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                        {selectedSite ? 'Focused' : 'All Sites'}
                                    </div>
                                    <div className="text-xl font-black text-slate-900 leading-none">
                                        {selectedSite ? dashboardData.siteDemand.find((s:any) => s.name === selectedSite)?.value : dashboardData.summary.totalNominations}
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1">
                                        Needs
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category-wise Demand Treemap */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                            <HiOutlineAcademicCap className="text-purple-500" />
                            Program Category Demand Density
                        </h3>
                        <div className="h-[300px] w-full relative">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                    <Treemap
                                        data={dashboardData.categoryDemand}
                                        dataKey="value"
                                        aspectRatio={4 / 3}
                                        stroke="#fff"
                                        fill="#8b5cf6"
                                    >
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                    </Treemap>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Departmental Demand (Full Width) */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                            <HiOutlineFunnel className="text-amber-500" />
                            Departmental Demand Breakdown
                        </h3>
                        <div className="h-[400px] w-full relative">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                                    <BarChart data={dashboardData.deptDemand}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                        <Bar dataKey="value" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Drill Down Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List of Programs with Demand */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[600px] flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 tracking-tight">
                        <HiOutlineAcademicCap className="text-blue-600" /> All Programs
                    </h3>
                    
                    {/* Search Input */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineMagnifyingGlass className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search programs..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {paginatedPrograms.map((prog: any) => (
                            <button
                                key={prog.id}
                                onClick={() => handleProgramClick(prog.id)}
                                className={`w-full text-left p-3 rounded-2xl border transition-all flex justify-between items-center ${selectedProgram === prog.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}
                            >
                                <div>
                                    <div className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${selectedProgram === prog.id ? 'text-blue-100' : 'text-slate-400'}`}>{prog.category}</div>
                                    <div className="text-xs font-bold leading-tight">{prog.name}</div>
                                </div>
                                <div className={`text-sm font-black px-2 py-1 rounded-lg ${selectedProgram === prog.id ? 'bg-white/20' : 'bg-blue-50 text-blue-700'}`}>
                                    {prog.count}
                                </div>
                            </button>
                        ))}
                        {filteredPrograms.length === 0 && (
                            <div className="text-center text-slate-400 text-xs py-10 italic">No programs found.</div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <HiOutlineChevronLeft size={16} className="text-slate-600" />
                            </button>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <HiOutlineChevronRight size={16} className="text-slate-600" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Depth: Participant List for Selected Program/Site */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                                <HiOutlineUsers className="text-emerald-600" /> 
                                {selectedSite && selectedProgram ? `Intersection: ${selectedSite} × ${data.topPrograms.find((p:any) => p.id === selectedProgram)?.name}` : 
                                 selectedSite ? `Site Report: ${selectedSite}` : 
                                 selectedProgram ? `Program Depth: ${data.topPrograms.find((p:any) => p.id === selectedProgram)?.name}` : 
                                 'Participant Depth'}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">
                                {selectedSite || selectedProgram ? `Showing pending nominations matching your filters.` : 'Click a program or site chart to see participants.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {(selectedProgram || selectedSite) && (
                                <button
                                    onClick={handleClearFilters}
                                    title="Clear All Filters"
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <HiOutlineTrash size={20} />
                                </button>
                            )}
                            {depthData.length > 0 && (
                                <button
                                    onClick={handleExportFiltered}
                                    title="Export to Excel"
                                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-200 active:scale-95"
                                >
                                    <HiOutlineArrowDownTray size={20} />
                                </button>
                            )}
                            {(selectedProgram || selectedSite) && (
                                <div className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">
                                    {depthData.length} Records
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50 rounded-2xl border border-slate-100 relative">
                        {isDepthLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : !(selectedProgram || selectedSite) ? (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-sm text-center px-10">
                                Select a program from the list or click a site bar in the charts to view participants.
                            </div>
                        ) : depthData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                                No pending participants found.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Employee</th>
                                        <th className="p-4 font-black text-slate-600 text-[10px] uppercase">{selectedSite ? 'Program' : 'Site & Dept'}</th>
                                        <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {depthData.map((nom: any) => (
                                        <tr key={nom.id} className="border-b border-slate-100 hover:bg-white transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{nom.employee.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{nom.employee.id}</div>
                                            </td>
                                            <td className="p-4">
                                                {selectedSite ? (
                                                    <>
                                                        <div className="text-slate-700 font-medium">{nom.program.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{nom.program.category}</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-slate-700 font-medium">{nom.employee.sectionName || 'N/A'}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{nom.employee.location || 'N/A'}</div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-slate-300">
                                                    {nom.employee.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
