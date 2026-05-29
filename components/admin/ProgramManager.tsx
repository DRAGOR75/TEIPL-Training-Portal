'use client';

import { useState, useRef, useMemo } from 'react';
import { createProgram, deleteProgram, updateProgram, toggleProgramStatus } from '@/app/actions/master-data';
import {
    HiOutlineTrash, HiOutlineBookOpen, HiOutlinePlus, HiOutlineChevronDown,
    HiOutlineChevronUp, HiOutlineArrowPath, HiOutlinePencilSquare,
    HiOutlineMagnifyingGlass, HiOutlineArrowUpTray, HiOutlineXMark,
    HiOutlineArrowDownTray, HiOutlineEye, HiOutlineEyeSlash,
    HiOutlineArrowsPointingOut, HiOutlineArrowsPointingIn
} from 'react-icons/hi2';
import { TrainingCategory, Grade } from '@prisma/client';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { exportToExcel } from '@/lib/export-utils';

interface Program {
    id: string;
    name: string;
    category: TrainingCategory;
    targetGrades: Grade[];
    objectives?: string | null;
    status?: string | null;
    machineModel?: string | null;
    materialPriority?: string | null;
    contentResp?: string | null;
    targetDate?: string | null;
    syllabusLink?: string | null;
    trainerMaterial?: string | null
    participantMaterial?: string | null;
    days?: number | null;
    level?: string | null;
    sections: { id: string, name: string }[];
}

