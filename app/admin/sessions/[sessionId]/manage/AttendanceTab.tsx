'use client';

import { useState, useEffect, useMemo } from 'react';
import { saveDailyAttendance, finalizeParticipantTraining, updateSessionClassDates } from '@/app/actions/attendance';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCalendar, HiOutlinePlus } from 'react-icons/hi2';

export default function AttendanceTab({ session }: { session: any }) {
    const [isSaving, setIsSaving] = useState(false);
    const [newDateStr, setNewDateStr] = useState('');

    const classDates = session.classDates || [];

    const availableDates = useMemo(() => {
        if (!session.startDate || !session.endDate) return [];
        const start = new Date(session.startDate);
        const end = new Date(session.endDate);
        const dates = [];
        let current = new Date(start);
        current.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        while (current <= end) {
            const dateObj = new Date(current);
            // Handle timezone offset to ensure correct string
            const offset = dateObj.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(dateObj.getTime() - offset)).toISOString().slice(0, -1);
            dates.push(localISOTime.split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [session.startDate, session.endDate]);

    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    
    useEffect(() => {
        if (availableDates.length > 0 && selectedDates.length === 0 && classDates.length === 0) {
            setSelectedDates(availableDates);
        }
    }, [availableDates]);

    const handleSaveBulkDates = async () => {
        if (selectedDates.length === 0) return;
        setIsSaving(true);
        const newDates = selectedDates.map(d => new Date(d));
        const res = await updateSessionClassDates(session.id, newDates);
        if (!res.success) {
            alert(res.error || "Failed to add training dates");
        }
        setIsSaving(false);
    };

    // State for local attendance records (optimistic UI)
    const [localAttendance, setLocalAttendance] = useState<Record<string, Record<string, 'Present' | 'Absent'>>>({});
    const [localFinalized, setLocalFinalized] = useState<Record<string, 'Completed' | 'Absent'>>({});

    useEffect(() => {
        const initialMap: Record<string, Record<string, 'Present' | 'Absent'>> = {};
        session.attendanceRecords?.forEach((record: any) => {
            const dateStr = new Date(record.date).toISOString().split('T')[0];
            if (!initialMap[record.empId]) initialMap[record.empId] = {};
            initialMap[record.empId][dateStr] = record.status;
        });
        setLocalAttendance(initialMap);
    }, [session.attendanceRecords]);

    const enrolledNominations = session.nominationBatch?.nominations || [];

    const handleAddDate = async () => {
        if (!newDateStr) return;
        setIsSaving(true);
        // Check if it already exists
        const exists = classDates.some((d: any) => new Date(d).toISOString().split('T')[0] === newDateStr);
        if (exists) {
            setNewDateStr('');
            setIsSaving(false);
            return;
        }
        
        const newDates = [...classDates, new Date(newDateStr)];
        const res = await updateSessionClassDates(session.id, newDates);
        if (res.success) {
            setNewDateStr('');
        } else {
            alert(res.error || "Failed to add training date");
        }
        setIsSaving(false);
    };

    const toggleAttendance = (empId: string, dateObj: Date) => {
        const dateStr = new Date(dateObj).toISOString().split('T')[0];
        const currentStatus = localAttendance[empId]?.[dateStr] || 'Present';
        const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';

        // 1. Optimistic update
        setLocalAttendance(prev => ({
            ...prev,
            [empId]: {
                ...(prev[empId] || {}),
                [dateStr]: newStatus
            }
        }));

        // 2. Call server action in the background
        saveDailyAttendance(session.id, empId, dateObj, newStatus).then(res => {
            if (!res.success) {
                alert('Failed to save attendance');
                // Revert status
                setLocalAttendance(prev => ({
                    ...prev,
                    [empId]: {
                        ...(prev[empId] || {}),
                        [dateStr]: currentStatus
                    }
                }));
            }
        }).catch(err => {
            console.error(err);
            alert('Failed to save attendance');
            // Revert status
            setLocalAttendance(prev => ({
                ...prev,
                [empId]: {
                    ...(prev[empId] || {}),
                    [dateStr]: currentStatus
                }
            }));
        });
    };

    const getAttendancePercentage = (empId: string) => {
        if (classDates.length === 0) return 0;
        let presentCount = 0;
        classDates.forEach((dateObj: any) => {
            const dateStr = new Date(dateObj).toISOString().split('T')[0];
            const status = localAttendance[empId]?.[dateStr] || 'Present';
            if (status === 'Present') presentCount++;
        });
        return Math.round((presentCount / classDates.length) * 100);
    };

    const handleFinalize = async (empId: string, finalStatus: 'Completed' | 'Absent') => {
        if (!confirm(`Are you sure you want to mark this participant as ${finalStatus}? This will update their TNI record.`)) return;
        
        // Optimistic UI update
        setLocalFinalized(prev => ({ ...prev, [empId]: finalStatus }));
        
        const perc = getAttendancePercentage(empId);
        const res = await finalizeParticipantTraining(session.id, session.nominationBatchId, empId, finalStatus, perc);
        if (!res.success) {
            alert(res.error || 'Failed to finalize participant');
            // Revert on failure
            setLocalFinalized(prev => {
                const next = { ...prev };
                delete next[empId];
                return next;
            });
        }
    };

    // Constrain the date picker to the session boundaries
    const minDate = session.startDate ? new Date(session.startDate).toISOString().split('T')[0] : undefined;
    const maxDate = session.endDate ? new Date(session.endDate).toISOString().split('T')[0] : undefined;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Daily Attendance & Finalization</h3>
                        <p className="text-sm text-slate-500">Add the specific dates you hold training, then mark attendance.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Add Date Input */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex-1 md:flex-initial">
                            <input 
                                type="date"
                                min={minDate}
                                max={maxDate}
                                value={newDateStr}
                                onChange={(e) => setNewDateStr(e.target.value)}
                                className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 w-full"
                            />
                            <button 
                                onClick={handleAddDate}
                                disabled={isSaving || !newDateStr}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center"
                                title="Add Training Date"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <a 
                            href={`/admin/sessions/${session.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-bold border border-indigo-200 px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                            </svg>
                            Print Sheet
                        </a>
                    </div>
                </div>

                {/* Removed View Date Selector */}
            </div>

            {classDates.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center bg-slate-50 border-t border-slate-100 min-h-[400px]">
                    <div className="bg-white p-8 rounded-3xl shadow-air border border-slate-200 w-full max-w-lg">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineCalendar className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2 text-center">Select Training Dates</h4>
                        <p className="text-sm text-slate-500 mb-6 text-center">
                            Please select all the dates on which this training was held.
                        </p>
                        
                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto p-2">
                            {availableDates.length > 0 ? (
                                <>
                                    <div className="flex justify-between items-center mb-2 px-2">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Available Dates</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setSelectedDates(availableDates)}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-slate-300">|</span>
                                            <button 
                                                onClick={() => setSelectedDates([])}
                                                className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableDates.map(dateStr => {
                                            const isSelected = selectedDates.includes(dateStr);
                                            const dateObj = new Date(dateStr);
                                            const displayStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                                            const dayStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                                            
                                            return (
                                                <label 
                                                    key={dateStr}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                        isSelected 
                                                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                                                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-600"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedDates([...selectedDates, dateStr]);
                                                            } else {
                                                                setSelectedDates(selectedDates.filter(d => d !== dateStr));
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{displayStr}</span>
                                                        <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>{dayStr}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4 bg-orange-50 text-orange-800 rounded-xl border border-orange-200 text-sm">
                                    No start and end dates found for this session. Please set them in the session details first.
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <button 
                                onClick={handleSaveBulkDates}
                                disabled={isSaving || selectedDates.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl transition-all font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving Dates...
                                    </>
                                ) : (
                                    `Save Selected Dates (${selectedDates.length})`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="p-4 sticky left-0 bg-slate-50 z-20 w-64 border-r border-slate-200">Employee</th>
                                
                                {/* Date Columns */}
                                {classDates.map((dateObj: any, idx: number) => (
                                    <th key={idx} className="p-4 text-center min-w-[120px] bg-blue-50 z-10 border-b border-blue-100 border-r border-blue-100/50">
                                        <div className="font-bold text-blue-800">
                                            {new Date(dateObj).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="text-[10px] text-blue-500 uppercase tracking-widest mt-1">
                                            {new Date(dateObj).toLocaleDateString('en-GB', { weekday: 'short' })}
                                        </div>
                                    </th>
                                ))}

                                <th className="p-4 text-center min-w-[100px] border-l border-slate-200">Attendance %</th>
                                <th className="p-4 text-center min-w-[200px]">Finalize Training</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {enrolledNominations.map((nom: any) => {
                                const empId = nom.employee.id;
                                const perc = getAttendancePercentage(empId);
                                const isCompleted = nom.status === 'Completed' || localFinalized[empId] === 'Completed';
                                const isAbsent = nom.status === 'Absent' || localFinalized[empId] === 'Absent';
                                const isFinalized = isCompleted || isAbsent;

                                const todayStr = new Date().toISOString().split('T')[0];
                                const endDateStr = session.endDate ? new Date(session.endDate).toISOString().split('T')[0] : '';
                                const canFinalize = endDateStr ? todayStr >= endDateStr : true;

                                // Removed statusForSelectedDate logic

                                return (
                                    <tr key={nom.id} className="hover:bg-slate-50 group">
                                        <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10 transition-colors">
                                            <div className="font-bold text-slate-900">{nom.employee.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{empId}</div>
                                        </td>
                                        
                                        {/* Date Columns */}
                                        {classDates.map((dateObj: any, idx: number) => {
                                            const dateStr = new Date(dateObj).toISOString().split('T')[0];
                                            const isFutureDate = dateStr > todayStr;
                                            const statusForDate = localAttendance[empId]?.[dateStr] || 'Present';
                                            
                                            const isDisabled = isSaving || isFinalized || isFutureDate;
                                            
                                            return (
                                                <td key={idx} className="p-4 text-center border-r border-slate-100">
                                                    {isFutureDate ? (
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block mt-2">
                                                            Available {new Date(dateObj).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => toggleAttendance(empId, dateObj)}
                                                                disabled={isDisabled}
                                                                className={`transition-all rounded-full p-2 border-2 shadow-sm ${
                                                                    isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''
                                                                } ${
                                                                    statusForDate === 'Present' 
                                                                    ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                                }`}
                                                                title={isFinalized ? 'Training finalized' : `Currently ${statusForDate}. Click to change.`}
                                                            >
                                                                {statusForDate === 'Present' 
                                                                    ? <HiOutlineCheckCircle className="w-5 h-5" /> 
                                                                    : <HiOutlineXCircle className="w-5 h-5" />
                                                                }
                                                            </button>
                                                            <div className={`text-[9px] mt-2 font-black tracking-widest uppercase ${statusForDate === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {statusForDate}
                                                            </div>
                                                        </>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        <td className="p-4 text-center border-l border-slate-200">
                                            <div className="font-bold text-lg text-slate-700">{perc}%</div>
                                        </td>

                                        <td className="p-4 text-center">
                                            {isFinalized ? (
                                                <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
                                                    isCompleted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {isCompleted ? 'Completed' : 'Absent'}
                                                </div>
                                            ) : !canFinalize ? (
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full inline-block border border-slate-100">
                                                    Available {session.endDate ? new Date(session.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'later'}
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 justify-center">
                                                    <button 
                                                        onClick={() => handleFinalize(empId, 'Completed')}
                                                        disabled={isSaving}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold tracking-wider transition-colors shadow-sm uppercase"
                                                        title="Mark as Completed"
                                                    >
                                                        Mark Completed
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFinalize(empId, 'Absent')}
                                                        disabled={isSaving}
                                                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] font-bold tracking-wider transition-colors uppercase"
                                                        title="Mark as Absent"
                                                    >
                                                        Mark Absent
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {enrolledNominations.length === 0 && (
                        <div className="p-12 flex justify-center items-center border-t border-slate-100">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center max-w-sm">
                                <h4 className="font-bold text-slate-700 mb-2">No Participants Yet</h4>
                                <p className="text-xs text-slate-500">Add employees from the waitlist before tracking attendance.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
