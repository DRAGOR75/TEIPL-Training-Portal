'use client';

import { useState } from 'react';
import { saveDailyAttendance } from '@/app/actions/attendance';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

export default function AttendanceTab({ session }: { session: any }) {
    const [isSaving, setIsSaving] = useState(false);

    const classDates = session.classDates || [];
    
    // Map: empId -> { dateStr: status }
    const attendanceMap = new Map();
    session.attendanceRecords?.forEach((record: any) => {
        // Use consistent ISO date mapping to match dates without timezones messing it up
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        if (!attendanceMap.has(record.empId)) attendanceMap.set(record.empId, {});
        attendanceMap.get(record.empId)[dateStr] = record.status;
    });

    const enrolledNominations = session.nominationBatch?.nominations || [];

    const toggleAttendance = async (empId: string, dateObj: Date) => {
        setIsSaving(true);
        const dateStr = new Date(dateObj).toISOString().split('T')[0];
        // If undefined, default is Present, so toggle to Absent.
        const currentStatus = attendanceMap.get(empId)?.[dateStr] || 'Present';
        const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';

        const res = await saveDailyAttendance(session.id, empId, dateObj, newStatus);
        if (!res.success) {
            alert('Failed to save attendance');
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Daily Attendance</h3>
                    <p className="text-sm text-slate-500">Track attendance for each class day. Click to toggle.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="p-4 sticky left-0 bg-slate-50 z-20 w-64 border-r border-slate-200">Employee</th>
                            {classDates.map((dateObj: any, idx: number) => {
                                const d = new Date(dateObj);
                                return (
                                    <th key={idx} className="p-4 text-center min-w-[120px] bg-slate-50 z-10 border-b border-slate-200">
                                        <div className="font-bold text-slate-800">
                                            {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                                            {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {enrolledNominations.map((nom: any) => (
                            <tr key={nom.id} className="hover:bg-slate-50 group">
                                <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10 transition-colors">
                                    <div className="font-bold text-slate-900">{nom.employee.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{nom.employee.id}</div>
                                </td>
                                {classDates.map((dateObj: any, idx: number) => {
                                    const dateStr = new Date(dateObj).toISOString().split('T')[0];
                                    const status = attendanceMap.get(nom.employee.id)?.[dateStr] || 'Present';
                                    
                                    return (
                                        <td key={idx} className="p-4 text-center">
                                            <button 
                                                onClick={() => toggleAttendance(nom.employee.id, dateObj)}
                                                disabled={isSaving}
                                                className={`transition-all rounded-full p-2 border-2 shadow-sm ${status === 'Present' 
                                                    ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                                                title={`Currently ${status}. Click to change.`}
                                            >
                                                {status === 'Present' 
                                                    ? <HiOutlineCheckCircle className="w-5 h-5" /> 
                                                    : <HiOutlineXCircle className="w-5 h-5" />
                                                }
                                            </button>
                                            <div className={`text-[9px] mt-2 font-black tracking-widest uppercase ${status === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                                                {status}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {enrolledNominations.length === 0 && (
                    <div className="p-12 flex justify-center items-center">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center max-w-sm">
                            <h4 className="font-bold text-slate-700 mb-2">No Participants Yet</h4>
                            <p className="text-xs text-slate-500">Add employees from the waitlist before tracking attendance.</p>
                        </div>
                    </div>
                )}
                {enrolledNominations.length > 0 && classDates.length === 0 && (
                    <div className="p-12 text-center text-slate-500 text-sm">
                        No class dates defined for this session.
                    </div>
                )}
            </div>
        </div>
    );
}
