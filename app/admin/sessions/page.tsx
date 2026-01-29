import { getCalendarMetadata } from '@/app/actions';
import { getTrainingSessionsForDate } from '@/app/actions/sessions';
import { getTrainers } from '@/app/actions/trainers';
import SessionsDashboard from './SessionsDashboard';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
    const today = new Date();
    // Simple ISO split for server-side initial render
    const dateStr = today.toISOString().split('T')[0];

    const [calendarMetadata, initialSessions, trainersData] = await Promise.all([
        getCalendarMetadata(),
        getTrainingSessionsForDate(dateStr),
        getTrainers()
    ]);

    return (
        <SessionsDashboard
            initialSessions={initialSessions as any}
            initialMetadata={calendarMetadata}
            initialTrainers={trainersData}
        />
    );
}
