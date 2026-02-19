'use client';

import { useState } from 'react';
import { scheduleCohortSession } from '@/app/actions/cohorts';
import {
    HiOutlineXMark,
    HiOutlineCalendarDays,
    HiOutlineArrowPath,
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface ScheduleSessionModalProps {
    cohortProgram: any;
    cohortName: string;
    trainers: any[];
    locations: any[];
    onClose: () => void;
}

export default function ScheduleSessionModal({ cohortProgram, cohortName, trainers, locations, onClose }: ScheduleSessionModalProps) {
    const router = useRouter();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [locationMode, setLocationMode] = useState<'select' | 'custom'>('select');
    const [location, setLocation] = useState('');
    const [trainerName, setTrainerName] = useState('');
    const [topics, setTopics] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        if (!startDate || !endDate) {
            setError('Start date and end date are required.');
            return;
        }

        setIsSubmitting(true);
        const result = await scheduleCohortSession(cohortProgram.id, {
            startDate,
            endDate,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            location: location || undefined,
            trainerName: trainerName || undefined,
            topics: topics || undefined,
        });

        if (result.success) {
            router.refresh();
            onClose();
        } else {
            setError(result.error || 'Failed to schedule session.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <HiOutlineCalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Schedule Session</h2>
                            <p className="text-xs text-slate-500">{cohortName} — {cohortProgram.program.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <HiOutlineXMark className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">{error}</div>
                    )}

                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-xl text-xs">
                        🔗 This will auto-create a training session and batch, then add all cohort members as nominations.
                    </div>

                    {/* Date Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Start Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">End Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Time Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Start Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">End Time</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Trainer & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Trainer</label>
                            <SearchableSelect
                                options={trainers.map(t => ({ label: t.name, value: t.name }))}
                                value={trainerName}
                                onChange={setTrainerName}
                                placeholder="Select Trainer"
                                searchPlaceholder="Search trainers..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Location</label>
                            {locationMode === 'select' ? (
                                <SearchableSelect
                                    options={[
                                        ...locations.map(l => ({ label: l.name, value: l.name })),
                                        { label: "Other (Type Custom)", value: "OTHER_CUSTOM" }
                                    ]}
                                    value={location}
                                    onChange={(val) => {
                                        if (val === 'OTHER_CUSTOM') {
                                            setLocationMode('custom');
                                            setLocation('');
                                        } else {
                                            setLocation(val);
                                        }
                                    }}
                                    placeholder="Select Location"
                                    searchPlaceholder="Search locations..."
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Type custom location..."
                                        className="flex-1 p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setLocationMode('select'); setLocation(''); }}
                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-[10px] font-bold uppercase transition-colors"
                                    >
                                        Back
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Topics */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase">Topics</label>
                        <textarea
                            value={topics}
                            onChange={e => setTopics(e.target.value)}
                            placeholder="Session topics (optional)"
                            rows={2}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        {isSubmitting ? (
                            <><HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Scheduling...</>
                        ) : (
                            'Schedule Session'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
