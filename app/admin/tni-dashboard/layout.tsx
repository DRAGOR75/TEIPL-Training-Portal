import { Metadata } from 'next';
import Link from 'next/link';
import { HiOutlineChartBarSquare } from 'react-icons/hi2';
import MasterDataRibbon from '@/components/admin/MasterDataRibbon';

export const metadata: Metadata = {
    title: 'TNI Dashboard | Thriveni Training',
};

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-slate-100 py-6 px-2 md:px-4 lg:px-6">
            <div className="w-full mx-auto space-y-8">
                
                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="space-y-4">
                        {/* Title & Actions Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                <span className="uppercase font-black text-slate-900 italic">MASTER <span className="text-amber-600">DATA</span></span>
                            </h1>

                            <div className="shrink-0">
                                <Link
                                    href="/admin/reports"
                                    className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 group"
                                >
                                    <HiOutlineChartBarSquare size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    Reports
                                </Link>
                            </div>
                        </div>

                        {/* The Ribbon Tab Container */}
                        <MasterDataRibbon />
                    </div>

                    {/* The Active Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {children}
                    </div>
                </div>

            </div>
        </main>
    );
}
