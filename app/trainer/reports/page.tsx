import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { getTrainerReportData } from '@/app/actions/trainer-reports';
import TrainerReportView from '@/components/trainer/TrainerReportView';

export const metadata: Metadata = {
    title: 'Trainer Impact & Performance Report | Trainer Hub',
    description: 'Personalized training completion metrics and first-time attendee conversion.',
};

export const dynamic = 'force-dynamic';

export default async function TrainerReportsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/api/auth/signin');
    }

    const userRole = (session.user as any)?.role;
    const canSwitchTrainer = userRole === 'ADMIN';

    // Fetch report (for TRAINER role, server action enforces their own identity)
    const { report, availableTrainers, availableYears, error } = await getTrainerReportData();

    if (error || !report) {
        return (
            <main className="min-h-screen bg-slate-50 p-6 md:p-12">
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
                    <h2 className="text-2xl font-black text-slate-900">Trainer Profile Not Found</h2>
                    <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                        {error || "We couldn't find an assigned trainer profile associated with your login email."}
                    </p>
                    <Link
                        href="/trainer"
                        className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        Back to Trainer Workspace
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/70 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Back to Hub navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/trainer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Workspace
                    </Link>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Personal Performance Record
                    </span>
                </div>

                <TrainerReportView
                    initialReport={report}
                    availableTrainers={availableTrainers}
                    availableYears={availableYears || []}
                    canSwitchTrainer={canSwitchTrainer}
                    currentUserName={session.user.name || undefined}
                />
            </div>
        </main>
    );
}
