'use client';

import { useState } from 'react';
import LocationGanttCalendar from '@/components/planning/LocationGanttCalendar';
import EmployeeCalendarClient from '@/components/user/EmployeeCalendarClient';

interface CalendarSyncClientProps {
    programs: any[];
    sessions: any[];
    trainers: any[];
    locations: any[];
    upcomingEvents: any[];
    empId: string | null;
}

export default function CalendarSyncClient({ programs, sessions, trainers, locations, upcomingEvents, empId }: CalendarSyncClientProps) {
    const [viewDate, setViewDate] = useState(new Date());

    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

    // Filter events to only show those that overlap with the currently viewed month
    const filteredEvents = upcomingEvents.filter(event => {
        const s = new Date(event.proposedStartDate);
        const e = new Date(event.proposedEndDate);
        return s <= endOfMonth && e >= startOfMonth;
    });

    return (
        <>
            <div className="mb-12">
                <LocationGanttCalendar
                    programs={programs}
                    sessions={sessions}
                    trainers={trainers}
                    locations={locations}
                    readOnly={true}
                    viewDate={viewDate}
                    onViewDateChange={setViewDate}
                />
            </div>
            
            <EmployeeCalendarClient events={filteredEvents} empId={empId} />
        </>
    );
}
