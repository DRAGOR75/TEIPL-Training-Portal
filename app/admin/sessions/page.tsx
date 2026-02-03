import { getCalendarMetadata } from '@/app/actions';
import { db } from '@/lib/prisma';
import { getServerLocalDateString } from '@/lib/date-utils';
import { getTrainingSessionsForDate } from '@/app/actions/sessions';
import { getTrainers } from '@/app/actions/trainers';
import SessionsDashboard from './SessionsDashboard';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
    // Use server-side local date helper to align with client-side IST expectation
    const dateStr = getServerLocalDateString();

    const [calendarMetadata, initialSessions, trainersData, programs, locations] = await Promise.all([
        getCalendarMetadata(),
        getTrainingSessionsForDate(dateStr),
        getTrainers(),
        db.program.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        db.location.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    return (
        <SessionsDashboard
            initialSessions={initialSessions}
            initialMetadata={calendarMetadata}
            initialTrainers={trainersData}
            programs={programs}
            locations={locations}
        />
    );
}
