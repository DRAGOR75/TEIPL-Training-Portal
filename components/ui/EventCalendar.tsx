'use client';

import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
} from 'date-fns';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export interface CalendarEvent {
    id: string | number;
    title: string;
    date: Date | string; // ISO string or Date object
    color?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate';
    time?: string;
}

interface EventCalendarProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onDateClick?: (date: Date) => void;
}

const colorMaps = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
};

export default function EventCalendar({ events, onEventClick, onDateClick }: EventCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white border border-slate-200 shadow-air rounded-[1.5rem] overflow-hidden flex flex-col h-[800px]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={today}
                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                    >
                        Today
                    </button>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden p-0.5">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                        >
                            <HiOutlineChevronLeft size={20} />
                        </button>
                        <div className="w-px h-5 bg-slate-200 mx-1" />
                        <button
                            onClick={nextMonth}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                        >
                            <HiOutlineChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {weekDays.map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-100 gap-[1px]">
                {days.map((day, idx) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isTodayDate = isToday(day);

                    // Filter events for this day
                    const dayEvents = events.filter((e) => {
                        const eventDate = typeof e.date === 'string' ? parseISO(e.date) : e.date;
                        return isSameDay(eventDate, day);
                    });

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDateClick?.(day)}
                            className={`min-h-[120px] p-2 flex flex-col bg-white hover:bg-slate-50/50 transition-colors cursor-pointer ${
                                !isCurrentMonth ? 'opacity-40' : ''
                            }`}
                        >
                            <div className="flex justify-end mb-1">
                                <div
                                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                                        isTodayDate
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                            : 'text-slate-700'
                                    }`}
                                >
                                    {format(day, dateFormat)}
                                </div>
                            </div>
                            
                            {/* Events List */}
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
                                {dayEvents.map((evt) => {
                                    const colorClass = colorMaps[evt.color || 'blue'];
                                    return (
                                        <div
                                            key={evt.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick?.(evt);
                                            }}
                                            className={`px-2 py-1.5 rounded-lg border text-xs font-bold truncate cursor-pointer transition-all ${colorClass}`}
                                            title={evt.title}
                                        >
                                            {evt.time && <span className="opacity-70 font-mono mr-1.5">{evt.time}</span>}
                                            {evt.title}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
