'use client';

import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Sector
} from 'recharts';
import { HiOutlineArrowDownTray, HiOutlineChartBar, HiOutlineFunnel, HiOutlineUsers, HiOutlineAcademicCap, HiOutlineMap, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import * as XLSX from 'xlsx';
import { getProgramParticipantDepth } from '@/app/actions/reports';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const RADIAN = Math.PI / 180;

interface ReportsDashboardProps {
    data: any;
}

export default function ReportsDashboard({ data }: ReportsDashboardProps) {
    const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
    const [depthData, setDepthData] = useState<any[]>([]);
    const [isDepthLoading, setIsDepthLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'planning'>('overview');
    const [searchTerm, setSearchTerm] = useState('');

    // Filters (State)
    const [filters, setFilters] = useState({
        site: 'All',
        dept: 'All'
    });

    if (!data) return <div className="p-10 text-center text-slate-500 font-medium">No report data available.</div>;

    const handleExport = () => {
        const workbook = XLSX.utils.book_new();

        // 1. Top Programs Sheet
        const topProgSheet = XLSX.utils.json_to_sheet(data.topPrograms);
        XLSX.utils.book_append_sheet(workbook, topProgSheet, "Top Programs");

        // 2. Summary Sheet
        const summaryData = [
            { Metric: 'Total Employees', Value: data.summary.totalEmployees },
            { Metric: 'Total Unique Programs', Value: data.summary.totalUniquePrograms },
            { Metric: 'Total Nominations', Value: data.summary.totalNominations },
            { Metric: 'Completion Rate %', Value: data.summary.completionRate.toFixed(2) }
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary Metrics");

        // 3. Departmental Demand
        const deptSheet = XLSX.utils.json_to_sheet(data.deptDemand);
        XLSX.utils.book_append_sheet(workbook, deptSheet, "Department Demand");

        XLSX.writeFile(workbook, `TNI_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleProgramClick = async (programId: string) => {
        setSelectedProgram(programId);
        setIsDepthLoading(true);
        try {
            const result = await getProgramParticipantDepth(programId);
            setDepthData(result || []);
        } catch (error) {
            console.error("Failed to fetch depth", error);
        } finally {
            setIsDepthLoading(false);
        }
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
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Employees</p>
                            <h3 className="text-3xl font-black text-slate-900">{data.summary.totalEmployees.toLocaleString()}</h3>
                            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                                <HiOutlineUsers /> Across all sites
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active TNI Needs</p>
                            <h3 className="text-3xl font-black text-slate-900">{(data.statusCounts.find((s: any) => s.name === 'Pending')?.value || 0).toLocaleString()}</h3>
                            <div className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
                                <HiOutlineAcademicCap /> Pending fulfillment
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Courses in Catalog</p>
                            <h3 className="text-3xl font-black text-slate-900">{data.summary.totalUniquePrograms}</h3>
                            <div className="mt-2 text-xs text-purple-600 font-medium flex items-center gap-1">
                                <HiOutlineAcademicCap /> Unique modules
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion Rate</p>
                            <h3 className="text-3xl font-black text-emerald-600 truncate">{data.summary.completionRate.toFixed(1)}%</h3>
                            <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <HiOutlineChartBar /> System efficiency
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
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.statusCounts}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.statusCounts.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Programs (Bar) */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                                <span className="w-2 h-6 bg-indigo-600 rounded-full mr-1"></span>
                                Top Demand Programs (Top 10)
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={data.topPrograms.slice(0, 10)}
                                        margin={{ left: 40, right: 30 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            width={150} 
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => [`${value} Needs`, 'Volume']}
                                        />
                                        <Bar dataKey="count" fill="#4f46e5" radius={[0, 10, 10, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* PLANNING VIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Demand by Grade */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                                <HiOutlineAcademicCap className="text-indigo-500" />
                                Demand by Employee Grade
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.gradeDemand}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                        <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Demand by Site */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                                <HiOutlineMap className="text-emerald-500" />
                                Demand by Project Site
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.siteDemand}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                        <Bar dataKey="value" fill="#10b981" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Departmental Demand (Full Width) */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                            <HiOutlineFunnel className="text-amber-500" />
                            Departmental Demand Breakdown
                        </h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.deptDemand}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                    <Bar dataKey="value" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {data.topPrograms
                            .filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((prog: any) => (
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
                    </div>
                </div>

                {/* Depth: Participant List for Selected Program */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                                <HiOutlineUsers className="text-emerald-600" /> Participant Depth
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Click a program on the left to see identifying participants.</p>
                        </div>
                        {selectedProgram && (
                            <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                                {depthData.length} Waiting
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50 rounded-2xl border border-slate-100 relative">
                        {isDepthLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : !selectedProgram ? (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                                Select a program to view participants.
                            </div>
                        ) : depthData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                                No pending participants found for this program.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Employee</th>
                                        <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Site & Dept</th>
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
                                                <div className="text-slate-700 font-medium">{nom.employee.sectionName || 'N/A'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{nom.employee.location || 'N/A'}</div>
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
