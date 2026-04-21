import { getTniReportData } from '@/app/actions/reports';
import ReportsDashboard from '@/components/admin/ReportsDashboard';
import { Metadata } from 'next';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: 'Training Analytics | Trainer Hub',
    description: 'Demand analysis for training program planning.',
};

export const dynamic = 'force-dynamic';

export default async function TrainerReportsPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const reportData = await getTniReportData();

    return (
        <main className="min-h-screen bg-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Organization Demand</h1>
                    <p className="text-slate-500 mt-2 font-medium">Use these metrics to plan your upcoming training sessions based on real organizational needs.</p>
                </div>

                <ReportsDashboard data={reportData} />
            </div>
        </main>
    );
}
