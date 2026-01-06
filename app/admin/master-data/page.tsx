import { db } from '@/lib/db';
import SectionManager from '@/components/admin/SectionManager';
import ProgramManager from '@/components/admin/ProgramManager';
import EmployeeManager from '@/components/admin/EmployeeManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Master Data Management | Thriveni Training',
};

export const dynamic = 'force-dynamic';

export default async function MasterDataPage() {
    // 1. Fetch Sections
    const sections = await db.section.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { programs: true } }
        }
    });

    // 2. Fetch Programs (w/ Sections)
    const programs = await db.program.findMany({
        orderBy: { name: 'asc' },
        include: { sections: { select: { id: true, name: true } } }
    });

    // 3. Fetch Employees (Limit to latest 100 for performance, they can search/bulk upload)
    const employees = await db.employee.findMany({
        take: 100,
        orderBy: { id: 'desc' }, // Latest first
        select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            sectionName: true
        }
    });

    return (
        <main className="min-h-screen bg-slate-50 py-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Master Data Management</h1>
                    <p className="text-slate-500 mt-2">Manage essential system data: Sections, Programs, and Employee records.</p>
                </div>

                <hr className="border-slate-200" />

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
