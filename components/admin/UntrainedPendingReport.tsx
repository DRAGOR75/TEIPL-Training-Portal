'use client';

import { useState } from 'react';
import { HiOutlineArrowDownTray, HiOutlineUsers, HiOutlineAcademicCap } from 'react-icons/hi2';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899'];

interface EmployeeWithNominations {
    id: string;
    name: string;
    email: string;
    grade: string | null;
    sectionName: string | null;
    location: string | null;
    projectLocation: string | null;
    managerName: string | null;
    nominations: {
        id: string;
        status: string;
        program: {
            name: string;
            category: string;
        };
    }[];
}

export default function UntrainedPendingReport({ employees }: { employees: EmployeeWithNominations[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const safeEmployees = employees || [];

    const filteredEmployees = safeEmployees.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.sectionName && e.sectionName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Compute chart data
    const locationData = Object.entries(
        safeEmployees.reduce((acc, emp) => {
            const loc = emp.location || 'Unknown';
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const deptData = Object.entries(
        safeEmployees.reduce((acc, emp) => {
            const dept = emp.sectionName || 'Unknown';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleExport = () => {
        if (safeEmployees.length === 0) return;

        const exportData = safeEmployees.flatMap(e => 
            e.nominations.map(nom => ({
                EmployeeID: e.id,
                EmployeeName: e.name,
                Email: e.email || '',
                Grade: e.grade || '',
                Department: e.sectionName || '',
                Location: e.location || '',
                ProjectLocation: e.projectLocation || '',
                ManagerName: e.managerName || '',
                ProgramName: nom.program.name,
                Category: nom.program.category
            }))
        );

        const sheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, "Untrained Pending");
        XLSX.writeFile(workbook, `Untrained_Pending_TNI_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border-b border-slate-100">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                        <HiOutlineUsers className="text-amber-500" /> Untrained Participants
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Employees with pending TNIs but no training history.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="flex-1 md:w-64 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-200 active:scale-95 whitespace-nowrap"
                    >
                        <HiOutlineArrowDownTray size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Dashboard Visuals */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 border-b border-slate-100">
                {/* Summary Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Untrained Pending</p>
                    <h3 className="text-5xl font-black text-amber-600 mb-2">{safeEmployees.length}</h3>
                    <p className="text-xs text-slate-500 font-medium max-w-[200px]">
                        Employees needing immediate training scheduling.
                    </p>
                </div>

                {/* Location Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-4 bg-emerald-500 rounded-full"></span> Location Breakdown
                    </h4>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={locationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {locationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Departments Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-4 bg-blue-500 rounded-full"></span> Top Departments
                    </h4>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Employee</th>
                            <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Dept / Location</th>
                            <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Manager</th>
                            <th className="p-4 font-black text-slate-600 text-[10px] uppercase">Pending Programs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedEmployees.length > 0 ? paginatedEmployees.map(emp => (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-900">{emp.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{emp.id}</div>
                                    {emp.grade && (
                                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {emp.grade}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="text-slate-700 font-medium text-[11px]">{emp.sectionName || '-'}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{emp.location || '-'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-slate-700 font-medium text-[11px]">{emp.managerName || '-'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        {emp.nominations.map(nom => (
                                            <div key={nom.id} className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-100 text-[10px] w-fit">
                                                <HiOutlineAcademicCap size={12} className="text-amber-500" />
                                                <span className="font-bold truncate max-w-[200px]" title={nom.program.name}>{nom.program.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500 italic text-sm">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded text-sm font-bold text-slate-600 bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                    >
                        Prev
                    </button>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded text-sm font-bold text-slate-600 bg-white border border-slate-200 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
