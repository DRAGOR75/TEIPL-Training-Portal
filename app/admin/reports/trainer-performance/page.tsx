import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { getAdminTrainersLeaderboard, getTrainerReportData } from '@/app/actions/trainer-reports';
import AdminTrainerPerformanceClient from '@/components/admin/AdminTrainerPerformanceClient';

export const metadata: Metadata = {
    title: 'Trainer Performance & Impact Analytics | Admin Portal',
    description: 'Executive company-wide trainer output, completed sessions, and first-time trainee induction.',
};

export const dynamic = 'force-dynamic';

export default async function AdminTrainerPerformancePage() {
    const session = await auth();
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
        redirect('/api/auth/signin');
    }

    const [leaderboardRes, trainerReportRes] = await Promise.all([
        getAdminTrainersLeaderboard(),
        getTrainerReportData('ALL')
    ]);

    if (!leaderboardRes.globalSummary || !trainerReportRes.report) {
        return (
            <main className="min-h-screen bg-slate-100 p-8">
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl text-center">
                    <h2 className="text-xl font-black text-slate-900">Failed to load Trainer Performance data</h2>
                    <p className="text-sm text-slate-500 mt-2">Please try refreshing or contact system administrator.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/70 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/admin/reports"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Admin Reports
                    </Link>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Executive L&D Intelligence
                    </span>
                </div>

                <div className="mb-2">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        Trainer Impact & Workforce Conversion
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Cross-trainer performance metrics, training delivery volume, and baseline untrained workforce induction.
                    </p>
                </div>

                <AdminTrainerPerformanceClient
                    leaderboard={leaderboardRes.leaderboard}
                    globalSummary={leaderboardRes.globalSummary}
                    initialReport={trainerReportRes.report}
                    availableTrainers={trainerReportRes.availableTrainers || []}
                    availableYears={leaderboardRes.availableYears || trainerReportRes.availableYears || []}
                />
            </div>
        </main>
    );
}
