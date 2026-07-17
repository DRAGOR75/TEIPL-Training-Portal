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

    // Props for external controlled state (like Gantt Chart)
    triggerComponent?: React.ReactNode;
    fixedProgramName?: string;
    fixedLocationName?: string;
    prefillStartDate?: string;
    defaultOpen?: boolean;
    onClose?: () => void;
};

export default function CreateSessionModal({
    trainers, programs, locations, fixedTrainerName,
    triggerComponent, fixedProgramName, fixedLocationName, prefillStartDate, defaultOpen, onClose
}: CreateSessionModalProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen || false);

    // Form State
    const [selectedProgram, setSelectedProgram] = useState<string>(fixedProgramName || '');

    const initialTrainer = fixedTrainerName ? fixedTrainerName.trim() : '';
    const [selectedTrainer, setSelectedTrainer] = useState<string>(initialTrainer);
    const [trainerMode, setTrainerMode] = useState<'select' | 'custom'>('select');
    const [customTrainer, setCustomTrainer] = useState<string>('');
    const [selectedCoordinator, setSelectedCoordinator] = useState<string>('');
    const [coordinatorMode, setCoordinatorMode] = useState<'select' | 'custom'>('select');
    const [customCoordinator, setCustomCoordinator] = useState<string>('');
    const [locationMode, setLocationMode] = useState<'select' | 'custom'>('select');
    const [selectedLocation, setSelectedLocation] = useState<string>(fixedLocationName || '');
    const [customLocation, setCustomLocation] = useState<string>('');
    const [assessmentDate, setAssessmentDate] = useState<string>('');

    // Auto-calculate Feedback Date (+30 days)
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const endStr = e.target.value;
        const end = new Date(endStr);
        if (!isNaN(end.getTime())) {
            // Auto-calculate Assessment Date (+30 days)
            const assessment = new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000);
            const year = assessment.getFullYear();
            const month = String(assessment.getMonth() + 1).padStart(2, '0');
            const day = String(assessment.getDate()).padStart(2, '0');
            setAssessmentDate(`${year}-${month}-${day}`);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    if (!isOpen) {
        if (triggerComponent) {
            return <div onClick={() => setIsOpen(true)}>{triggerComponent}</div>;
        }
        return (
            <button onClick={() => setIsOpen(true)} className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-bold transition shadow-sm">
                + Schedule New Session
            </button>
        );
    }

    // Prepare Options
    const trainerOptions = trainers.map(t => ({ label: t.name, value: t.name }));
    if (selectedTrainer && !trainerOptions.find(o => o.value === selectedTrainer)) {
        trainerOptions.push({ label: selectedTrainer, value: selectedTrainer });
    }
    if (selectedCoordinator && !trainerOptions.find(o => o.value === selectedCoordinator)) {
        trainerOptions.push({ label: selectedCoordinator, value: selectedCoordinator });
    }
    trainerOptions.push({ label: "Other (Type Custom)", value: "OTHER_CUSTOM" });
    const programOptions = programs.map(p => ({ label: p.name, value: p.name }));

    // Location Options + "Other"
    const locationOptions = locations.map(l => ({ label: l.name, value: l.name }));
    locationOptions.push({ label: "Other (Type Custom)", value: "OTHER_CUSTOM" });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">

                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-lg text-slate-800">New Training Session</h2>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600"><HiOutlineXMark size={24} /></button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form action={async (formData) => {
                        // Validation
                        if (!selectedProgram) { alert("Please select a Program."); return; }

                        const finalTrainer = fixedTrainerName || (trainerMode === 'custom' ? customTrainer : selectedTrainer);
                        if (!finalTrainer) { alert("Please select or enter a Primary Trainer."); return; }

                        // Set Program & Trainer
                        formData.set('programName', selectedProgram);
                        formData.set('trainerName', fixedTrainerName || selectedTrainer);
                        if (selectedCoordinator) {
                            formData.set('coordinatorName', selectedCoordinator);
                        }

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
                                handleClose();
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
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="altProgramName"
                                        placeholder="Alternate Program Name (Optional)"
                                        className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Leave blank to use the standard program name.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Trainer</label>
                                <div className="space-y-3">
                                    {fixedTrainerName ? (
                                        <div className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 cursor-not-allowed">
                                            {fixedTrainerName}
                                        </div>
                                    ) : trainerMode === 'select' ? (
                                        <div className="space-y-2">
                                            <SearchableSelect
                                                options={trainerOptions}
                                                value={selectedTrainer}
                                                onChange={(val) => {
                                                    const v = typeof val === 'string' ? val : String(val);
                                                    if (v === 'OTHER_CUSTOM') {
                                                        setTrainerMode('custom');
                                                        setCustomTrainer('');
                                                    } else {
                                                        setSelectedTrainer(v);
                                                    }
                                                }}
                                                placeholder="Select Primary Trainer"
                                                searchPlaceholder="Search trainers..."
                                                className="w-full"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Enter Custom Trainer Name"
                                                value={customTrainer}
                                                onChange={e => setCustomTrainer(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setTrainerMode('select')}
                                                className="text-xs text-blue-600 hover:underline font-bold"
                                            >
                                                Back to Select
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* Fallback hidden input */}
                                <input type="hidden" name="trainerName" value={fixedTrainerName || (trainerMode === 'custom' ? customTrainer : selectedTrainer)} />
                                
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Coordinator / Co-Trainer (Optional)</label>
                                    {coordinatorMode === 'select' ? (
                                        <div className="space-y-2">
                                            <SearchableSelect
                                                options={trainerOptions}
                                                value={selectedCoordinator}
                                                onChange={(val) => {
                                                    const v = typeof val === 'string' ? val : String(val);
                                                    if (v === 'OTHER_CUSTOM') {
                                                        setCoordinatorMode('custom');
                                                        setCustomCoordinator('');
                                                    } else {
                                                        setSelectedCoordinator(v);
                                                    }
                                                }}
                                                placeholder="Select Coordinator / Co-Trainer"
                                                searchPlaceholder="Search..."
                                                className="w-full"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Enter Custom Coordinator Name"
                                                value={customCoordinator}
                                                onChange={e => setCustomCoordinator(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCoordinatorMode('select')}
                                                className="text-xs text-blue-600 hover:underline font-bold"
                                            >
                                                Back to Select
                                            </button>
                                        </div>
                                    )}
                                    <input type="hidden" name="coordinatorName" value={coordinatorMode === 'custom' ? customCoordinator : selectedCoordinator} />
                                </div>
                            </div>
                        </div>

                        {/* ROW 2: Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                                <input name="startDate" required type="date" defaultValue={prefillStartDate} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
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

                        {/* ROW 3: Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Total Training Days</label>
                                <input name="trainingDays" type="number" step="0.5" min="0" placeholder="e.g. 2" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Total Training Hours</label>
                                <input name="trainingHours" type="number" step="0.5" min="0" placeholder="e.g. 16" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
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

                        {/* ROW 3.75: Session Category */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1"> Category</label>
                            <select name="sessionCategory" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="">Select Category...</option>
                                <option value="Technical">Technical</option>
                                <option value="Technical-VR">Technical-VR</option>
                                <option value="Technical by OEM">Technical by OEM</option>
                                <option value="All Nomination">Technical at OEM</option>
                                <option value="Workshop">Workshop</option>
                                <option value="Functional/Others">Functional/Others</option>
                                <option value="Behavioural">Behavioural</option>
                                <option value="Safety">Safety</option>
                            </select>
                        </div>

                        {/* ROW 4: Location */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Region</label>
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

                        {/* ROW 4.5: Training Location (Maps to region column) & Address */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Training Location</label>
                                <input name="region" type="text" placeholder="eg. TRC" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Training Location Address</label>
                                <input name="trainingLocationAddress" type="text" placeholder="e.g. TRC Training center" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                            </div>
                        </div>

                        {/* ROW 5: Capacity */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Capacity (Total Participants)</label>
                            <input name="capacity" type="number" min="1" defaultValue="20" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            <p className="text-xs text-slate-400 mt-1">Maximum number of self-enrollments allowed</p>
                        </div>

                        {/* ROW 6: Topics */}
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
                            <button type="button" onClick={handleClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">Cancel</button>
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