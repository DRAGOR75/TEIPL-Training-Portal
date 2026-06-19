'use client'

import { useState } from 'react';
import { updateSession } from '@/app/actions/update-session';
import { updateBatch } from '@/app/actions/update-batch';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { HiOutlineXMark } from 'react-icons/hi2';

type EditSessionModalProps = {
    session: any; // The training session object
    trainers: any[];
    locations: any[];
    triggerComponent?: React.ReactNode;
    defaultOpen?: boolean;
    onClose?: () => void;
    mode?: 'session' | 'batch';
};

export default function EditSessionModal({ 
    session, trainers, locations, triggerComponent, defaultOpen, onClose, mode = 'session'
}: EditSessionModalProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen || false);

    // Form State pre-filled with session data
    const initialTrainers = session.trainerName 
        ? session.trainerName.split(/,|&|\band\b/i).map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : [''];
    const [selectedTrainers, setSelectedTrainers] = useState<string[]>(initialTrainers.length > 0 ? initialTrainers : ['']);
    
    // Check if location is in locations list, otherwise custom
    const isLocationInList = session.location ? locations.some(l => l.name === session.location) : false;
    const initialLocationMode = (!session.location || isLocationInList) ? 'select' : 'custom';
    
    const [locationMode, setLocationMode] = useState<'select' | 'custom'>(initialLocationMode);
    const [selectedLocation, setSelectedLocation] = useState<string>(isLocationInList ? session.location : '');
    const [customLocation, setCustomLocation] = useState<string>(!isLocationInList ? (session.location || '') : '');
    
    // Format dates to YYYY-MM-DD for inputs
    const formatDateForInput = (dateObj: Date | string | null) => {
        if (!dateObj) return '';
        const d = new Date(dateObj);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [assessmentDate, setAssessmentDate] = useState<string>(formatDateForInput(session.assessmentDate));

    // Auto-calculate Feedback Date (+30 days) when endDate changes
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const endStr = e.target.value;
        const end = new Date(endStr);
        if (!isNaN(end.getTime())) {
            // Auto-calculate Assessment Date (+30 days)
            const assessment = new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000);
            setAssessmentDate(formatDateForInput(assessment));
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    if (!isOpen) {
        if (triggerComponent) {
            return <div onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>{triggerComponent}</div>;
        }
        return (
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(true); }} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors hover:bg-slate-200">
                Edit
            </button>
        );
    }

    // Prepare Options
    const trainerOptions = trainers.map(t => ({ label: t.name, value: t.name }));

    // Location Options + "Other"
    const locationOptions = locations.map(l => ({ label: l.name, value: l.name }));
    locationOptions.push({ label: "Other (Type Custom)", value: "OTHER_CUSTOM" });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-lg text-slate-800">Edit Training Session</h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><HiOutlineXMark size={24} /></button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form action={async (formData) => {
                        const activeTrainers = selectedTrainers.filter(t => t.trim() !== '');

                        // Set Trainer
                        formData.set('trainerName', activeTrainers.join(' & '));

                        // Handle Location
                        if (locationMode === 'select') {
                            if (selectedLocation === 'OTHER_CUSTOM') {
                                if (!customLocation) { alert("Please type a location."); return; }
                                formData.set('location', customLocation);
                            } else {
                                formData.set('location', selectedLocation);
                            }
                        } else {
                            if (!customLocation) { alert("Please type a location."); return; }
                            formData.set('location', customLocation);
                        }

                        try {
                            let result;
                            if (mode === 'batch') {
                                result = await updateBatch(session.id, formData);
                            } else {
                                result = await updateSession(session.id, formData);
                            }
                            
                            if (result.success) {
                                handleClose();
                            } else {
                                alert(result.error || "Failed to update.");
                            }
                        } catch (err) {
                            console.error(err);
                            alert("An unexpected error occurred.");
                        }
                    }} className="space-y-5 text-left">

                        {/* ROW 1: Program & Trainer(s) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Training Program</label>
                                <div className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 cursor-not-allowed">
                                    {session.programName}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Trainer(s)</label>
                                <div className="space-y-3">
                                    {selectedTrainers.map((tName, idx) => (
                                        <div key={idx} className="flex gap-2 relative">
                                            <SearchableSelect
                                                options={trainerOptions}
                                                value={tName}
                                                onChange={(val) => {
                                                    const newT = [...selectedTrainers];
                                                    newT[idx] = typeof val === 'string' ? val : String(val);
                                                    setSelectedTrainers(newT);
                                                }}
                                                placeholder={idx === 0 ? "Select Primary Trainer" : "Select Co-Trainer"}
                                                searchPlaceholder="Search trainers..."
                                                className="flex-1"
                                            />
                                            {idx > 0 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setSelectedTrainers(selectedTrainers.filter((_, i) => i !== idx))}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                                    title="Remove Co-Trainer"
                                                >
                                                    <HiOutlineXMark size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedTrainers([...selectedTrainers, ''])}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 mt-1 -ml-2"
                                    >
                                        + Add Co-Trainer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                                <input name="startDate" required type="date" defaultValue={formatDateForInput(session.startDate)} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                                <input
                                    name="endDate"
                                    required
                                    type="date"
                                    defaultValue={formatDateForInput(session.endDate)}
                                    onChange={handleEndDateChange}
                                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {mode === 'session' && (
                            <>
                                {/* ROW 3: Times */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                                        <input name="startTime" type="time" defaultValue={session.startTime || "08:30"} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                                        <input name="endTime" type="time" defaultValue={session.endTime || "18:00"} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                {/* ROW 3.5: Post Training Assessment Date */}
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                    <label className="block text-sm font-bold text-blue-900 mb-1">Post Training Assessment Date</label>
                                    <p className="text-[10px] text-blue-600 mb-2 font-medium">Auto-calculated (+30 days from end date) but can be changed.</p>
                                    <input
                                        name="assessmentDate"
                                        type="date"
                                        value={assessmentDate}
                                        onChange={(e) => setAssessmentDate(e.target.value)}
                                        className="w-full p-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                                    />
                                </div>
                            </>
                        )}

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
                        {mode === 'session' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Topics to be learned</label>
                                <textarea
                                    name="topics"
                                    rows={3}
                                    defaultValue={session.topics || ''}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                    placeholder="Enter the key topics or agenda for this session..."
                                ></textarea>
                                <p className="text-xs text-slate-400 mt-1 text-right">Visible in invitation emails</p>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                            <button type="button" onClick={handleClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                            <FormSubmitButton className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95">
                                Save Changes
                            </FormSubmitButton>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
