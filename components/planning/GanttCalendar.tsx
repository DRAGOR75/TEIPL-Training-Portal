'use client';

import { useState, useRef } from 'react';
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
    location?: string;
}

interface GanttCalendarProps {
    programs: Program[];
    sessions: Session[];
    trainers: any[];
    locations: any[];
    viewDate?: Date;
    onViewDateChange?: (date: Date) => void;
    selectedTrainer?: string | null;
    onTrainerSelect?: (trainerName: string | null) => void;
    readOnly?: boolean;
}

export default function GanttCalendar({ programs, sessions, trainers, locations, viewDate, onViewDateChange, selectedTrainer, onTrainerSelect, readOnly }: GanttCalendarProps) {
    const [localViewDate, setLocalViewDate] = useState(new Date());
    const currentDate = viewDate || localViewDate;

    const updateViewDate = (d: Date) => {
        if (onViewDateChange) onViewDateChange(d);
        setLocalViewDate(d);
    };

    const [modalState, setModalState] = useState<{ trainerName: string, dateStr: string } | null>(null);
    const scrollLock = useRef(false);

    // Month Navigation
    const nextMonth = () => updateViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => updateViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToday = () => updateViewDate(new Date());

    const handleWheel = (e: React.WheelEvent) => {
        if (Math.abs(e.deltaX) > 20 && Math.abs(e.deltaX) > Math.abs(e.deltaY) && !scrollLock.current) {
            scrollLock.current = true;
            if (e.deltaX > 0) {
                nextMonth();
            } else {
                prevMonth();
            }
            setTimeout(() => {
                scrollLock.current = false;
            }, 500); // 500ms cooldown to prevent double-swipes
        }
    };

    // Date Math
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // Generate Array of days [1, 2, 3 ... 31]
    const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Filter programs that actually have sessions in this month (or show all if you prefer)
    // To keep it clean, let's show all programs, or maybe just ones with activity. 
    // For a planning board, showing all active programs is best so you can schedule on empty ones.
    const activeTrainers = [...trainers, { id: 'unassigned', name: 'Unassigned' }];

    const trainerColors = [
        'from-blue-500 to-blue-600',
        'from-emerald-500 to-emerald-600',
        'from-amber-500 to-amber-600',
        'from-rose-500 to-rose-600',
        'from-purple-500 to-purple-600',
        'from-cyan-500 to-cyan-600',
        'from-pink-500 to-pink-600',
        'from-orange-500 to-orange-600',
    ];

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
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">

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
                            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                            <HiOutlineChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Gantt Container (Scrollable horizontally and vertically) */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 relative custom-scrollbar"
                onWheel={handleWheel}
            >
                <div className="min-w-[800px] flex flex-col">

                    {/* Header Row (Days) */}
                    <div className="flex sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
                        {/* Y-Axis Label Area */}
                        <div className="w-[180px] shrink-0 border-r border-slate-200 p-4 flex items-center bg-slate-50">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Trainer Name</span>
                        </div>
                        {/* X-Axis Days */}
                        <div className="flex-1 flex relative">
                            {daysList.map(day => {
                                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                                return (
                                    <div
                                        key={day}
                                        className={`flex-1 border-r border-slate-100 py-2 flex flex-col items-center justify-center min-w-[28px] ${isToday ? 'bg-indigo-50/50' : ''}`}
                                    >
                                        <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {new Date(year, month, day).toLocaleDateString('default', { weekday: 'narrow' })}
                                        </span>
                                        <span className={`text-xs font-black ${isToday ? 'text-indigo-700 bg-indigo-100 rounded-full w-5 h-5 flex items-center justify-center mt-0.5' : 'text-slate-700 mt-0.5'}`}>
                                            {day}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline Rows inside scrollable area */}
                    <div className="flex-1 pb-48">
                        {activeTrainers.map((trainer, index) => {
                            // Find sessions belonging to this trainer (handles multiple trainers per session)
                            const tSessions = sessions.filter(s => {
                                if (trainer.name === 'Unassigned') {
                                    return !s.trainerName || s.trainerName === 'Unassigned' || s.trainerName === 'TBD';
                                }
                                if (!s.trainerName) return false;

                                // Split by comma, ampersand, or 'and' to check if this trainer is part of the string
                                const sessionTrainers = s.trainerName.split(/,|&|\band\b/i).map(t => t.trim());
                                return sessionTrainers.includes(trainer.name);
                            });

                            const colorClass = trainer.name === 'Unassigned'
                                ? 'from-slate-400 to-slate-500'
                                : trainerColors[index % trainerColors.length];

                            return (
                                <div key={trainer.id} className="flex border-b border-slate-200 bg-white hover:bg-slate-50/50 transition-colors group">
                                    {/* Y-Axis Trainer Name */}
                                    <div
                                        className={`w-[180px] shrink-0 border-r border-slate-200 p-4 sticky left-0 z-10 group-hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedTrainer === trainer.name ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white'}`}
                                        onClick={() => {
                                            if (onTrainerSelect) {
                                                onTrainerSelect(selectedTrainer === trainer.name ? null : trainer.name);
                                            }
                                        }}
                                    >
                                        <h3 className={`text-xs font-bold line-clamp-2 leading-snug transition-colors ${selectedTrainer === trainer.name ? 'text-indigo-700' : 'text-slate-800 group-hover:text-indigo-700'}`}>
                                            {trainer.name}
                                        </h3>
                                        <p className={`text-[10px] font-semibold mt-0.5 ${selectedTrainer === trainer.name ? 'text-indigo-400' : 'text-slate-400'}`}>
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
                                                    onClick={() => !readOnly && handleGridClick(trainer.name, day)}
                                                    className={`flex-1 border-r border-slate-100 h-full transition-colors group/cell ${!readOnly ? 'hover:bg-indigo-50/30 cursor-crosshair' : ''}`}
                                                >
                                                    {!readOnly && (
                                                        <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100">
                                                            <HiOutlinePlus className="text-indigo-300" />
                                                        </div>
                                                    )}
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
                                                        className={`absolute top-2 bottom-2 bg-gradient-to-r ${colorClass} rounded-lg shadow-md pointer-events-auto flex items-center px-3 group/bar ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
                                                        onClick={() => {
                                                            if (!readOnly) window.open(`/admin/sessions/${session.id}/manage`, '_blank');
                                                        }}
                                                    >
                                                        {/* Bar Content */}
                                                        <div className="min-w-0 pr-2">
                                                            <p className="text-white font-black text-xs truncate">
                                                                {session.programName}
                                                            </p>
                                                        </div>

                                                        {/* Detailed Tooltip on hover */}
                                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white p-3 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none w-max max-w-[250px] shadow-2xl z-[60] flex flex-col gap-1.5 border border-slate-700">
                                                            <div className="font-black text-sm text-indigo-200 truncate">{session.programName}</div>

                                                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                                                                <span className="text-slate-400 font-medium">Dates:</span>
                                                                <span className="font-bold">{new Date(session.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(session.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>

                                                                <span className="text-slate-400 font-medium">Location:</span>
                                                                <span className="font-bold">{session.location || 'TBD'}</span>

                                                                <span className="text-slate-400 font-medium">Trainer:</span>
                                                                <span className="font-bold">{session.trainerName || 'TBD'}</span>

                                                                <span className="text-slate-400 font-medium">Status:</span>
                                                                <span className={`font-bold ${session.status === 'Forming' ? 'text-amber-400' : 'text-emerald-400'}`}>{session.status || 'Scheduled'}</span>
                                                            </div>

                                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
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

