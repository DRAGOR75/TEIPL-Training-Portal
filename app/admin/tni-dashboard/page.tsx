import { db } from '@/lib/prisma';
import SectionManager from '@/components/admin/SectionManager';
import ProgramManager from '@/components/admin/ProgramManager';
import EmployeeManager from '@/components/admin/EmployeeManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TNI Dashboard | Thriveni Training',
};

export const dynamic = 'force-dynamic';

export default async function MasterDataPage() {
    // Parallel Fetching for Performance
    const [sections, programs, employees] = await Promise.all([
        // 1. Fetch Sections
        db.section.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { programs: true } }
            }
        }),
        // 2. Fetch Programs (w/ Sections)
        db.program.findMany({
            orderBy: { name: 'asc' },
            include: { sections: { select: { id: true, name: true } } }
        }),
        // 3. Fetch Employees (Limit to latest 100)
        db.employee.findMany({
            take: 100,
            orderBy: { id: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                grade: true,
                sectionName: true
            }
        })
    ]);

    return (
        <main className="min-h-screen bg-slate-950 py-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-white">TNI Dashboard</h1>
                    <p className="text-slate-400 mt-2">Manage essential system data: Sections, Programs, and Employee records.</p>
                </div>

                <hr className="border-slate-800" />

                {/* 1. SECTIONS */}
                <SectionManager sections={sections} />

                {/* 2. PROGRAMS */}
                <ProgramManager programs={programs} allSections={sections} />

                {/* 3. EMPLOYEES */}
                <EmployeeManager employees={employees as any} />

            </div>
        </main>
    );
}
