'use client';

import { useState, useRef } from 'react';
import { createLocation, deleteLocation } from '@/app/actions/master-data';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { HiOutlineTrash, HiOutlineMapPin, HiOutlinePlus, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineArrowPath, HiOutlineDocumentArrowDown } from 'react-icons/hi2';
import { exportToExcel } from '@/lib/export-utils';

interface Location {
    id: string;
    name: string;
}

export default function LocationManager({ locations }: { locations: Location[] }) {
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleAdd(formData: FormData) {
        setLoading(true);
        const result = await createLocation(formData);
        setLoading(false);
        if (result?.error) alert(result.error);
        else formRef.current?.reset();
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete region?')) return;
        setDeletingId(id);
        const result = await deleteLocation(id);
        setDeletingId(null);
        if (result?.error) alert(result.error);
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 flex flex-col gap-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <HiOutlineMapPin size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">REGIONS</h2>
                        <p className="text-slate-500 font-medium text-xs mt-0.5">{locations.length} regions managed</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => {
                            const exportData = locations.map(l => ({
                                'Region Name': l.name
                            }));
                            exportToExcel(exportData, 'Regions');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <HiOutlineDocumentArrowDown size={18} />
                        <span className="hidden sm:inline">Export to Excel</span>
                    </button>
                </div>
            </div>

            <div className="p-6">
                <form ref={formRef} action={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Region Name</label>
                        <input name="name" required placeholder="e.g. North, South, Head Office" className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 placeholder-slate-500" />
                    </div>
                    <FormSubmitButton className="px-6 py-3 w-full sm:w-auto bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        <HiOutlinePlus size={16} className="stroke-[2.5]" /> Add
                    </FormSubmitButton>
                </form>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map((loc) => (
                        <div key={loc.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:shadow-md transition bg-white group">
                            <span className="font-bold text-slate-700 text-sm">{loc.name}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDelete(loc.id)}
                                    disabled={deletingId === loc.id}
                                    className="text-slate-300 hover:text-rose-500 transition disabled:opacity-50 group-hover:opacity-100 opacity-0"
                                >
                                    {deletingId === loc.id ? (
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
