import { getUntrainedPendingTrainees } from '@/app/actions/reports';
import UntrainedPendingReport from '@/components/admin/UntrainedPendingReport';
import { Metadata } from 'next';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

export const metadata: Metadata = {
    title: 'Untrained Pending Report | Thriveni Training',
};

export const dynamic = 'force-dynamic';

export default async function UntrainedPendingPage() {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
        redirect("/api/auth/signin");
    }

    const employees = await getUntrainedPendingTrainees();

    return (
        <main className="min-h-screen bg-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                <div className="flex items-center gap-4">
                    <Link href="/admin/reports" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <HiOutlineArrowLeft size={20} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Untrained Pending Report</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Focus list for trainees requiring immediate scheduling priority.</p>
                    </div>
                </div>

                <UntrainedPendingReport employees={employees as any} />

            </div>
        </main>
    );
}
