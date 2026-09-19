import TroubleshootingAnalytics from '@/components/admin/troubleshooting/TroubleshootingAnalytics';
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

export const dynamic = 'force-dynamic';

export default function TroubleshootAnalyticsPage() {
    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/troubleshooting"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
                    >
                        <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                        Back to Troubleshooting Admin
                    </Link>
                    <h1 className="text-2xl uppercase italic md:text-3xl font-black text-slate-900 tracking-tight">
                        HEMM Troubleshooting <span className="text-red-500">Analytics</span>
                    </h1>
                </div>
            </div>

            <TroubleshootingAnalytics />
        </div>
    );
}
