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
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineMagnifyingGlass className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Employee Name..."
                            value={searchName}
                            onChange={(e) => handleFilterChange(setSearchName, e.target.value)}
                            className="pl-10 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineDocumentText className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by Session ID..."
                            value={sessionId}
                            onChange={(e) => handleFilterChange(setSessionId, e.target.value)}
                            className="pl-10 w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="relative z-40">
                        <SearchableSelect
                            options={[{ label: "All Years", value: "" }, ...filterYears.map(y => ({ label: y, value: y }))]}
                            value={year}
                            onChange={(val) => handleFilterChange(setYear, typeof val === 'string' ? val : String(val))}
                            placeholder="All Years"
                            searchPlaceholder="Search years..."
                            className="w-full"
                        />
                    </div>

                    <div className="relative z-30">
                        <SearchableSelect
                            options={[{ label: "All Months", value: "" }, ...filterMonths.map(m => ({ label: m, value: m }))]}
                            value={month}
                            onChange={(val) => handleFilterChange(setMonth, typeof val === 'string' ? val : String(val))}
                            placeholder="All Months"
                            searchPlaceholder="Search months..."
                            className="w-full"
                        />
                    </div>

                    <div className="relative z-20">
                        <SearchableSelect
                            options={[{ label: "All Dates", value: "" }, ...filterStartDates.map(d => ({ label: d, value: d }))]}
                            value={startDate}
                            onChange={(val) => handleFilterChange(setStartDate, typeof val === 'string' ? val : String(val))}
                            placeholder="All Dates"
                            searchPlaceholder="Search start dates..."
                            className="w-full"
                        />
                    </div>

                    <div className="relative z-10">
                        <SearchableSelect
                            options={[{ label: "All Programs", value: "" }, ...filterProgramNames.map(p => ({ label: p, value: p }))]}
                            value={programName}
                            onChange={(val) => handleFilterChange(setProgramName, typeof val === 'string' ? val : String(val))}
                            placeholder="All Programs"
                            searchPlaceholder="Search programs..."
                            className="w-full"
                        />
                    </div>
                    <div className="relative z-10">
                        <SearchableSelect
                            options={[{ label: "All Regions", value: "" }, ...filterRegion.map(p => ({ label: p, value: p }))]}
                            value={region}
                            onChange={(val) => handleFilterChange(setRegion, typeof val === 'string' ? val : String(val))}
                            placeholder="All Regions"
                            searchPlaceholder="Search regions..."
                            className="w-full"
                        />
                    </div>
                    <div className="relative z-10">
                        <SearchableSelect
                            options={[{ label: "All Organizations", value: "" }, ...filterOrganization.map(p => ({ label: p, value: p }))]}
                            value={organization}
                            onChange={(val) => handleFilterChange(setOrganization, typeof val === 'string' ? val : String(val))}
                            placeholder="All Organizations"
                            searchPlaceholder="Search organizations..."
                            className="w-full"
                        />
                    </div>

                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                                <th className="p-4 font-semibold text-sm">Employee Name</th>
                                <th className="p-4 font-semibold text-sm">Program Name</th>
                                <th className="p-4 font-semibold text-sm">Dates</th>
                                <th className="p-4 font-semibold text-sm">Year</th>
                                <th className="p-4 font-semibold text-sm">Month</th>
                                <th className="p-4 font-semibold text-sm">Session ID</th>

                                <th className="p-4 font-semibold text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        Loading records...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900">{record.employeeName}</div>
                                            <div className="text-xs text-slate-500">{record.empId}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">{record.programName}</td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {new Date(record.startDate).toLocaleDateString()} - {new Date(record.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {record.year}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {record.month}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700 font-mono text-xs truncate max-w-[120px]" title={record.sessionId || ''}>
                                            {record.sessionId || 'N/A'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={isPending}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete Record"
                                            >
                                                <HiOutlineTrash size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm">
                        <div className="text-slate-600">
                            Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                            {' '}({totalCount} total records)
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                                className="px-3 py-1 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || isLoading}
                                className="px-3 py-1 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
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
