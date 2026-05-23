import { db } from '@/lib/prisma';
import SectionManager from '@/components/admin/SectionManager';
import ProgramManager from '@/components/admin/ProgramManager';
import EmployeeManager from '@/components/admin/EmployeeManager';
import LocationManager from '@/components/admin/LocationManager';
import AdminDashboardTabs from '@/components/admin/AdminDashboardTabs';
import BulkUploadManager from '@/components/admin/BulkUploadManager';
import {
    getCachedAdminSections,
    getCachedAdminPrograms,
    getCachedAdminEmployees,
    getCachedAdminLocations
} from '@/lib/cache-master-data';
import { Metadata } from 'next';
import Link from 'next/link';
import { HiOutlineChartBarSquare } from 'react-icons/hi2';
import { auth } from "@/auth"; // Updated: Import auth
import { redirect } from "next/navigation"; // Updated: Import redirect

export const metadata: Metadata = {
    title: 'TNI Dashboard | Thriveni Training',
};

export const dynamic = 'force-dynamic';

export default async function MasterDataPage() {
    const session = await auth(); // Updated: Get session
    if (!session) {
        redirect("/api/auth/signin"); // Updated: Redirect if not logged in
    }

    // Parallel Fetching for Performance using cached wrappers
    const [sections, programs, employees, locations] = await Promise.all([
        getCachedAdminSections(),
        getCachedAdminPrograms(),
        getCachedAdminEmployees(),
        getCachedAdminLocations()
    ]);

    return (
        <main className="min-h-screen bg-slate-100 py-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">TNI Control Panel</h1>

                    </div>

                    <div className="shrink-0">
                        <Link
                            href="/admin/reports"
                            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 group"
                        >
                            <HiOutlineChartBarSquare size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                            View TNI Reports
                        </Link>
                    </div>
                </div>

                {/* Master Ribbon Tabs */}
                <AdminDashboardTabs
                    sectionManager={<SectionManager sections={sections} />}
                    locationManager={<LocationManager locations={locations} />}
                    programManager={<ProgramManager programs={programs as any} allSections={sections} />}
                    employeeManager={<EmployeeManager employees={employees as any} />}
                    bulkUploadManager={<BulkUploadManager />}
                />

            </div>
        </main>
    );
}
