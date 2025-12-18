import { getDashboardData } from '@/app/actions';
import { getTrainers } from '@/app/actions/trainers';
import DashboardClient from './DashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Thriveni Training',
    description: 'Manage training sessions, trainers, and nominations.',
};

export default async function AdminDashboardPage() {
    // Fetch data on the server
    // This runs on the server, so it's fast and has direct DB access
    const [dashboardData, trainersData] = await Promise.all([
        getDashboardData(),
        getTrainers()
    ]);

    return (
        <DashboardClient
            initialSessions={dashboardData.sessions}
            initialTrainers={trainersData}
            initialPendingReviews={dashboardData.pendingCount}
        />
    );
}