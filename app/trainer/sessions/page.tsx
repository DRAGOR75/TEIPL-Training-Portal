import { getCalendarMetadata } from '@/app/actions';
import { db } from '@/lib/prisma';
import { getServerLocalDateString } from '@/lib/date-utils';
import { getTrainingSessionsForDate } from '@/app/actions/sessions';
import { getTrainers } from '@/app/actions/trainers';
import TrainerSessionsDashboard from './TrainerSessionsDashboard';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function TrainerSessionsPage() {
    // 0. Get the current user session
    const session = await auth();
    let trainerName: string | undefined = undefined;

    // Filter sessions by the logged in Trainer's name
    if (session?.user?.email) {
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
        <TrainerSessionsDashboard
            initialSessions={initialSessions as any}
            initialMetadata={calendarMetadata}
            initialTrainers={trainersData}
            programs={programs}
            locations={locations}
            currentTrainerName={trainerName}
        />
    );
}
