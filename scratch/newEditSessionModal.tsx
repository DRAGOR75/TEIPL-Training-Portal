'use client'

import { useState } from 'react';
import { updateSession } from '@/app/actions/update-session';
import { updateBatch } from '@/app/actions/update-batch';
import { saveDailyAttendance, updateSessionClassDates } from '@/app/actions/attendance';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { HiOutlineXMark, HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineCog6Tooth, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi2';

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
    const [activeTab, setActiveTab] = useState<'details' | 'attendance' | 'settings'>('details');

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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

                {/* Ribbon Header */}
                <div className="bg-slate-50 border-b flex justify-between items-end shrink-0 pt-3">
                    <div className="flex px-4 gap-2">
                        <button onClick={() => setActiveTab('details')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-xl'}`}>
                            <HiOutlineDocumentText size={18} /> Details
                        </button>
                        <button onClick={() => setActiveTab('attendance')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-xl'}`}>
                            <HiOutlineCalendarDays size={18} /> Attendance
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-xl'}`}>
                            <HiOutlineCog6Tooth size={18} /> Settings
                        </button>
                    </div>
                    <div className="pr-4 pb-2">
                        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-2 bg-white rounded-full shadow-sm border border-slate-200"><HiOutlineXMark size={20} /></button>
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    {activeTab === 'details' && (
                        <DetailsTab 
                            session={session} 
                            trainers={trainers} 
                            locations={locations} 
                            mode={mode} 
                            handleClose={handleClose} 
                        />
                    )}
                    
                    {activeTab === 'attendance' && (
                        <AttendanceTab session={session} />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab session={session} handleClose={handleClose} />
                    )}
                </div>

            </div>
        </div>
    );
}

function DetailsTab({ session, trainers, locations, mode, handleClose }: any) {
    // Form State pre-filled with session data
    const initialTrainers = session.trainerName 
        ? session.trainerName.split(/,|&|\band\b/i).map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        : [''];
    const [selectedTrainers, setSelectedTrainers] = useState<string[]>(initialTrainers.length > 0 ? initialTrainers : ['']);
    
    const isLocationInList = session.location ? locations.some((l:any) => l.name === session.location) : false;
    const initialLocationMode = (!session.location || isLocationInList) ? 'select' : 'custom';
    
    const [locationMode, setLocationMode] = useState<'select' | 'custom'>(initialLocationMode);
    const [selectedLocation, setSelectedLocation] = useState<string>(isLocationInList ? session.location : '');
    const [customLocation, setCustomLocation] = useState<string>(!isLocationInList ? (session.location || '') : '');
    
    const formatDateForInput = (dateObj: Date | string | null) => {
        if (!dateObj) return '';
        const d = new Date(dateObj);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    };

    const [assessmentDate, setAssessmentDate] = useState<string>(formatDateForInput(session.assessmentDate));

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const endStr = e.target.value;
        const end = new Date(endStr);
        if (!isNaN(end.getTime())) {
            const assessment = new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000);
            setAssessmentDate(formatDateForInput(assessment));
        }
    };

    const trainerOptions = trainers.map((t:any) => ({ label: t.name, value: t.name }));
    const locationOptions = locations.map((l:any) => ({ label: l.name, value: l.name }));
    locationOptions.push({ label: "Other (Type Custom)", value: "OTHER_CUSTOM" });

    return (
        <div className="overflow-y-auto p-6 h-full custom-scrollbar">
            <form action={async (formData) => {
                const activeTrainers = selectedTrainers.filter(t => t.trim() !== '');
                formData.set('trainerName', activeTrainers.join(' & '));

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
    );
}

function AttendanceTab({ session }: { session: any }) {
    const [classDates, setClassDates] = useState<Date[]>(
        session.classDates ? session.classDates.map((d: any) => new Date(d)).sort((a:Date,b:Date) => a.getTime() - b.getTime()) : []
    );
    const [newDate, setNewDate] = useState('');
    const [isSavingDates, setIsSavingDates] = useState(false);

    const nominations = session.nominationBatch?.nominations?.filter((n: any) => n.status === 'Batched') || [];

    const [records, setRecords] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        if (session.attendanceRecords) {
            session.attendanceRecords.forEach((r: any) => {
                const dateStr = new Date(r.date).toISOString().split('T')[0];
                init[`${r.empId}_${dateStr}`] = r.status;
            });
        }
        return init;
    });

    const handleAddDate = async () => {
        if (!newDate) return;
        const d = new Date(newDate);
        if (isNaN(d.getTime())) return;
        
        const dateStr = d.toISOString().split('T')[0];
        if (classDates.some(cd => cd.toISOString().split('T')[0] === dateStr)) return;

        const updatedDates = [...classDates, d].sort((a, b) => a.getTime() - b.getTime());
        setClassDates(updatedDates);
        setNewDate('');

        setIsSavingDates(true);
        await updateSessionClassDates(session.id, updatedDates);
        setIsSavingDates(false);
    };

    const handleRemoveDate = async (dateToRemove: Date) => {
        const dateStr = dateToRemove.toISOString().split('T')[0];
        const updatedDates = classDates.filter(d => d.toISOString().split('T')[0] !== dateStr);
        setClassDates(updatedDates);

        setIsSavingDates(true);
        await updateSessionClassDates(session.id, updatedDates);
        setIsSavingDates(false);
    };

    const handleMarkAttendance = async (empId: string, date: Date, status: 'Present' | 'Absent') => {
        const dateStr = date.toISOString().split('T')[0];
        const key = `${empId}_${dateStr}`;
        setRecords(prev => ({ ...prev, [key]: status }));
        
        await saveDailyAttendance(session.id, empId, date, status);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            <div className="p-5 border-b border-slate-200 shrink-0 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Manage Class Dates</h3>
                <div className="flex flex-wrap gap-2 items-center">
                    {classDates.map((d, i) => (
                        <div key={i} className="flex items-center gap-1 bg-indigo-100 text-indigo-800 pl-3 pr-1 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 shadow-sm">
                            {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}
                            <button onClick={() => handleRemoveDate(d)} className="ml-1 p-1 hover:bg-indigo-200 rounded text-indigo-500 hover:text-indigo-700 transition-colors">
                                <HiOutlineXMark size={14} />
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 ml-1">
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="p-1.5 text-xs border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={handleAddDate} disabled={isSavingDates} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-50 shadow-sm disabled:opacity-50 flex items-center gap-1 transition-colors">
                            <HiOutlinePlus size={14} /> Add Date
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-0 relative custom-scrollbar">
                {classDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-10">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                            <HiOutlineCalendarDays size={32} />
                        </div>
                        <h4 className="font-bold text-slate-700 text-base">No Class Dates Added</h4>
                        <p className="text-sm text-slate-500 max-w-[300px] mt-2">Add dates in the toolbar above to start tracking attendance for participants.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100/80 font-bold text-slate-600 text-xs sticky top-0 z-20 shadow-sm backdrop-blur-sm">
                            <tr>
                                <th className="px-5 py-3 sticky left-0 z-30 border-r border-slate-200 bg-slate-100">Participant</th>
                                {classDates.map((d, i) => (
                                    <th key={i} className="px-5 py-3 text-center border-r border-slate-200 min-w-[120px]">
                                        {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short'})}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {nominations.map((nom: any) => (
                                <tr key={nom.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-5 py-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                                        <div className="font-bold text-slate-800 text-sm truncate max-w-[200px]" title={nom.employee?.name}>{nom.employee?.name}</div>
                                        <div className="font-medium text-slate-400 text-xs mt-0.5">{nom.empId}</div>
                                    </td>
                                    {classDates.map((d, i) => {
                                        const dateStr = d.toISOString().split('T')[0];
                                        const key = `${nom.empId}_${dateStr}`;
                                        const status = records[key];
                                        return (
                                            <td key={i} className="px-5 py-3 text-center border-r border-slate-100">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleMarkAttendance(nom.empId, d, 'Present')}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${status === 'Present' ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200 scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                                        title="Present"
                                                    >
                                                        P
                                                    </button>
                                                    <button 
                                                        onClick={() => handleMarkAttendance(nom.empId, d, 'Absent')}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${status === 'Absent' ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-200 scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                                        title="Absent"
                                                    >
                                                        A
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {nominations.length === 0 && (
                                <tr>
                                    <td colSpan={classDates.length + 1} className="px-5 py-12 text-center text-slate-500 text-sm font-bold bg-slate-50/50">
                                        No participants enrolled in this session yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function SettingsTab({ session, handleClose }: any) {
    return (
        <div className="p-6 overflow-y-auto h-full">
            <h3 className="font-bold text-slate-800 mb-6 text-lg border-b pb-2">Session Settings</h3>
            
            <div className="space-y-6">
                <div>
                    <h4 className="font-bold text-slate-700 text-sm mb-2">Danger Zone</h4>
                    <div className="border border-red-200 bg-red-50/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h5 className="font-bold text-red-900 text-sm">Delete Training Session</h5>
                            <p className="text-xs text-red-700 font-medium mt-1">Permanently delete this session and all associated attendance records. This action cannot be undone.</p>
                        </div>
                        <button className="px-4 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
                            <HiOutlineTrash size={18}/> Delete Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
