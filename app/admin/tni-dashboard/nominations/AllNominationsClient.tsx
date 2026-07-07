'use client';

import { useState, useMemo } from 'react';
import {
    HiOutlineMagnifyingGlass,
    HiOutlineNoSymbol,
    HiOutlineArrowsPointingIn,
    HiOutlineArrowsPointingOut,
    HiOutlineDocumentArrowDown,
    HiOutlineDocumentText
} from 'react-icons/hi2';
import { markNominationInactive } from '@/app/actions/tni';
import { exportToExcel } from '@/lib/export-utils';

interface Props {
    nominations: any[];
}

export default function AllNominationsClient({ nominations }: Props) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [designationFilter, setDesignationFilter] = useState('All');
    const [isMarking, setIsMarking] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredNominations = useMemo(() => {
        return nominations.filter((nom) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                nom.employee?.name?.toLowerCase().includes(query) ||
                nom.employee?.id?.toLowerCase().includes(query) ||
                nom.program?.name?.toLowerCase().includes(query) ||
                nom.employee?.email?.toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'All' || nom.status === statusFilter;
            const matchesLocation = locationFilter === 'All' || nom.employee?.location === locationFilter;
            const matchesDesignation = designationFilter === 'All' || nom.employee?.designation === designationFilter;

            return matchesSearch && matchesStatus && matchesLocation && matchesDesignation;
        });
    }, [nominations, searchQuery, statusFilter, locationFilter, designationFilter]);

    const uniqueStatuses = useMemo(() => Array.from(new Set(nominations.map(n => n.status))), [nominations]);
    const uniqueLocations = useMemo(() => Array.from(new Set(nominations.map(n => n.employee?.location).filter(Boolean))).sort(), [nominations]);
    const uniqueDesignations = useMemo(() => Array.from(new Set(nominations.map(n => n.employee?.designation).filter(Boolean))).sort(), [nominations]);

    const totalPages = Math.ceil(filteredNominations.length / itemsPerPage) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedNominations = filteredNominations.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

    useMemo(() => { setCurrentPage(1); }, [searchQuery, statusFilter, locationFilter, designationFilter, itemsPerPage]);

    const handleMarkInactive = async (id: string) => {
        if (!confirm('Are you sure you want to mark this TNI as Inactive? It will no longer be used for anything.')) return;

        setIsMarking(id);
        const result = await markNominationInactive(id);
        if (!result.success) {
            alert(result.error || 'Failed to mark inactive.');
        }
        setIsMarking(null);
    };

    return (
        <div className={isFullscreen
            ? "fixed inset-0 z-[100] bg-slate-50 overflow-hidden flex flex-col p-2 md:p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            : "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        }>
            <div className={`flex flex-col ${isFullscreen ? 'flex-1 w-full min-h-0' : 'w-full'}`}>

                {/* Header & Controls Toolbar */}
                <div className={`flex flex-col gap-4 mb-6 ${isFullscreen ? '' : 'p-6 pb-0'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <HiOutlineDocumentText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">All Nominations (TNI)</h2>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">{filteredNominations.length} Records found</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search employee or program..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 shadow-sm"
                            />
                        </div>
                        <select
                            value={designationFilter}
                            onChange={(e) => setDesignationFilter(e.target.value)}
                            className="py-2 pl-3 pr-8 border border-slate-200 bg-white rounded-xl text-sm outline-none text-slate-700 shadow-sm cursor-pointer max-w-[150px]"
                        >
                            <option value="All">All Designations</option>
                            {uniqueDesignations.map(desig => (
                                <option key={desig as string} value={desig as string}>{desig as string}</option>
                            ))}
                        </select>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="py-2 pl-3 pr-8 border border-slate-200 bg-white rounded-xl text-sm outline-none text-slate-700 shadow-sm cursor-pointer max-w-[150px]"
                        >
                            <option value="All">All Locations</option>
                            {uniqueLocations.map(loc => (
                                <option key={loc as string} value={loc as string}>{loc as string}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2 pl-3 pr-8 border border-slate-200 bg-white rounded-xl text-sm outline-none text-slate-700 shadow-sm cursor-pointer max-w-[150px]"
                        >
                            <option value="All">All Statuses</option>
                            {uniqueStatuses.map(status => (
                                <option key={status as string} value={status as string}>{status as string}</option>
                            ))}
                        </select>

                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="py-2 pl-3 pr-8 border border-slate-200 bg-white rounded-xl text-sm outline-none font-bold text-slate-700 shadow-sm cursor-pointer hidden sm:block"
                        >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>

                        <button
                            onClick={() => {
                                const nextState = !isFullscreen;
                                setIsFullscreen(nextState);
                                if (nextState && itemsPerPage === 10) setItemsPerPage(25);
                                if (!nextState && itemsPerPage === 25) setItemsPerPage(10);
                            }}
                            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 bg-white transition-colors hidden sm:block shadow-sm"
                            title={isFullscreen ? "Exit Zen Mode" : "Enter Zen Mode"}
                        >
                            {isFullscreen ? <HiOutlineArrowsPointingIn size={18} /> : <HiOutlineArrowsPointingOut size={18} />}
                        </button>

                        <button
                            onClick={() => {
                                const exportData = filteredNominations.map(nom => ({
                                    'Emp ID': nom.employee?.id || '',
                                    'Name': nom.employee?.name || '',
                                    'Email': nom.employee?.email || '',
                                    'Section': nom.employee?.sectionName || '',
                                    'Designation': nom.employee?.designation || '',
                                    'Location': nom.employee?.location || '',
                                    'Grade': nom.employee?.grade || '',
                                    'Manager': nom.employee?.managerName || '',
                                    'Program Name': nom.program?.name || '',
                                    'Program Category': nom.program?.category || '',
                                    'Status': nom.status,
                                    'Manager Approval': nom.managerApprovalStatus,
                                    'Submitted Date': nom.createdAt ? new Date(nom.createdAt).toLocaleDateString() : '',
                                    'Justification': nom.justification || ''
                                }));
                                exportToExcel(exportData, 'All_Nominations');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <HiOutlineDocumentArrowDown size={18} />
                            <span className="hidden sm:inline">Export to Excel</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className={`overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm relative ${isFullscreen ? 'flex-1 min-h-0 overflow-y-auto' : 'mx-4 sm:mx-6 mb-4 min-h-[550px]'}`}>
                    <table className={`w-full table-fixed text-xs text-left ${isFullscreen ? 'min-w-[1800px]' : 'min-w-[1100px]'}`}>
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm before:content-[''] before:absolute before:inset-0 before:border-b before:border-slate-200 before:pointer-events-none">
                            <tr>
                                <th className="pl-3 pr-1 py-3 w-[40px] text-center">No</th>
                                {isFullscreen ? (
                                    <>
                                        <th className="px-4 py-3 w-[12%]">Employee Name</th>
                                        <th className="px-4 py-3 w-[12%]">Email</th>
                                        <th className="px-4 py-3 w-[8%]">Emp ID</th>
                                        <th className="px-4 py-3 w-[10%]">Section</th>
                                        <th className="px-4 py-3 w-[10%]">Designation</th>
                                        <th className="px-4 py-3 w-[6%]">Grade</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-3 w-[18%]">Employee</th>
                                        <th className="px-4 py-3 w-[12%]">ID & Grade</th>
                                        <th className="px-4 py-3 w-[14%]">Designation</th>
                                    </>
                                )}
                                <th className="px-4 py-3 w-[10%]">Location</th>
                                {isFullscreen ? (
                                    <>
                                        <th className="px-4 py-3 w-[14%]">Program Name</th>
                                        <th className="px-4 py-3 w-[8%]">Category</th>
                                        <th className="px-4 py-3 w-[8%]">Status</th>
                                        <th className="px-4 py-3 w-[10%]">Manager Approval</th>
                                        <th className="px-4 py-3 w-[10%]">Manager Name</th>
                                        <th className="px-4 py-3 w-[8%]">Submitted</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-3 w-[18%]">Program</th>
                                        <th className="px-4 py-3 w-[14%]">Status</th>
                                    </>
                                )}
                                <th className="px-4 py-3 w-[8%] text-right">Mark as Inactive</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedNominations.length === 0 ? (
                                <tr>
                                    <td colSpan={isFullscreen ? 15 : 8} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <HiOutlineDocumentText size={32} className="text-slate-300" />
                                            <span>No nominations found matching your filters.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedNominations.map((nom, index) => (
                                    <tr key={nom.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="pl-3 pr-1 py-2 text-center text-[10px] font-bold text-slate-400">
                                            {(safeCurrentPage - 1) * itemsPerPage + index + 1}
                                        </td>

                                        {isFullscreen ? (
                                            <>
                                                <td className="px-4 py-3"><div className="font-bold text-slate-900 truncate">{nom.employee?.name}</div></td>
                                                <td className="px-4 py-3"><div className="text-slate-500 truncate" title={nom.employee?.email}>{nom.employee?.email || '-'}</div></td>
                                                <td className="px-4 py-3"><span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{nom.employee?.id}</span></td>
                                                <td className="px-4 py-3"><div className="font-medium text-slate-700 truncate" title={nom.employee?.sectionName}>{nom.employee?.sectionName || '-'}</div></td>
                                                <td className="px-4 py-3"><div className="text-slate-600 truncate" title={nom.employee?.designation}>{nom.employee?.designation || '-'}</div></td>
                                                <td className="px-4 py-3">
                                                    {nom.employee?.grade ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{nom.employee?.grade}</span>
                                                    ) : '-'}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-900 truncate">{nom.employee?.name}</div>
                                                    <div className="text-[10px] text-slate-500 truncate" title={nom.employee?.email}>{nom.employee?.email || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mb-1 block w-max">{nom.employee?.id}</span>
                                                    {nom.employee?.grade && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{nom.employee?.grade}</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-slate-600 truncate" title={nom.employee?.designation}>{nom.employee?.designation || '-'}</div>
                                                    <div className="text-[10px] text-slate-400 truncate" title={nom.employee?.sectionName}>{nom.employee?.sectionName || '-'}</div>
                                                </td>
                                            </>
                                        )}

                                        <td className="px-4 py-3"><div className="font-medium text-slate-600 truncate">{nom.employee?.location || '-'}</div></td>

                                        {isFullscreen ? (
                                            <>
                                                <td className="px-4 py-3"><div className="font-bold text-slate-800 truncate" title={nom.program?.name}>{nom.program?.name}</div></td>
                                                <td className="px-4 py-3"><div className="text-[10px] text-slate-500 uppercase font-medium">{nom.program?.category}</div></td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${nom.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : nom.status === 'Inactive' ? 'bg-slate-100 text-slate-500 border-slate-200' : nom.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : nom.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>{nom.status}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${nom.managerApprovalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : nom.managerApprovalStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{nom.managerApprovalStatus}</span>
                                                </td>
                                                <td className="px-4 py-3"><div className="text-slate-600 truncate" title={nom.employee?.managerName}>{nom.employee?.managerName || '-'}</div></td>
                                                <td className="px-4 py-3"><div className="text-[10px] text-slate-500">{nom.createdAt ? new Date(nom.createdAt).toLocaleDateString() : '-'}</div></td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-800 truncate" title={nom.program?.name}>{nom.program?.name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase">{nom.program?.category}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="mb-1">
                                                        <span className="text-[9px] font-bold text-slate-400 mr-1">TNI:</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${nom.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : nom.status === 'Inactive' ? 'bg-slate-100 text-slate-500 border-slate-200' : nom.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : nom.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>{nom.status}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-400 mr-1">MGR:</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${nom.managerApprovalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : nom.managerApprovalStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{nom.managerApprovalStatus}</span>
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        <td className="px-4 py-3 text-right">
                                            {(nom.status === 'Pending' || nom.status === 'Approved') && (
                                                <button
                                                    onClick={() => handleMarkInactive(nom.id)}
                                                    disabled={isMarking === nom.id}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 disabled:opacity-50"
                                                    title="Mark as Inactive"
                                                >
                                                    {isMarking === nom.id ? <HiOutlineDocumentArrowDown className="w-5 h-5 animate-spin" /> : <HiOutlineNoSymbol className="w-5 h-5" />}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 px-4 sm:px-6 pb-6">
                        <p className="text-xs text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-700">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(safeCurrentPage * itemsPerPage, filteredNominations.length)}</span> of <span className="font-bold text-slate-700">{filteredNominations.length}</span> nominations
                        </p>
                        <div className="flex gap-1.5">
                            <button
                                disabled={safeCurrentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Prev
                            </button>

                            {Array.from({ length: totalPages }).map((_, i) => {
                                if (totalPages > 5) {
                                    if (i !== 0 && i !== totalPages - 1 && Math.abs(safeCurrentPage - 1 - i) > 1) {
                                        if (i === 1 || i === totalPages - 2) return <span key={i} className="px-2 py-1 text-slate-400 font-bold">...</span>;
                                        return null;
                                    }
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${safeCurrentPage === i + 1 ? 'bg-blue-600 text-white shadow-blue-200 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}

                            <button
                                disabled={safeCurrentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
