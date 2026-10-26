import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getWorkforceTrainingAnalyticsData } from '@/app/actions/workforce-reports';
import WorkforceTrainingReportView from '@/components/admin/WorkforceTrainingReportView';

export const metadata: Metadata = {
    title: 'Workforce Training & Deficit Analytics | Trainer Portal',
    description: 'Corporate intelligence report analyzing trained vs untrained workforce deficit across sections, department groups, and project sites.',
};

export const dynamic = 'force-dynamic';

export default async function TrainerWorkforceTrainingStatusPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/api/auth/signin');
    }

    const { data, error } = await getWorkforceTrainingAnalyticsData();

    if (error || !data) {
        return (
            <main className="min-h-screen bg-slate-50/70 p-4 md:p-8 flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm text-center max-w-md">
                    <h2 className="text-base font-bold text-rose-700">Analytics Error</h2>
                    <p className="text-xs text-slate-600 mt-2">{error || 'Unable to load workforce training data.'}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/70 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Workforce Training & Deficit Analytics
                    </h1>
                    <p className="text-slate-500 mt-1 text-xs font-medium">
                        Cross-sectional intelligence tracking certified program completion, untrained workforce gaps, and pending training needs.
                    </p>
                </div>

                <WorkforceTrainingReportView
                    initialData={data}
                    backHref="/trainer"
                    backLabel="Back to Trainer Workspace"
                />
            </div>
        </main>
    );
}
