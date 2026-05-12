import { db } from '@/lib/prisma';
import SectionManager from '@/components/admin/SectionManager';
import ProgramManager from '@/components/admin/ProgramManager';
import EmployeeManager from '@/components/admin/EmployeeManager';
import LocationManager from '@/components/admin/LocationManager';
import {
    getCachedAdminSections,
    getCachedAdminPrograms,
    getCachedAdminEmployees,
    getCachedAdminLocations
} from '@/lib/cache-master-data';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TNI Dashboard | Thriveni Training',
};

export const dynamic = 'force-dynamic';

import { auth } from "@/auth"; // Updated: Import auth
import { redirect } from "next/navigation"; // Updated: Import redirect

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

                {/* Header */}
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">TNI Control Panel</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage essential system data: Sections, Programs, and Employee records.</p>
                </div>

                <hr className="border-slate-800" />

                {/* 1. SECTIONS */}
                <SectionManager sections={sections} />

                {/* 2. PROGRAMS */}
                <ProgramManager programs={programs} allSections={sections} />

                {/* 3. EMPLOYEES */}
                <EmployeeManager employees={employees as any} />

                {/* 4. LOCATIONS */}
                <LocationManager locations={locations} />

            </div>
        </main>
    );
}
