import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getEmployeeProfile, getAvailablePrograms } from '@/app/actions/tni';
import TNIProfile from '@/components/TNIProfile';
import TNIDashboardClient from '@/components/TNIDashboardClient';
import { db } from '@/lib/prisma';
import EmployeeSearch from './EmployeeSearch';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Trainer Employee TNI | Thriveni Training',
};

export default async function TrainerEmployeeTNIPage({ searchParams }: { searchParams: Promise<{ empId?: string }> }) {
    const session = await auth();
    if (!session || !['ADMIN', 'TRAINER'].includes(session.user?.role || '')) {
        redirect('/api/auth/signin');
    }

    const { empId } = await searchParams;

    // Fetch all employees for the searchable select
    const allEmployees = await db.employee.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true
        },
        orderBy: { name: 'asc' }
    });

    let currentEmployee: any = null;
    let programs: any = [];
    let sections: any = [];
    let nominations: any = [];

    if (empId) {
        const profileData = await getEmployeeProfile(empId);

        currentEmployee = profileData.employee || {
            id: empId,
            name: '',
            email: '',
            grade: '',
            sectionName: '',
            location: '',
            mobile: '',
            designation: '',
            yearsOfExperience: '',
            projectLocation: '',
            managerName: '',
            managerEmail: '',
            nominations: [],
            trainingHistory: []
        };

        sections = profileData.sections || [];

        // Fetch Programs (Filtered by Grade & Section)
        programs = await getAvailablePrograms(
            (currentEmployee.grade as any) || undefined,
            currentEmployee.sectionName || undefined
        );

        nominations = currentEmployee.nominations || [];
    }

    return (
        <main className="min-h-screen bg-slate-100 py-10 px-4 md:px-8 selection:bg-blue-600 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-8">


                {/* Employee Search Form */}
                <EmployeeSearch employees={allEmployees} />

                {/* Dashboard Area */}
                {empId ? (
                    <div className="space-y-8">
                        {/* 1. Profile Card (Full Width) */}
                        <TNIProfile key={`profile-${currentEmployee?.id}`} employee={currentEmployee as any} sections={sections} />

                        {/* 2. Dashboard lists & inline nomination form (Full Width) */}
                        {currentEmployee?.name ? (
                            <TNIDashboardClient
                                key={`dashboard-${currentEmployee?.id}`}
                                nominations={nominations}
                                programs={programs as any}
                                empId={empId}
                                trainingHistory={currentEmployee?.trainingHistory || []}
                                managerEmail={currentEmployee?.managerEmail || undefined}
                                managerName={currentEmployee?.managerName || undefined}
                            />
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-amber-800 text-center">
                                <h3 className="font-bold text-lg mb-2">New Employee</h3>
                                <p className="text-sm">Please fill out and save the profile details above before managing training needs.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-slate-400 text-3xl font-black">?</span>
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">No Employee Selected</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Use the search bar above to find an existing employee by ID, or type a new ID and click "Add New Employee" to create one.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
