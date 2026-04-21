import { getTniReportData } from '@/app/actions/reports';
import ReportsDashboard from '@/components/admin/ReportsDashboard';
import { Metadata } from 'next';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: 'TNI Analytics & Reports | Thriveni Training',
    description: 'Executive dashboard for training needs identification and resource planning.',
};

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
        redirect("/api/auth/signin");
    }

    const reportData = await getTniReportData();

    return (
        <main className="min-h-screen bg-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">TNI Analytics</h1>
                    <p className="text-slate-500 mt-2 font-medium">Strategic overview of organizational training demand and fulfillment.</p>
                </div>

                <ReportsDashboard data={reportData} />
            </div>
        </main>
    );
}
