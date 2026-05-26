'use client';

import { useState, useRef } from 'react';
import { createSection, deleteSection } from '@/app/actions/master-data';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { HiOutlineTrash, HiOutlineBuildingOffice2, HiOutlinePlus, HiOutlineArrowPath, HiOutlineArrowDownTray } from 'react-icons/hi2';
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-700">
                        <HiOutlineBuildingOffice2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Departments & Sections</h3>
                        <p className="text-xs text-slate-500 font-medium">{sections.length} Registered Areas</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const exportData = sections.map(s => ({
                            ID: s.id,
                            Name: s.name,
                            'Programs Count': s._count?.programs || 0
                        }));
                        exportToExcel(exportData, 'Departments_and_Sections');
                    }}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                    <HiOutlineArrowDownTray size={18} />
                    <span className="hidden sm:inline">Export to Excel</span>
                </button>
            </div>

            <div className="p-6">
                <form ref={formRef} action={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Section Name</label>
                        <input name="name" required placeholder="e.g. Mining, IT, HR" className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 placeholder-slate-500" />
                    </div>
                    <FormSubmitButton className="px-6 py-3 w-full sm:w-auto bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        <HiOutlinePlus size={16} className="stroke-[2.5]" /> Add
                    </FormSubmitButton>
                </form>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((sec) => (
                        <div key={sec.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:shadow-md transition bg-white group">
                            <span className="font-bold text-slate-700 text-sm">{sec.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                                    {sec._count?.programs || 0} Programs
                                </span>
                                <button
                                    onClick={() => handleDelete(sec.id)}
                                    disabled={deletingId === sec.id}
                                    className="text-slate-300 hover:text-rose-500 transition disabled:opacity-50 group-hover:opacity-100 opacity-0"
                                >
                                    {deletingId === sec.id ? (
                                        <HiOutlineArrowPath className="animate-spin" size={18} />
                                    ) : (
                                        <HiOutlineTrash size={18} />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
