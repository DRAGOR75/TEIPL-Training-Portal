'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { getTrainingHistory, deleteTrainingHistory, getTrainingHistoryFilters } from '@/app/actions/training-history';
import { HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineDocumentText } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import SearchableSelect from '@/components/ui/SearchableSelect';

export default function TrainingHistoryClient() {
    const [data, setData] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [page, setPage] = useState(1);
    const [searchName, setSearchName] = useState('');
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [programName, setProgramName] = useState('');
    const [region, setRegion] = useState('');
    const [organization, setOrganization] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const [filterYears, setFilterYears] = useState<string[]>([]);
    const [filterMonths, setFilterMonths] = useState<string[]>([]);
    const [filterProgramNames, setFilterProgramNames] = useState<string[]>([]);
    const [filterStartDates, setFilterStartDates] = useState<string[]>([]);
    const [filterRegion, setFilterRegion] = useState<string[]>([]);
    const [filterOrganization, setFilterOrganization] = useState<string[]>([]);

    useEffect(() => {
        getTrainingHistoryFilters().then(res => {
            setFilterYears(res.years);
            setFilterMonths(res.months);
            setFilterProgramNames(res.programNames);
            setFilterStartDates(res.startDates);
            setFilterRegion(res.regions);
            setFilterOrganization(res.organizations);
        }).catch(console.error);
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getTrainingHistory({
                page,
                pageSize: 20,
                searchName,
                year,
                month,
                sessionId,
                startDate,
                programName,
                region,
                organization,

            });
            setData(result.data);
            setTotalCount(result.totalCount);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load training history');
        } finally {
            setIsLoading(false);
        }
    }, [page, searchName, year, month, sessionId, startDate, programName, region, organization]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(debounce);
    }, [loadData]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        startTransition(async () => {
            const result = await deleteTrainingHistory(id);
            if (result.success) {
                toast.success('Record deleted successfully');
                loadData();
            } else {
                toast.error(result.error || 'Failed to delete record');
            }
        });
    };

    const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        setter(value);
        setPage(1); // Reset to first page on filter change
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col w-full">
                
                {/* Header & Controls Toolbar */}
                <div className="flex flex-col gap-4 mb-6 p-6 pb-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <HiOutlineDocumentText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Training History</h2>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">{totalCount} Records found</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2 relative z-20">
                        <div className="relative w-full">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Name, ID, Email..."
                                value={searchName}
                                onChange={(e) => handleFilterChange(setSearchName, e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 shadow-sm"
                            />
                        </div>

                        <div className="relative w-full">
                            <HiOutlineDocumentText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Filter by Session ID..."
                                value={sessionId}
                                onChange={(e) => handleFilterChange(setSessionId, e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 shadow-sm"
                            />
                        </div>

                        <div className="relative z-40">
                            <SearchableSelect
                                options={[{ label: "All Years", value: "" }, ...filterYears.map(y => ({ label: y, value: y }))]}
                                value={year}
                                onChange={(val) => handleFilterChange(setYear, typeof val === 'string' ? val : String(val))}
                                placeholder="All Years"
                                searchPlaceholder="Search years..."
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="relative z-30">
                            <SearchableSelect
                                options={[{ label: "All Months", value: "" }, ...filterMonths.map(m => ({ label: m, value: m }))]}
                                value={month}
                                onChange={(val) => handleFilterChange(setMonth, typeof val === 'string' ? val : String(val))}
                                placeholder="All Months"
                                searchPlaceholder="Search months..."
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="relative z-20">
                            <SearchableSelect
                                options={[{ label: "All Dates", value: "" }, ...filterStartDates.map(d => ({ label: d, value: d }))]}
                                value={startDate}
                                onChange={(val) => handleFilterChange(setStartDate, typeof val === 'string' ? val : String(val))}
                                placeholder="All Dates"
                                searchPlaceholder="Search dates..."
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="relative z-40">
                            <SearchableSelect
                                options={[{ label: "All Programs", value: "" }, ...filterProgramNames.map(p => ({ label: p, value: p }))]}
                                value={programName}
                                onChange={(val) => handleFilterChange(setProgramName, typeof val === 'string' ? val : String(val))}
                                placeholder="All Programs"
                                searchPlaceholder="Search programs..."
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="relative z-30">
                            <SearchableSelect
                                options={[{ label: "All Regions", value: "" }, ...filterRegion.map(p => ({ label: p, value: p }))]}
                                value={region}
                                onChange={(val) => handleFilterChange(setRegion, typeof val === 'string' ? val : String(val))}
                                placeholder="All Regions"
                                searchPlaceholder="Search regions..."
                                className="w-full text-sm"
                            />
                        </div>

                        <div className="relative z-20">
                            <SearchableSelect
                                options={[{ label: "All Organizations", value: "" }, ...filterOrganization.map(p => ({ label: p, value: p }))]}
                                value={organization}
                                onChange={(val) => handleFilterChange(setOrganization, typeof val === 'string' ? val : String(val))}
                                placeholder="All Organizations"
                                searchPlaceholder="Search orgs..."
                                className="w-full text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm relative mx-4 sm:mx-6 mb-4 min-h-[550px]">
                    <table className="w-full table-fixed text-xs text-left min-w-[1000px]">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm before:content-[''] before:absolute before:inset-0 before:border-b before:border-slate-200 before:pointer-events-none">
                            <tr>
                                <th className="px-4 py-3 w-[20%]">Employee</th>
                                <th className="px-4 py-3 w-[25%]">Program</th>
                                <th className="px-4 py-3 w-[15%]">Dates</th>
                                <th className="px-4 py-3 w-[15%] text-center">Year & Month</th>
                                <th className="px-4 py-3 w-[15%]">Session ID</th>
                                <th className="px-4 py-3 w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <HiOutlineDocumentText size={32} className="text-slate-300 animate-pulse" />
                                            <span>Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <HiOutlineDocumentText size={32} className="text-slate-300" />
                                            <span>No records found matching your filters.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900 truncate" title={record.employeeName}>{record.employeeName}</div>
                                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                                                {record.empId}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-800 truncate" title={record.programName}>{record.programName}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-600 font-medium">
                                                {record.startDate ? new Date(record.startDate).toLocaleDateString() : '-'}
                                                {record.endDate && record.endDate !== record.startDate && ` to ${new Date(record.endDate).toLocaleDateString()}`}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="font-bold text-slate-700">{record.year || '-'}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-medium">{record.month || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate block w-max max-w-[120px]" title={record.sessionId || ''}>
                                                {record.sessionId || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={isPending}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 disabled:opacity-50"
                                                title="Delete Record"
                                            >
                                                <HiOutlineTrash className="w-5 h-5" />
                                            </button>
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
                            Showing <span className="font-bold text-slate-700">{(page - 1) * 20 + 1}</span> to <span className="font-bold text-slate-700">{Math.min(page * 20, totalCount)}</span> of <span className="font-bold text-slate-700">{totalCount}</span> records
                        </p>
                        <div className="flex gap-1.5">
                            <button
                                disabled={page === 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Prev
                            </button>

                            {/* Simple pagination numbers for server-side */}
                            {Array.from({ length: totalPages }).map((_, i) => {
                                if (totalPages > 5) {
                                    if (i !== 0 && i !== totalPages - 1 && Math.abs(page - 1 - i) > 1) {
                                        if (i === 1 || i === totalPages - 2) return <span key={i} className="px-2 py-1 text-slate-400 font-bold">...</span>;
                                        return null;
                                    }
                                }
                                return (
                                    <button
                                        key={i}
                                        disabled={isLoading}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${page === i + 1 ? 'bg-blue-600 text-white shadow-blue-200 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 disabled:opacity-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}

                            <button
                                disabled={page === totalPages || isLoading}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
