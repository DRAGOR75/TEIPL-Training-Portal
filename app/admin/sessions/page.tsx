import { getCalendarMetadata } from '@/app/actions';
import { db } from '@/lib/prisma';
import { getServerLocalDateString } from '@/lib/date-utils';
import { getTrainingSessionsForDate } from '@/app/actions/sessions';
import { getTrainers } from '@/app/actions/trainers';
import SessionsDashboard from './SessionsDashboard';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
    // 0. Get the current user session
    const session = await auth();
    const isTrainer = session?.user?.role === 'TRAINER';
    let trainerName: string | undefined = undefined;

    // If the user is a trainer, grab their trainer record name to filter sessions
    if (isTrainer && session?.user?.email) {
        const trainerRecord = await db.trainer.findUnique({
            where: { email: session.user.email }
        });
        if (trainerRecord) {
            trainerName = trainerRecord.name;
        }
    }

    // Use server-side local date helper to align with client-side IST expectation
    const dateStr = getServerLocalDateString();

    const [calendarMetadata, initialSessions, trainersData, programs, locations] = await Promise.all([
        getCalendarMetadata(trainerName),
        getTrainingSessionsForDate(dateStr, trainerName),
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
            currentTrainerName={trainerName}
        />
    );
}