export default function ProgramManager({ programs, allSections }: { programs: Program[], allSections: { id: string, name: string }[] }) {
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Pagination & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Filter and Paginate
    const filteredPrograms = useMemo(() => {
        return programs.filter(p => {
            const query = searchQuery.toLowerCase();
            return p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.id.toLowerCase().includes(query);
        });
    }, [programs, searchQuery]);

    const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage) || 1;
    // Prevent out-of-bounds page
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedPrograms = filteredPrograms.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

    // Reset page if search changes or items per page changes
    useMemo(() => { setCurrentPage(1); }, [searchQuery, itemsPerPage]);

    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createProgram(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else {
            setIsAddModalOpen(false);
        }
    }

    async function handleEdit(formData: FormData) {
        if (!editingProgram) return;
        setLoading(true);
        const result = await updateProgram(editingProgram.id, formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else {
            setEditingProgram(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete program?')) return;
        setDeletingId(id);
        await deleteProgram(id);
        setDeletingId(null);
    }

    async function handleToggleStatus(id: string, currentStatus: string | null) {
        setTogglingId(id);
        const result = await toggleProgramStatus(id, currentStatus);
        if (result?.error) alert(result.error);
        setTogglingId(null);
    }

    // Modal Component
    const ProgramModal = ({ program, isEdit }: { program?: Program | null, isEdit: boolean }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-center z-10 rounded-t-3xl">
                    <h2 className="text-xl font-black text-slate-800">
                        {isEdit ? 'Edit Subject' : 'Create New Subject'}
                    </h2>
                    <button
                        onClick={() => isEdit ? setEditingProgram(null) : setIsAddModalOpen(false)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <HiOutlineXMark size={24} />
                    </button>
                </div>
                <form action={isEdit ? handleEdit : handleAdd} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Subject Name *</label>
                            <input name="name" required defaultValue={program?.name} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 transition-all" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Category *</label>
                            <select name="category" required defaultValue={program?.category} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 transition-all">
                                <option value="FUNCTIONAL">Functional</option>
                                <option value="BEHAVIOURAL">Behavioural</option>
                                <option value="COMMON">Common</option>
                                <option value="SAFETY_PROGRAMS">Safety</option>
                                <option value="HEMM_PROGRAMS">HEMM</option>
                                <option value="OTHER_PROGRAMS">Other</option>
                                <option value="OPERATOR_PROGRAMS">Operator</option>
                                <option value="MINING_PROGRAMS">Mining</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Objectives / Description</label>
                        <textarea
                            name="objectives"
                            defaultValue={program?.objectives || ''}
                            rows={3}
                            placeholder="Briefly describe the subject..."
                            className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Grades</label>
                            <div className="flex gap-3">
                                <label className="flex-1 flex items-center justify-center gap-2 text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer text-slate-700 hover:border-blue-500 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:text-blue-700">
                                    <input type="checkbox" name="targetGrades" value="EXECUTIVE" defaultChecked={program?.targetGrades.includes('EXECUTIVE')} className="accent-blue-600 w-4 h-4" /> Executive
                                </label>
                                <label className="flex-1 flex items-center justify-center gap-2 text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer text-slate-700 hover:border-blue-500 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:text-blue-700">
                                    <input type="checkbox" name="targetGrades" value="WORKMAN" defaultChecked={program?.targetGrades.includes('WORKMAN')} className="accent-blue-600 w-4 h-4" /> Workman
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Applicable Sections (Ctrl+Click)</label>
                            <select
                                name="sectionIds"
                                multiple
                                defaultValue={program?.sections.map(s => s.id) || []}
                                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 text-slate-700 h-[88px]"
                            >
                                {allSections.map(sec => (
                                    <option key={sec.id} value={sec.id} className="py-1">{sec.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => isEdit ? setEditingProgram(null) : setIsAddModalOpen(false)}
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <FormSubmitButton className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2">
                            {isEdit ? 'Save Changes' : <><HiOutlinePlus size={18} /> Create Subject</>}
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

                {/* Consolidated Header & Controls Toolbar */}
                <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 ${isFullscreen ? '' : 'p-4 sm:p-6 pb-0'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <HiOutlineBookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Subjects Menu</h2>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">{programs.length} Courses</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 shadow-sm"
                            />
                        </div>
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

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-200 text-sm"
                        >
                            <HiOutlinePlus size={18} className="stroke-[2.5]" />
                            <span className="hidden sm:inline">Add Subject</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className={`overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm relative ${isFullscreen ? 'flex-1 min-h-0 overflow-y-auto' : 'mx-4 sm:mx-6 mb-4 min-h-[550px]'}`}>
                    <table className={`w-full table-fixed text-xs text-left ${isFullscreen ? 'min-w-[1200px]' : 'min-w-[900px]'}`}>
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm before:content-[''] before:absolute before:inset-0 before:border-b before:border-slate-200 before:pointer-events-none">
                            <tr>
                                <th className="pl-2 pr-1 py-3 w-[15px] text-center">No</th>
                                {isFullscreen ? (
                                    <>
                                        <th className="px-4 py-3 w-[20%]">Subject Name</th>
                                        <th className="px-4 py-3 w-[8%]">Subject Code</th>
                                    </>
                                ) : (
                                    <th className="px-4 py-3 w-[28%]">Subject Details</th>
                                )}
                                <th className="px-4 py-3 w-[15%]">Sections</th>
                                {isFullscreen ? (
                                    <>
                                        <th className="px-4 py-3 w-[12%]">Category</th>
                                        <th className="px-4 py-3 w-[12%]">Target Grades</th>
                                    </>
                                ) : (
                                    <th className="px-4 py-3 w-[24%]">Catogery</th>
                                )}
                                <th className="px-4 py-3 w-[8%]">Status</th>
                                <th className="px-4 py-3 w-[12%]">Objectives</th>
                                <th className="px-4 py-3 w-[8%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedPrograms.length > 0 ? paginatedPrograms.map((prog, index) => (
                                <tr key={prog.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="pl-3 pr-1 py-2 text-center text-[10px] font-bold text-slate-400">
                                        {(safeCurrentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    {isFullscreen ? (
                                        <>
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-slate-900 text-[11px] truncate">{prog.name}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200" title={prog.id}>
                                                    {prog.id.length > 8 ? `${prog.id.substring(0, 8)}...` : prog.id}
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-slate-900 text-[11px] truncate">{prog.name}</div>
                                            <div className="mt-0.5 text-[9px] font-mono font-bold text-slate-500 truncate" title={prog.id}>
                                                {prog.id}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-3 py-2">
                                        <div className="text-[10px] text-slate-500 font-medium truncate" title={prog.sections.map(s => s.name).join(', ') || 'All Sections'}>
                                            {prog.sections.length > 0 ? prog.sections.map(s => s.name).join(', ') : 'All'}
                                        </div>
                                    </td>
                                    {isFullscreen ? (
                                        <>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                    {prog.category.replace('_PROGRAMS', '')}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {prog.targetGrades.map(g => (
                                                        <span key={g} className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                            {g.substring(0, 4)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="px-3 py-2">
                                            <div className="mb-1">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                    {prog.category.replace('_PROGRAMS', '')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {prog.targetGrades.map(g => (
                                                    <span key={g} className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                        {g.substring(0, 4)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-3 py-2">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border ${(!prog.status || prog.status === 'Active') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {(!prog.status || prog.status === 'Active') ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <p className="text-[9px] text-slate-500 line-clamp-1 leading-relaxed" title={prog.objectives || ''}>
                                            {prog.objectives || <span className="italic text-slate-400">No objectives</span>}
                                        </p>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleToggleStatus(prog.id, prog.status || null)}
                                                disabled={togglingId === prog.id}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 disabled:opacity-50"
                                                title={(!prog.status || prog.status === 'Active') ? "Disable Subject" : "Enable Subject"}
                                            >
                                                {togglingId === prog.id ? <HiOutlineArrowPath className="animate-spin" size={18} /> :
                                                    ((!prog.status || prog.status === 'Active') ? <HiOutlineEye size={18} /> : <HiOutlineEyeSlash size={18} />)
                                                }
                                            </button>
                                            <button
                                                onClick={() => setEditingProgram(prog)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Edit Subject"
                                            >
                                                <HiOutlinePencilSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prog.id)}
                                                disabled={deletingId === prog.id}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 disabled:opacity-50"
                                                title="Delete Subject"
                                            >
                                                {deletingId === prog.id ? <HiOutlineArrowPath className="animate-spin" size={18} /> : <HiOutlineTrash size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <HiOutlineBookOpen size={32} className="text-slate-300" />
                                            <span>No subjects found matching "{searchQuery}".</span>
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
                            Showing <span className="font-bold text-slate-700">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(safeCurrentPage * itemsPerPage, filteredPrograms.length)}</span> of <span className="font-bold text-slate-700">{filteredPrograms.length}</span> subjects
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


            {isAddModalOpen && <ProgramModal isEdit={false} />}
            {editingProgram && <ProgramModal isEdit={true} program={editingProgram} />}
        </div>
    );
}
