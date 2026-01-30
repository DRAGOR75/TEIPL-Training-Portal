import { getCalendarMetadata } from '@/app/actions';
import { getServerLocalDateString } from '@/lib/date-utils';
import { getTrainingSessionsForDate } from '@/app/actions/sessions';
import { getTrainers } from '@/app/actions/trainers';
import SessionsDashboard from './SessionsDashboard';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
    // Use server-side local date helper to align with client-side IST expectation
    const dateStr = getServerLocalDateString();

    const [calendarMetadata, initialSessions, trainersData] = await Promise.all([
        getCalendarMetadata(),
        getTrainingSessionsForDate(dateStr),
        getTrainers()
    ]);

    return (
        <SessionsDashboard
            initialSessions={initialSessions}
            initialMetadata={calendarMetadata}
            initialTrainers={trainersData}
        />
    );
}
