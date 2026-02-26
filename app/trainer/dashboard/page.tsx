import { getCalendarMetadata, getSessionsForDate } from '@/app/actions';
import { db } from '@/lib/prisma';
import { getServerLocalDateString } from '@/lib/date-utils';
import TrainerDashboardClient from './TrainerDashboardClient';
import { Metadata } from 'next';
import { auth } from '@/auth';

export const metadata: Metadata = {
    title: 'Trainer Dashboard | Thriveni Training',
    description: 'View your training sessions and feedbacks.',
};

export const dynamic = 'force-dynamic';

export default async function TrainerDashboardPage() {
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

    const today = new Date();

    const [calendarMetadata, todayData, programs, locations] = await Promise.all([
        getCalendarMetadata(trainerName),
        getSessionsForDate(getServerLocalDateString(), trainerName),
        db.program.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        db.location.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    return (
        <TrainerDashboardClient
            initialMetadata={calendarMetadata}
            initialSessions={todayData.sessions as any}
            programs={programs}
            locations={locations}
            initialPendingReviews={todayData.pendingCount}
            currentPage={1}
            totalPages={1}
        />
    );
}