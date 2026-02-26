'use client'

import { useState } from 'react';
import { createSession } from '@/app/actions/sessions'; // Correct Action
import { FormSubmitButton } from '@/components/FormSubmitButton';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { HiOutlineXMark } from 'react-icons/hi2';

type CreateSessionModalProps = {
    trainers: any[];
    programs: any[];
    locations: any[];
    fixedTrainerName?: string;
};

export default function CreateSessionModal({ trainers, programs, locations, fixedTrainerName }: CreateSessionModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedTrainer, setSelectedTrainer] = useState<string>(fixedTrainerName || '');
    const [locationMode, setLocationMode] = useState<'select' | 'custom'>('select');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [customLocation, setCustomLocation] = useState<string>('');

    // Auto-calculate Feedback Date (+25 days)
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const end = new Date(e.target.value);
        if (!isNaN(end.getTime())) {
            // Logic can be added here if we want to auto-populate a hidden field
            // But since 'createSession' calculates this or it's not strictly needed for creation, we can omit.
        }
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold transition shadow-sm">
                + Schedule New Session
            </button>
        );
    }

    // Prepare Options
    const trainerOptions = trainers.map(t => ({ label: t.name, value: t.name }));
    const programOptions = programs.map(p => ({ label: p.name, value: p.name }));

    // Location Options + "Other"
    const locationOptions = locations.map(l => ({ label: l.name, value: l.name }));
    locationOptions.push({ label: "Other (Type Custom)", value: "OTHER_CUSTOM" });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">

                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-lg text-slate-800">New Training Session</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><HiOutlineXMark size={24} /></button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form action={async (formData) => {
                        // Validation
                        if (!selectedProgram) { alert("Please select a Program."); return; }
                        if (!selectedTrainer) { alert("Please select a Trainer."); return; }

                        // Set Program & Trainer
                        formData.set('programName', selectedProgram);
                        formData.set('trainerName', selectedTrainer);

                        // Handle Location
                        if (locationMode === 'select') {
                            if (selectedLocation === 'OTHER_CUSTOM') {
                                // Should shouldn't happen if UI logic is right, but guard:
                                if (!customLocation) { alert("Please type a location."); return; }
                                formData.set('location', customLocation);
                            } else {
                                if (!selectedLocation) { alert("Please select a Location."); return; }
                                formData.set('location', selectedLocation);
                            }
                        } else {
                            if (!customLocation) { alert("Please type a location."); return; }
                            formData.set('location', customLocation);
                        }

                        try {
                            const result = await createSession(formData);
                            if (result.success) {
                                setIsOpen(false);
                                // Optional: Reset form state
                            } else {
                                alert(result.error || "Failed to create session.");
                            }
                        } catch (err) {
                            console.error(err);
                            alert("An unexpected error occurred.");
                        }
                    }} className="space-y-5 text-left">

                        {/* ROW 1: Program & Trainer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Training Program</label>
                                <div className="relative">
                                    <SearchableSelect
                                        options={programOptions}
                                        value={selectedProgram}
                                        onChange={(val) => setSelectedProgram(typeof val === 'string' ? val : String(val))}
                                        placeholder="Select Program"
                                        searchPlaceholder="Search programs..."
                                        className="w-full"
                                    />
                                </div>
                                <input type="hidden" name="programName" value={selectedProgram} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Trainer</label>
                                <div className="relative">
                                    {fixedTrainerName ? (
                                        <div className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 cursor-not-allowed">
                                            {fixedTrainerName}
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            options={trainerOptions}
                                            value={selectedTrainer}
                                            onChange={(val) => setSelectedTrainer(typeof val === 'string' ? val : String(val))}
                                            placeholder="Select Trainer"
                                            searchPlaceholder="Search trainers..."
                                            className="w-full"
                                        />
                                    )}
                                </div>
                                <input type="hidden" name="trainerName" value={fixedTrainerName || selectedTrainer} />
                            </div>
                        </div>

                        {/* ROW 2: Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                                <input name="startDate" required type="date" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                                <input
                                    name="endDate"
                                    required
                                    type="date"
                                    onChange={handleEndDateChange}
                                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* ROW 3: Times */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                                <input name="startTime" type="time" defaultValue="08:30" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                                <input name="endTime" type="time" defaultValue="18:00" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        {/* ROW 4: Location */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                            {locationMode === 'select' ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <SearchableSelect
                                            options={locationOptions}
                                            value={selectedLocation}
                                            onChange={(val) => {
                                                const v = typeof val === 'string' ? val : String(val);
                                                if (v === 'OTHER_CUSTOM') {
                                                    setLocationMode('custom');
                                                    setCustomLocation('');
                                                } else {
                                                    setSelectedLocation(v);
                                                }
                                            }}
                                            placeholder="Select Location"
                                            searchPlaceholder="Search locations..."
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customLocation}
                                        onChange={(e) => setCustomLocation(e.target.value)}
                                        placeholder="Type custom location..."
                                        className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setLocationMode('select'); setSelectedLocation(''); }}
                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                                    >
                                        Back to List
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ROW 5: Topics */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Topics to be learned</label>
                            <textarea
                                name="topics"
                                rows={3}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                placeholder="Enter the key topics or agenda for this session..."
                            ></textarea>
                            <p className="text-xs text-slate-400 mt-1 text-right">Visible in invitation emails</p>
                        </div>

                        {/* Hidden Inputs for Form Data Construction if needed */}
                        <input type="hidden" name="feedbackCreationDate" value="" />

                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                            <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                            <FormSubmitButton className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95">
                                Create Session
                            </FormSubmitButton>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}