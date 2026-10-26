import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getManagersDirectory, getManagerTeamReport } from '@/app/actions/manager-reports';
import ManagerTeamReportView from '@/components/manager/ManagerTeamReportView';

export const metadata: Metadata = {
    title: 'Manager & Team Training Intelligence | Trainer Hub',
    description: 'Inspect reporting hierarchy and monitor team training completion metrics.',
};

export const dynamic = 'force-dynamic';

export default async function TrainerManagerTeamReportPage({
    searchParams
}: {
    searchParams: Promise<{ managerEmail?: string }>;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect('/api/auth/signin');
    }

    const { managerEmail } = await searchParams;

    // Fetch managers directory
    const { managers } = await getManagersDirectory();
    const effectiveManagerEmail = managerEmail || '';

    // Fetch initial report if manager email is provided
    let initialReport = null;
    if (effectiveManagerEmail) {
        const res = await getManagerTeamReport(effectiveManagerEmail);
        initialReport = res.data;
    }

    return (
        <main className="min-h-screen bg-slate-50/70 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <ManagerTeamReportView
                    initialManagers={managers}
                    initialReport={initialReport}
                    initialSelectedManagerEmail={effectiveManagerEmail}
                    backHref="/trainer"
                    backLabel="Back to Trainer Workspace"
                />
            </div>
        </main>
    );
}
