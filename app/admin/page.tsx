import Link from 'next/link';
import {
    BarChart3,
    Settings,
    Database,
    ChevronRight,
    LayoutDashboard,
    Users,
    Wrench
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminHubPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-slate-900 pb-32">
                <div className="container mx-auto px-6 pt-12 pb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
                    <p className="text-slate-400">Manage training programs, analyze feedback, and configure diagnostics.</p>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Card 1: Feedback Dashboard */}
                    <Link href="/admin/dashboard" className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-blue-500 block">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <BarChart3 size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analytics</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Feedback Dashboard</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                View training ratings, read employee feedback, and track program effectiveness.
                            </p>
                            <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                Open Dashboard <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: TNI Master Data */}
                    <Link href="/admin/tni-dashboard" className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-indigo-500 block">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Database size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Master Data</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">TNI Management</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Manage training programs, sections/departments, and employee database.
                            </p>
                            <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                Manage Data <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Troubleshooting Admin */}
                    <Link href="/admin/troubleshooting" className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-orange-500 block">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <Wrench size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostics</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Troubleshooting</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Configure machines, fault codes, and create step-by-step diagnostic guides.
                            </p>
                            <div className="flex items-center text-orange-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                Open Config <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                </div>

                <div className="mt-12 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Nominations Management System
                </div>
            </div>
        </div>
    );
}
