'use client';

import { useState, useMemo, useRef } from 'react';
import { createEmployee, deleteEmployee, updateEmployee } from '@/app/actions/master-data';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import {
    HiOutlineTrash,
    HiOutlineUsers,
    HiOutlinePlus,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineArrowUpTray,
    HiOutlineTableCells,
    HiOutlineArrowPath,
    HiOutlineDocumentArrowDown,
    HiOutlineMagnifyingGlass,
    HiOutlineXMark,
    HiOutlineArrowsPointingIn,
    HiOutlineArrowsPointingOut,
    HiOutlinePencilSquare
} from 'react-icons/hi2';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { exportToExcel } from '@/lib/export-utils';

interface Employee {
    id: string; // emp_id
    name: string;
    email: string;
    grade: string | null;
    status: string;
    sectionName: string | null;
    location: string | null;
    mobile: string | null;
    designation: string | null;
    doj: Date | null;
    dob: Date | null;
    projectLocation: string | null;
    gender: string | null;
    managerName: string | null;
    managerEmail: string | null;
    managerMobile: string | null;
}

export default function EmployeeManager({ employees }: { employees: Employee[] }) {
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Pagination & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [selectedGrade, setSelectedGrade] = useState('EXECUTIVE');
    const [selectedGender, setSelectedGender] = useState('');

    // Filter and Paginate
    const filteredEmployees = useMemo(() => {
        return employees.filter(e => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = e.name.toLowerCase().includes(query) ||
                e.id.toLowerCase().includes(query) ||
                (e.email && e.email.toLowerCase().includes(query)) ||
                (e.sectionName && e.sectionName.toLowerCase().includes(query));
            
            // Assume location or projectLocation serves as Region
            const regionVal = e.location || e.projectLocation;
            const matchesRegion = selectedRegion ? regionVal === selectedRegion : true;

            return matchesSearch && matchesRegion;
        });
    }, [employees, searchQuery, selectedRegion]);

    const regions = useMemo(() => {
        const uniqueRegions = Array.from(new Set(employees.map(e => e.location || e.projectLocation).filter(Boolean)));
        return uniqueRegions.sort() as string[];
    }, [employees]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedEmployees = filteredEmployees.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

    useMemo(() => { setCurrentPage(1); }, [searchQuery, itemsPerPage, selectedRegion]);

    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createEmployee(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else {
            setIsAddModalOpen(false);
            setSelectedGrade('EXECUTIVE');
            setSelectedGender('');
        }
    }

    async function handleEdit(formData: FormData) {
        if (!editingEmployee) return;
        setLoading(true);
        const result = await updateEmployee(editingEmployee.id, formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else {
            setEditingEmployee(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete employee?')) return;
        setDeletingId(id);
        const result = await deleteEmployee(id);
        if (result?.error) alert(result.error);
        setDeletingId(null);
    }

    const EmployeeModal = ({ employee, isEdit }: { employee?: Employee | null, isEdit: boolean }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-center z-10 rounded-t-3xl">
                    <h2 className="text-xl font-black text-slate-800">
                        {isEdit ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
                    <button
                        onClick={() => isEdit ? setEditingEmployee(null) : setIsAddModalOpen(false)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <HiOutlineXMark size={24} />
                    </button>
                </div>
                <form action={isEdit ? handleEdit : handleAdd} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Emp ID *</label>
                            <input name="id" required defaultValue={employee?.id} placeholder="E.g. E00123" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all disabled:opacity-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Grade</label>
                            <SearchableSelect
                                name="grade"
                                options={[
                                    { label: 'Executive', value: 'EXECUTIVE' },
                                    { label: 'Workman', value: 'WORKMAN' }
                                ]}
                                value={isEdit ? employee?.grade || 'EXECUTIVE' : selectedGrade}
                                onChange={isEdit ? (val) => setEditingEmployee(prev => prev ? { ...prev, grade: val } : null) : setSelectedGrade}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Name *</label>
                        <input name="name" required defaultValue={employee?.name} placeholder="John Doe" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address *</label>
                        <input name="email" type="email" required defaultValue={employee?.email} placeholder="john.doe@example.com" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Section</label>
                            <input name="sectionName" defaultValue={employee?.sectionName || ''} placeholder="E.g. Engineering" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Designation</label>
                            <input name="designation" defaultValue={employee?.designation || ''} placeholder="E.g. Senior Engineer" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Name</label>
                            <input name="managerName" defaultValue={employee?.managerName || ''} placeholder="Manager Name" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Email</label>
                            <input name="managerEmail" type="email" defaultValue={employee?.managerEmail || ''} placeholder="manager@example.com" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Mobile</label>
                            <input name="managerMobile" defaultValue={employee?.managerMobile || ''} placeholder="+91..." className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Gender</label>
                            <SearchableSelect
                                name="gender"
                                options={[
                                    { label: 'Male', value: 'MALE' },
                                    { label: 'Female', value: 'FEMALE' },
                                    { label: 'Other', value: 'OTHER' }
                                ]}
                                value={isEdit ? employee?.gender || '' : selectedGender}
                                onChange={isEdit ? (val) => setEditingEmployee(prev => prev ? { ...prev, gender: val } : null) : setSelectedGender}
                                placeholder="Select Gender"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date of Joining</label>
                            <input type="date" name="doj" defaultValue={employee?.doj ? new Date(employee.doj).toISOString().split('T')[0] : ''} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</label>
                            <input type="date" name="dob" defaultValue={employee?.dob ? new Date(employee.dob).toISOString().split('T')[0] : ''} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-800 transition-all" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => isEdit ? setEditingEmployee(null) : setIsAddModalOpen(false)}
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <FormSubmitButton className="px-8 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200 flex items-center gap-2">
                            {isEdit ? 'Save Changes' : <><HiOutlinePlus size={18} /> Add Employee</>}
                        </FormSubmitButton>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className={isFullscreen
            ? "fixed inset-0 z-[100] bg-slate-50 overflow-hidden flex flex-col p-2 md:p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            : "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6"
        }>
            <div className={`flex flex-col ${isFullscreen ? 'flex-1 w-full min-h-0' : 'w-full'}`}>

                {/* Header & Controls Toolbar */}
                <div className={`flex flex-col gap-4 mb-6 ${isFullscreen ? '' : 'p-4 sm:p-6 pb-0'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                            <HiOutlineUsers size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Employee Directory</h2>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">{employees.length} Records</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-700 shadow-sm"
                            />
                        </div>
                        {/* Region Filter */}
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="py-2 pl-3 pr-8 border border-slate-200 bg-white rounded-xl text-sm outline-none text-slate-700 shadow-sm cursor-pointer"
                        >
                            <option value="">All Regions</option>
                            {regions.map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                        {/* Show Dropdown */}
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

                        {/* Zen Mode */}
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

                        {/* Export Button */}
                        <button
                            onClick={() => {
                                const exportData = employees.map(e => ({
                                    'Emp ID': e.id,
                                    'Name': e.name,
                                    'Email': e.email,
                                    'Status': e.status,
                                    'Grade': e.grade || '',
                                    'Designation': e.designation || '',
                                    'Section': e.sectionName || '',
                                    'Location': e.location || '',
                                    'Mobile': e.mobile || '',
                                    'Date of Joining': e.doj ? new Date(e.doj).toLocaleDateString() : '',
                                    'Date of Birth': e.dob ? new Date(e.dob).toLocaleDateString() : '',
                                    'Project Location': e.projectLocation || '',
                                    'Gender': e.gender || '',
                                    'Manager Name': e.managerName || '',
                                    'Manager Email': e.managerEmail || '',
                                    'Manager Mobile': e.managerMobile || ''
                                }));
                                exportToExcel(exportData, 'Employee_Directory');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <HiOutlineDocumentArrowDown size={18} />
                            <span className="hidden sm:inline">Export to Excel</span>
                        </button>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-lg shadow-purple-200 text-sm"
                        >
                            <HiOutlinePlus size={18} className="stroke-[2.5]" />
                            <span className="hidden sm:inline">Add Employee</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className={`overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm relative ${isFullscreen ? 'flex-1 min-h-0 overflow-y-auto' : 'mx-4 sm:mx-6 mb-4 min-h-[550px]'}`}>
                    <table className={`w-full table-fixed text-xs text-left ${isFullscreen ? 'min-w-[1400px]' : 'min-w-[1000px]'}`}>
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm before:content-[''] before:absolute before:inset-0 before:border-b before:border-slate-200 before:pointer-events-none">
                            <tr>
                                <th className="pl-3 pr-1 py-3 w-[35px] text-center">No</th>
                                {isFullscreen ? (
                                    <>
                                        <th className="px-4 py-3 w-[12%]">Name</th>
                                        <th className="px-4 py-3 w-[12%]">Email</th>
                                    </>
                                ) : (
                                    <th className="px-4 py-3 w-[20%]">Employee</th>
                                )}
                                <th className="px-4 py-3 w-[8%]">Emp ID</th>
                                {isFullscreen ? (
                                    <>
                                        <th className="px-4 py-3 w-[12%]">Section</th>
                                        <th className="px-4 py-3 w-[12%]">Designation</th>
                                    </>
                                ) : (
                                    <th className="px-4 py-3 w-[20%]">Section & Designation</th>
                                )}
                                <th className="px-4 py-3 w-[8%]">Grade</th>
                                {isFullscreen ? (
                                    <>
                                        <th className="px-4 py-3 w-[10%]">Manager Name</th>
                                        <th className="px-4 py-3 w-[8%]">Manager Mobile</th>
                                    </>
                                ) : (
                                    <th className="px-4 py-3 w-[16%]">Manager</th>
                                )}
                                <th className="px-4 py-3 w-[8%]">DOJ</th>
                                <th className="px-4 py-3 w-[6%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedEmployees.length > 0 ? paginatedEmployees.map((emp, index) => (
                                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="pl-3 pr-1 py-2 text-center text-[10px] font-bold text-slate-400">
                                        {(safeCurrentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    {isFullscreen ? (
                                        <>
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-slate-900 text-[11px] truncate">{emp.name}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-[10px] text-slate-500 font-medium truncate" title={emp.email}>{emp.email}</div>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-slate-900 text-[11px] truncate">{emp.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium truncate" title={emp.email}>{emp.email}</div>
                                        </td>
                                    )}
                                    <td className="px-3 py-2">
                                        <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                            {emp.id}
                                        </span>
                                    </td>
                                    {isFullscreen ? (
                                        <>
                                            <td className="px-3 py-2">
                                                <div className="text-[10px] font-bold text-slate-700 truncate" title={emp.sectionName || ''}>{emp.sectionName || '-'}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-[10px] text-slate-600 truncate" title={emp.designation || ''}>{emp.designation || '-'}</div>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="px-3 py-2">
                                            <div className="text-[10px] font-bold text-slate-700 truncate" title={emp.sectionName || ''}>{emp.sectionName || '-'}</div>
                                            <div className="text-[10px] text-slate-600 truncate" title={emp.designation || ''}>{emp.designation || '-'}</div>
                                        </td>
                                    )}
                                    <td className="px-3 py-2">
                                        {emp.grade ? (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                                {emp.grade}
                                            </span>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    {isFullscreen ? (
                                        <>
                                            <td className="px-3 py-2">
                                                <div className="text-[10px] font-bold text-slate-700 truncate" title={emp.managerName || ''}>{emp.managerName || '-'}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-[10px] text-slate-600 truncate">{emp.managerMobile || '-'}</div>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="px-3 py-2">
                                            <div className="text-[10px] font-bold text-slate-700 truncate" title={emp.managerName || ''}>{emp.managerName || '-'}</div>
                                            <div className="text-[10px] text-slate-600 truncate">{emp.managerMobile || '-'}</div>
                                        </td>
                                    )}
                                    <td className="px-3 py-2 text-[10px] text-slate-600">
                                        {emp.doj ? new Date(emp.doj).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingEmployee(emp)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Edit Employee"
                                            >
                                                <HiOutlinePencilSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                disabled={deletingId === emp.id}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 disabled:opacity-50"
                                                title="Delete Employee"
                                            >
                                                {deletingId === emp.id ? <HiOutlineArrowPath className="animate-spin" size={18} /> : <HiOutlineTrash size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={11} className="px-5 py-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <HiOutlineUsers size={32} className="text-slate-300" />
                                            <span>No employees found matching "{searchQuery}".</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 px-4 sm:px-6 pb-6">
                        <p className="text-xs text-slate-500 font-medium">
                            Showing <span className="font-bold text-slate-700">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(safeCurrentPage * itemsPerPage, filteredEmployees.length)}</span> of <span className="font-bold text-slate-700">{filteredEmployees.length}</span> employees
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
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${safeCurrentPage === i + 1 ? 'bg-purple-600 text-white shadow-purple-200 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
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

            {isAddModalOpen && <EmployeeModal isEdit={false} />}
            {editingEmployee && <EmployeeModal isEdit={true} employee={editingEmployee} />}
        </div>
    );
}
