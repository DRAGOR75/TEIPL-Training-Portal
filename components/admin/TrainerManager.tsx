'use client';

import { useState, useRef } from 'react';
import {
    HiOutlineUserPlus,
    HiOutlineEnvelope,
    HiOutlinePhone,
    HiOutlineTrash,
    HiOutlineUsers,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlinePlus,
    HiOutlineArrowPath,
    HiOutlinePencil,
    HiOutlineXMark
} from 'react-icons/hi2';
import { addTrainer, deleteTrainer, updateTrainer } from '@/app/actions/trainers';
import { FormSubmitButton } from '@/components/FormSubmitButton';

type Trainer = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
};

export default function TrainerManager({ trainers }: { trainers: Trainer[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        let result;
        
        if (editingTrainer) {
            result = await updateTrainer(editingTrainer.id, formData);
        } else {
            result = await addTrainer(formData);
        }
        
        setLoading(false);

        if (result?.error) {
            alert(result.error);
        } else {
            formRef.current?.reset();
            setEditingTrainer(null);
        }
    }

    function handleEditClick(t: Trainer) {
        setEditingTrainer(t);
        setIsExpanded(true);
        // We use window.scrollTo if needed, but the form is at the top of the expanded area
    }

    async function handleDeleteTrainer(id: string) {
        if (!confirm('Delete this trainer?')) return;
        setDeletingId(id);
        await deleteTrainer(id);
        setDeletingId(null);
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header / Toggle */}
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <HiOutlineUsers size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Trainer Directory</h3>
                        <p className="text-xs text-slate-500">{trainers.length} Registered Trainers</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-blue-600 text-sm font-semibold flex items-center gap-1">
                        {isExpanded ? <HiOutlineChevronUp size={18} /> : <HiOutlineChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 pt-0 space-y-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">

                    {/* Professional Add/Edit Form */}
                    <form ref={formRef} action={handleSubmit} className={`mt-4 p-5 rounded-2xl border transition-all ${editingTrainer ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-slate-700">
                                {editingTrainer ? <HiOutlinePencil size={16} className="text-blue-600" /> : <HiOutlineUserPlus size={16} />}
                                <span className={`text-sm font-bold ${editingTrainer ? 'text-blue-700' : ''}`}>
                                    {editingTrainer ? 'Edit Trainer Details' : 'Register New Trainer'}
                                </span>
                            </div>
                            {editingTrainer && (
                                <button 
                                    type="button" 
                                    onClick={() => setEditingTrainer(null)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                >
                                    <HiOutlineXMark size={14} />
                                    Cancel
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Row 1: Name and Email */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                                    <input 
                                        name="name" 
                                        required 
                                        defaultValue={editingTrainer?.name || ''}
                                        key={`name-${editingTrainer?.id || 'new'}`}
                                        placeholder="Full Name" 
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                                    <input 
                                        name="email" 
                                        type="email" 
                                        required 
                                        defaultValue={editingTrainer?.email || ''}
                                        key={`email-${editingTrainer?.id || 'new'}`}
                                        placeholder="Official Email" 
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                    />
                                </div>
                            </div>

                            {/* Row 2: Mobile Number and Password */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</label>
                                    <input 
                                        name="phone" 
                                        required 
                                        defaultValue={editingTrainer?.phone || ''}
                                        key={`phone-${editingTrainer?.id || 'new'}`}
                                        placeholder="Mobile Number" 
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        {editingTrainer ? 'New Password (Optional)' : 'Login Password'}
                                    </label>
                                    <input 
                                        name="password" 
                                        type="password" 
                                        required={!editingTrainer} 
                                        placeholder={editingTrainer ? "Leave blank to keep current" : "Create a password"} 
                                        minLength={6} 
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                    />
                                </div>
                            </div>

                            {/* Row 3: Button */}
                            <div className="flex justify-end pt-2">
                                <FormSubmitButton
                                    className={`w-full md:w-auto px-8 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm active:transform active:scale-95 ${editingTrainer ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                >
                                    {editingTrainer ? <HiOutlinePencil size={18} /> : <HiOutlinePlus size={18} />}
                                    {editingTrainer ? 'Update Trainer' : 'Add Trainer'}
                                </FormSubmitButton>
                            </div>
                        </div>
                    </form>

                    {/* Trainer List */}
                    <div className="flex flex-col gap-2">
                        {trainers.map((t) => (
                            <div key={t.id} className="group p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                                    {t.name.charAt(0)}
                                </div>

                                {/* Info Column - min-w-0 ensures truncation works */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="font-bold text-slate-800 text-sm truncate">{t.name}</p>
                                    <div className="flex flex-col text-xs text-slate-500 mt-0.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <HiOutlineEnvelope size={12} className="shrink-0 text-blue-400" />
                                            <span className="truncate">{t.email}</span>
                                        </div>
                                        {t.phone && (
                                            <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                                                <HiOutlinePhone size={12} className="shrink-0 text-emerald-400" />
                                                <span className="truncate">{t.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleEditClick(t)}
                                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Trainer"
                                    >
                                        <HiOutlinePencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTrainer(t.id)}
                                        disabled={deletingId === t.id}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Delete Trainer"
                                    >
                                        {deletingId === t.id ? (
                                            <HiOutlineArrowPath className="animate-spin" size={16} />
                                        ) : (
                                            <HiOutlineTrash size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {trainers.length === 0 && (
                            <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                <p className="text-slate-400 text-sm">No trainers found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}