import { getCalendarMetadata, getSessionsForDate } from '@/app/actions';
import { getServerLocalDateString } from '@/lib/date-utils';
import { getTrainers } from '@/app/actions/trainers';
import DashboardClient from './DashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Thriveni Training',
    description: 'Manage training sessions, trainers, and nominations.',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    // 1. Fetch Metadata (Lightweight spots for calendar)
    // 2. Fetch TODAY'S Sessions (Detailed cards)
    // 3. Fetch Trainers

    const today = new Date();

    const [calendarMetadata, todayData, trainersData] = await Promise.all([
        getCalendarMetadata(),
        getSessionsForDate(getServerLocalDateString()),
        getTrainers()
    ]);

    return (
        <DashboardClient
            initialMetadata={calendarMetadata}
            initialSessions={todayData.sessions}
            initialTrainers={trainersData}
            initialPendingReviews={todayData.pendingCount}
            currentPage={1}
            totalPages={1}
        />
    );
}