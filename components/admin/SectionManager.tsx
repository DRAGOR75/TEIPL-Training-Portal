'use client';

import { useState, useRef } from 'react';
import { createSection, deleteSection } from '@/app/actions/master-data';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { HiOutlineTrash, HiOutlineBuildingOffice2, HiOutlinePlus, HiOutlineArrowPath, HiOutlineArrowDownTray, HiOutlineArrowsPointingOut, HiOutlineArrowsPointingIn } from 'react-icons/hi2';
import { exportToExcel } from '@/lib/export-utils';

interface Section {
    id: string;
    name: string;
    _count?: {
        programs: number;
    }
}

export default function SectionManager({ sections }: { sections: Section[] }) {
    const [loading, setLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createSection(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else formRef.current?.reset();
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete section?')) return;
        setDeletingId(id);
        await deleteSection(id);
        setDeletingId(null);
    }

    return (
        <div className={isFullscreen 
            ? "fixed inset-0 z-[100] bg-slate-50 overflow-hidden flex flex-col p-4 md:p-6 lg:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
            : "bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6"
        }>
            <div className={`flex flex-col ${isFullscreen ? 'h-full max-w-[1600px] mx-auto w-full' : ''}`}>
                
                {/* Consolidated Header & Controls Toolbar */}
                <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 ${isFullscreen ? '' : 'p-6 sm:p-8 pb-0'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <HiOutlineBuildingOffice2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Departments & Sections</h2>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">{sections.length} Areas</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <form ref={formRef} action={handleAdd} className="flex items-center gap-2">
                            <input name="name" required placeholder="New Section Name..." className="w-full sm:w-48 px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 shadow-sm" />
                            <FormSubmitButton className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 text-sm">
                                <HiOutlinePlus size={16} className="stroke-[2.5]" /> Add
                            </FormSubmitButton>
                        </form>

                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 bg-white transition-colors hidden sm:block shadow-sm"
                            title={isFullscreen ? "Exit Zen Mode" : "Enter Zen Mode"}
                        >
                            {isFullscreen ? <HiOutlineArrowsPointingIn size={18} /> : <HiOutlineArrowsPointingOut size={18} />}
                        </button>
                    </div>
                </div>

                <div className={`overflow-x-auto overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-sm relative ${isFullscreen ? 'flex-1 min-h-0' : 'mx-6 sm:mx-8 mb-6 sm:mb-8 max-h-[calc(100vh-280px)]'}`}>
                    <table className="w-full table-fixed text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm before:content-[''] before:absolute before:inset-0 before:border-b before:border-slate-200 before:pointer-events-none">
                            <tr>
                                <th className="px-4 py-3 w-[10%] text-center">#</th>
                                <th className="px-4 py-3 w-[45%]">Section Name</th>
                                <th className="px-4 py-3 w-[25%]">Programs</th>
                                <th className="px-4 py-3 w-[20%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sections.map((sec, index) => (
                                <tr key={sec.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-3 py-2 text-center text-[10px] font-bold text-slate-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className="font-bold text-slate-700 text-xs">{sec.name}</span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                                            {sec._count?.programs || 0}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            onClick={() => handleDelete(sec.id)}
                                            disabled={deletingId === sec.id}
                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                            title="Delete Section"
                                        >
                                            {deletingId === sec.id ? (
                                                <HiOutlineArrowPath className="animate-spin" size={18} />
                                            ) : (
                                                <HiOutlineTrash size={18} />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
