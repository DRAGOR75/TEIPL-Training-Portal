'use client';

import { useState } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineCalendar, HiOutlinePlus } from 'react-icons/hi2';
import CreateSessionModal from '@/components/admin/CreateSessionModal';

interface Program {
    id: string;
    name: string;
}

interface Session {
    id: string;
    programName: string;
    trainerName: string | null;
    startDate: Date;
    endDate: Date;
    status?: string;
}

interface GanttCalendarProps {
    programs: Program[];
    sessions: Session[];
    trainers: any[];
    locations: any[];
}

export default function GanttCalendar({ programs, sessions, trainers, locations }: GanttCalendarProps) {
    const [viewDate, setViewDate] = useState(new Date());
    const [modalState, setModalState] = useState<{ trainerName: string, dateStr: string } | null>(null);

    // Month Navigation
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const goToday = () => setViewDate(new Date());

    // Date Math
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // Generate Array of days [1, 2, 3 ... 31]
    const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Filter programs that actually have sessions in this month (or show all if you prefer)
    // To keep it clean, let's show all programs, or maybe just ones with activity. 
    // For a planning board, showing all active programs is best so you can schedule on empty ones.
    const activeTrainers = [...trainers, { id: 'unassigned', name: 'Unassigned' }]; 

    // Helper: Safely calculate bar positions
    const getBarStyles = (session: Session) => {
        const s = new Date(session.startDate);
        const e = new Date(session.endDate);

        // Filter out if not in this month
        if (e < startOfMonth || s > endOfMonth) return null;

        // Clamp
        const effectiveStartDay = s < startOfMonth ? 1 : s.getDate();
        const effectiveEndDay = e > endOfMonth ? daysInMonth : e.getDate();
        
        // duration in days spanning the grid
        const spanDays = effectiveEndDay - effectiveStartDay + 1;

        return {
            left: `calc(${effectiveStartDay - 1} * 100% / ${daysInMonth})`,
            width: `calc(${spanDays} * 100% / ${daysInMonth})`,
        };
    };

    // Helper: Interaction
    const handleGridClick = (trainerName: string, day: number) => {
        // Form wants YYYY-MM-DD
        const clickedDate = new Date(year, month, day);
        const y = clickedDate.getFullYear();
        const m = String(clickedDate.getMonth() + 1).padStart(2, '0');
        const d = String(clickedDate.getDate()).padStart(2, '0');
        
        setModalState({
            trainerName,
            dateStr: `${y}-${m}-${d}`
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[800px]">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <HiOutlineCalendar size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Trainer Schedule</h2>
                        <p className="text-sm font-medium text-slate-500">Master schedule and availability for trainers</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={goToday} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                        Today
                    </button>
                    <div className="flex items-center bg-white border border-slate-300 rounded-xl shadow-sm p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                            <HiOutlineChevronLeft size={18} />
                        </button>
                        <span className="min-w-[140px] text-center font-black text-slate-800 tracking-wide">
                            {viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                            <HiOutlineChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Gantt Container (Scrollable horizontally and vertically) */}
            <div className="flex-1 overflow-auto bg-slate-50 relative">
                <div className="min-w-[1200px] flex flex-col">
                    
                    {/* Header Row (Days) */}
                    <div className="flex sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
                        {/* Y-Axis Label Area */}
                        <div className="w-[300px] shrink-0 border-r border-slate-200 p-4 flex items-center bg-slate-50">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Trainer Name</span>
                        </div>
                        {/* X-Axis Days */}
                        <div className="flex-1 flex relative">
                            {daysList.map(day => {
                                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                                return (
                                    <div 
                                        key={day} 
                                        className={`flex-1 border-r border-slate-100 py-3 flex flex-col items-center justify-center min-w-[40px] ${isToday ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {new Date(year, month, day).toLocaleDateString('default', { weekday: 'narrow' })}
                                        </span>
                                        <span className={`text-sm font-black ${isToday ? 'text-indigo-700 bg-indigo-100 rounded-full w-6 h-6 flex items-center justify-center mt-1' : 'text-slate-700 mt-1'}`}>
                                            {day}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline Rows inside scrollable area */}
                    <div className="flex-1">
                        {activeTrainers.map(trainer => {
                            // Find sessions belonging to this trainer
                            const tSessions = sessions.filter(s => 
                                (trainer.name === 'Unassigned' && (!s.trainerName || s.trainerName === 'Unassigned')) || 
                                (s.trainerName === trainer.name)
                            );
                            
                            return (
                                <div key={trainer.id} className="flex border-b border-slate-200 bg-white hover:bg-slate-50/50 transition-colors group">
                                    {/* Y-Axis Trainer Name */}
                                    <div className="w-[300px] shrink-0 border-r border-slate-200 p-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 transition-colors">
                                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                                            {trainer.name}
                                        </h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-1">
                                            {tSessions.length} Session(s)
                                        </p>
                                    </div>

                                    {/* X-Axis Grid Track */}
                                    <div className="flex-1 flex relative">
                                        
                                        {/* Background Grid Cells (Clickable to Create) */}
                                        <div className="absolute inset-0 flex w-full h-full">
                                            {daysList.map(day => (
                                                <div 
                                                    key={day}
                                                    onClick={() => handleGridClick(trainer.name, day)}
                                                    className="flex-1 border-r border-slate-100 h-full hover:bg-indigo-50/30 cursor-crosshair transition-colors group/cell"
                                                >
                                                    <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100">
                                                        <HiOutlinePlus className="text-indigo-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Overlay Rendered Session Bars */}
                                        <div className="absolute inset-0 w-full h-full pointer-events-none py-2 px-1">
                                            {tSessions.map(session => {
                                                const styles = getBarStyles(session);
                                                if (!styles) return null; // Outside month view

                                                return (
                                                    <div 
                                                        key={session.id}
                                                        style={styles}
                                                        className="absolute top-2 bottom-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-md pointer-events-auto cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all flex items-center px-3 overflow-hidden group/bar"
                                                        onClick={() => alert(`Details for session: ${session.programName} by ${session.trainerName || 'TBD'}`)}
                                                    >
                                                        {/* Bar Content */}
                                                        <div className="min-w-0 pr-2">
                                                            <p className="text-white font-black text-xs truncate">
                                                                {session.programName}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Tooltip on hover */}
                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-30">
                                                            {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {activeTrainers.length === 0 && (
                            <div className="p-12 text-center text-slate-500 font-bold">No active trainers available.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Injection */}
            {modalState && (
                <CreateSessionModal 
                    locations={locations}
                    programs={programs}
                    trainers={trainers}
                    defaultOpen={true}
                    fixedTrainerName={modalState.trainerName !== 'Unassigned' ? modalState.trainerName : undefined}
                    prefillStartDate={modalState.dateStr}
                    onClose={() => setModalState(null)}
                />
            )}
        </div>
    );
}

