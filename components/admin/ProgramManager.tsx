'use client';

import { useState, useRef, useMemo } from 'react';
import { createProgram, deleteProgram, updateProgram, toggleProgramStatus } from '@/app/actions/master-data';
import { 
    HiOutlineTrash, HiOutlineBookOpen, HiOutlinePlus, HiOutlineChevronDown, 
    HiOutlineChevronUp, HiOutlineArrowPath, HiOutlinePencilSquare,
    HiOutlineMagnifyingGlass, HiOutlineArrowUpTray, HiOutlineXMark,
    HiOutlineArrowDownTray, HiOutlineEye, HiOutlineEyeSlash
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
    trainerMaterial?: string | null;
    participantMaterial?: string | null;
    days?: number | null;
    level?: string | null;
    sections: { id: string, name: string }[];
}

export default function ProgramManager({ programs, allSections }: { programs: Program[], allSections: { id: string, name: string }[] }) {
    const [loading, setLoading] = useState(false);
    
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
                        {isEdit ? 'Edit Program' : 'Create New Program'}
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
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Program Name *</label>
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
                            placeholder="Briefly describe the program..."
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
                            {isEdit ? 'Save Changes' : <><HiOutlinePlus size={18} /> Create Program</>}
                        </FormSubmitButton>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700">
                        <HiOutlineBookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Training Programs</h3>
                        <p className="text-xs text-slate-500 font-medium">{programs.length} Total Registered Courses</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const exportData = programs.map(p => ({
                            'Program ID': p.id,
                            'Program Name': p.name,
                            Category: p.category.replace('_PROGRAMS', ''),
                            'Target Grades': p.targetGrades.join(', '),
                            Status: p.status || 'Active',
                            'Machine Model': p.machineModel || '',
                            'Material Priority': p.materialPriority || '',
                            'Content Responsibility': p.contentResp || '',
                            'Target Date': p.targetDate || '',
                            'Syllabus Link': p.syllabusLink || '',
                            'Trainer Material': p.trainerMaterial || '',
                            'Participant Material': p.participantMaterial || '',
                            Days: p.days || '',
                            Level: p.level || '',
                            'Objectives': p.objectives || '',
                            Sections: p.sections.length > 0 ? p.sections.map(s => s.name).join(', ') : 'All Sections'
                        }));
                        exportToExcel(exportData, 'Training_Programs');
                    }}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                    <HiOutlineArrowDownTray size={18} />
                    <span className="hidden sm:inline">Export to Excel</span>
                </button>
            </div>

            <div className="p-6">
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-72">
                                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="Search programs..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 shadow-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-slate-500 font-bold hidden sm:inline">Show:</span>
                                            <select 
                                                value={itemsPerPage} 
                                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                                className="py-2 pl-3 pr-8 border border-slate-200 bg-white rounded-xl text-sm outline-none font-bold text-slate-700 shadow-sm cursor-pointer"
                                            >
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-200 text-sm"
                                    >
                                        <HiOutlinePlus size={18} className="stroke-[2.5]" />
                                        Add Program
                                    </button>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-4 w-1/4">Program Details</th>
                                                <th className="px-5 py-4">ID</th>
                                                <th className="px-5 py-4 w-1/6">Category</th>
                                                <th className="px-5 py-4 w-1/6">Target Grades</th>
                                                <th className="px-5 py-4">Status</th>
                                                <th className="px-5 py-4 w-1/4">Objectives</th>
                                                <th className="px-5 py-4 text-right w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedPrograms.length > 0 ? paginatedPrograms.map((prog) => (
                                                <tr key={prog.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-slate-900">{prog.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-medium uppercase mt-1 max-w-[250px] truncate" title={prog.sections.map(s => s.name).join(', ') || 'All Sections'}>
                                                            Sections: {prog.sections.length > 0 ? prog.sections.map(s => s.name).join(', ') : 'All'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{prog.id}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                            {prog.category.replace('_PROGRAMS', '')}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {prog.targetGrades.map(g => (
                                                                <span key={g} className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                    {g.substring(0, 4)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold border ${(!prog.status || prog.status === 'Active') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                            {(!prog.status || prog.status === 'Active') ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed" title={prog.objectives || ''}>
                                                            {prog.objectives || <span className="italic text-slate-400">No objectives</span>}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleToggleStatus(prog.id, prog.status || null)}
                                                                disabled={togglingId === prog.id}
                                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 disabled:opacity-50"
                                                                title={(!prog.status || prog.status === 'Active') ? "Disable Program" : "Enable Program"}
                                                            >
                                                                {togglingId === prog.id ? <HiOutlineArrowPath className="animate-spin" size={18} /> : 
                                                                    ((!prog.status || prog.status === 'Active') ? <HiOutlineEye size={18} /> : <HiOutlineEyeSlash size={18} />)
                                                                }
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditingProgram(prog)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                                title="Edit Program"
                                                            >
                                                                <HiOutlinePencilSquare size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(prog.id)}
                                                                disabled={deletingId === prog.id}
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 disabled:opacity-50"
                                                                title="Delete Program"
                                                            >
                                                                {deletingId === prog.id ? <HiOutlineArrowPath className="animate-spin" size={18} /> : <HiOutlineTrash size={18} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-medium">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <HiOutlineBookOpen size={32} className="text-slate-300" />
                                                            <span>No programs found matching "{searchQuery}".</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xs text-slate-500 font-medium">
                                            Showing <span className="font-bold text-slate-700">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(safeCurrentPage * itemsPerPage, filteredPrograms.length)}</span> of <span className="font-bold text-slate-700">{filteredPrograms.length}</span> programs
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

            {isAddModalOpen && <ProgramModal isEdit={false} />}
            {editingProgram && <ProgramModal isEdit={true} program={editingProgram} />}
        </div>
    );
}
