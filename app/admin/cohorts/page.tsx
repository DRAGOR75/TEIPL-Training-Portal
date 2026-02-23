import { getCohorts, getProgramsForCohort } from '@/app/actions/cohorts';
import CohortsDashboard from './CohortsDashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CohortsPage() {
    let cohorts: any[] = [];
    let programs: any[] = [];
    let dbError = false;

    try {
        [cohorts, programs] = await Promise.all([
            getCohorts(),
            getProgramsForCohort(),
        ]);
    } catch (error) {
        console.error('Cohorts page: DB error (migration may be needed):', error);
        dbError = true;
    }

    if (dbError) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-12 max-w-md text-center shadow-sm">
                    <div className="text-5xl mb-4">🗄️</div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Database Migration Needed</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        The cohort tables don&apos;t exist yet. Run the migration to set them up:
                    </p>
                    <code className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-mono block mb-6">
                        npx prisma migrate dev --name add_cohort_system
                    </code>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm font-bold">
                        ← Back to Admin Hub
                    </Link>
                </div>
            </div>
        );
    }

    return <CohortsDashboard initialCohorts={cohorts} programs={programs} />;
}

