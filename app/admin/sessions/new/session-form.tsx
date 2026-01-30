'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/app/actions/sessions';
import { Loader2, Calendar, BookOpen, MapPin, FileText, User } from 'lucide-react';

interface SessionFormProps {
    programs: { id: string; name: string }[];
    locations: { id: string; name: string }[];
    trainers: { id: string; name: string }[];
}

export default function SessionForm({ programs, locations, trainers }: SessionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [customLocation, setCustomLocation] = useState('');

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);

        // Handle custom location logic
        if (selectedLocation === 'Other') {
            formData.set('location', customLocation);
        } else {
            formData.set('location', selectedLocation);
        }

        try {
            const result = await createSession(formData);

            if (result.success) {
                router.push(`/admin/sessions/${result.sessionId}/manage`);
            } else {
                console.error(result.error);
                alert(result.error || 'Failed to create session');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An unexpected error occurred. Please check the form and try again.');
            setIsSubmitting(false);
        }
    }

    return (
        <form action={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8 max-w-3xl mx-auto">
            {/* 1. Program & Trainer Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <BookOpen className="text-blue-600" size={24} />
                    Core Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="programName" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Program Name</label>
                        <select
                            name="programName"
                            id="programName"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                        >
                            <option value="">Select a Program...</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="trainerName" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Trainer Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                name="trainerName"
                                id="trainerName"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400"
                            >
                                <option value="">Select a Trainer...</option>
                                {trainers.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Schedule Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Calendar className="text-blue-600" size={24} />
                    Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="startDate" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            id="startDate"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="endDate" className="text-sm font-semibold text-slate-700">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Location & Topics Section (New) */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <MapPin className="text-blue-600" size={20} />
                    Location & Content
                </h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="locationSelect" className="text-sm font-semibold text-slate-700">Training Location</label>
                        <select
                            id="locationSelect"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                        >
                            <option value="">Select Location...</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                            <option value="Other" className="font-bold text-blue-600">+ Other (Enter Manually)</option>
                        </select>
                    </div>

                    {/* Conditional Manual Location Input */}
                    {selectedLocation === 'Other' && (
                        <div className="space-y-2 animation-fade-in-up">
                            <label htmlFor="customLocation" className="text-sm font-semibold text-slate-700">Specify Location</label>
                            <input
                                type="text"
                                id="customLocation"
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                placeholder="Enter custom location name..."
                                required
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-slate-400"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="topics" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" /> Training Topics
                    </label>
                    <textarea
                        name="topics"
                        id="topics"
                        rows={4}
                        placeholder="List the key topics, modules, or learning objectives covered in this session..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400 resize-none"
                    />
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4" /> Creating...
                        </>
                    ) : (
                        'Create Session'
                    )}
                </button>
            </div>
        </form>
    );
}
