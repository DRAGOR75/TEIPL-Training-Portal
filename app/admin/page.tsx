import Link from 'next/link';
import {
    HiOutlineChartBar,
    HiOutlineCog6Tooth,
    HiOutlineCircleStack,
    HiOutlineChevronRight,
    HiOutlineSquares2X2,
    HiOutlineUsers,
    HiOutlineWrench,
    HiOutlineClipboardDocumentList
} from 'react-icons/hi2';

export const dynamic = 'force-dynamic';

export default async function AdminHubPage() {
    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-12">
                <div className="container mx-auto px-6 max-w-7xl">

                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Admin Control Center</h1>

                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Card 1: Feedback Dashboard */}
                    <Link href="/admin/dashboard" className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-blue-500 block">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <HiOutlineChartBar size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analytics</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Feedback Dashboard</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                View training ratings, read employee feedback, and track program effectiveness.
                            </p>
                            <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                Open Dashboard <HiOutlineChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: TNI Master Data */}
                    <Link href="/admin/tni-dashboard" className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-indigo-500 block">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <HiOutlineClipboardDocumentList size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Master Data</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">TNI Management</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Manage training programs, sections/departments, and employee database.
                            </p>
                            <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                Manage Data <HiOutlineChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Card 3: Troubleshooting Admin */}
                    <Link href="/admin/troubleshooting" className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-lloyds-red block">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-lloyds-red/10 text-lloyds-red rounded-lg group-hover:bg-lloyds-red group-hover:text-white transition-colors">
                                    <HiOutlineWrench size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostics</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Troubleshooting</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Configure machines, fault codes, and create step-by-step diagnostic guides.
                            </p>
                            <div className="flex items-center text-lloyds-red font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                Open Config <HiOutlineChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Card 4: Session Management */}
                    <Link href="/admin/sessions" className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-emerald-500 block">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <HiOutlineUsers size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batches</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Training Sessions</h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Schedule trainings, manage batches, and access Enrollment QR codes.
                            </p>
                            <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                Manage Sessions <HiOutlineChevronRight size={16} />
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
