import { db } from '@/lib/prisma';
import SectionManager from '@/components/admin/SectionManager';
import ProgramManager from '@/components/admin/ProgramManager';
import EmployeeManager from '@/components/admin/EmployeeManager';
import LocationManager from '@/components/admin/LocationManager';
import AdminDashboardTabs from '@/components/admin/AdminDashboardTabs';
import BulkUploadManager from '@/components/admin/BulkUploadManager';
import SystemSettingsManager from '@/components/admin/SystemSettingsManager';
import TrainingCalendarManager from '@/components/admin/TrainingCalendarManager';
import { getSystemSetting } from '@/app/actions/settings';
import { getCalendarEvents } from '@/app/actions/calendar';
import { getTrainers } from '@/app/actions/trainers';
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
    const [sections, programs, employees, locations, isTniEnabledStr, calendarEvents, trainers, allSessions] = await Promise.all([
        getCachedAdminSections(),
        getCachedAdminPrograms(),
        getCachedAdminEmployees(),
        getCachedAdminLocations(),
        getSystemSetting('enable_employee_tni_add', 'true'),
        getCalendarEvents(false),
        getTrainers(),
        db.trainingSession.findMany({ select: { id: true, programName: true, trainerName: true, location: true, startDate: true, endDate: true, enrollments: { select: { id: true } } } })
    ]);

    const isTniEnabled = isTniEnabledStr === 'true';

    return (
        <main className="min-h-screen bg-slate-100 py-6 px-2 md:px-4 lg:px-6">
            <div className="w-full mx-auto space-y-8">

                <AdminDashboardTabs
                    title={<span className="uppercase font-black text-slate-900 italic">MASTER <span className="text-amber-600">DATA</span></span>}
                    reportsLink={
                        <Link
                            href="/admin/reports"
                            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 group"
                        >
                            <HiOutlineChartBarSquare size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                            Reports
                        </Link>
                    }
                    sectionManager={<SectionManager sections={sections} />}
                    locationManager={<LocationManager locations={locations} />}
                    programManager={<ProgramManager programs={programs} allSections={sections} />}
                    employeeManager={<EmployeeManager employees={employees as any} />}
                    bulkUploadManager={<BulkUploadManager />}
                    calendarManager={<TrainingCalendarManager programs={programs} trainers={trainers} allSessions={allSessions} locations={locations} />}
                    systemSettingsManager={<SystemSettingsManager initialTniEnabled={isTniEnabled} />}
                />

            </div>
        </main>
    );
}
