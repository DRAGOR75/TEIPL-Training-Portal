'use client';

import { useState, useRef } from 'react';
import { createSection, deleteSection } from '@/app/actions/master-data';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { HiOutlineTrash, HiOutlineSquare3Stack3D, HiOutlinePlus, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi2';

interface Section {
    id: string;
    name: string;
    _count?: {
        programs: number;
    }
}

export default function SectionManager({ sections }: { sections: Section[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
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
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <HiOutlineSquare3Stack3D size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Departments / Sections</h3>
                        <p className="text-xs text-slate-500">{sections.length} Active Sections</p>
                    </div>
                </div>
                <div className="text-blue-600">
                    {isExpanded ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
                    <form ref={formRef} action={handleAdd} className="mt-4 flex gap-4 items-end bg-slate-50 p-4 rounded-xl">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Section Name</label>
                            <input name="name" required placeholder="e.g. Mining, IT, HR" className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 placeholder-slate-500" />
                        </div>
                        <FormSubmitButton className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                            <HiOutlinePlus size={16} /> Add
                        </FormSubmitButton>
                    </form>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sections.map((sec) => (
                            <div key={sec.id} className="p-4 border rounded-xl flex justify-between items-center hover:shadow-sm transition bg-white">
                                <span className="font-semibold text-slate-700">{sec.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{sec._count?.programs || 0} Programs</span>
                                    <button
                                        onClick={() => handleDelete(sec.id)}
                                        disabled={deletingId === sec.id}
                                        className="text-slate-300 hover:text-red-500 transition disabled:opacity-50"
                                    >
                                        {deletingId === sec.id ? (
                                            <HiOutlineArrowPath className="animate-spin" size={16} />
                                        ) : (
                                            <HiOutlineTrash size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
