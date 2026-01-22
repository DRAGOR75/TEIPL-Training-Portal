import { getEmployeeProfile, getAvailablePrograms } from '@/app/actions/tni';
import Link from 'next/link';
import TNIProfile from '@/components/TNIProfile';
import TNIDashboardClient from '@/components/TNIDashboardClient';
import { LogOut, ChevronRight, History, Clipboard } from 'lucide-react';

export default async function TNIDashboardPage({ params }: { params: Promise<{ empId: string }> }) {
    const { empId } = await params;
    const { employee, sections } = await getEmployeeProfile(empId);

    const currentEmployee = employee || {
        id: empId,
        name: '',
        email: '',
        grade: '',
        sectionName: '',
        location: '',
        managerName: '',
        managerEmail: '',
        nominations: []
    };

    // Fetch Programs (Filtered by Grade & Section)
    const programs = await getAvailablePrograms(
        (currentEmployee.grade as any) || undefined,
        currentEmployee.sectionName || undefined
    );

    const nominations = currentEmployee.nominations || [];

    return (

        <div className="min-h-screen bg-slate-100 pb-12 pt-6">
            {/* Top Navigation Bar */}
            <div className="bg-white rounded-full z-20 shadow-sm  lg:mx-auto max-w-6xl">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-slate-900 p-1.5 rounded-lg">
                                <Clipboard className="text-white" size={20} />
                            </div>
                            <div className="flex items-center gap-2 text-lg font-medium text-slate-600">
                                <span className="hover:text-slate-900 transition-colors cursor-default">Nominations</span>
                                <ChevronRight size={14} className="text-slate-400" />
                                <span className="text-lg text-slate-900 tracking-wide font-bold  px-2 py-0.5 rounded-md">TNI Dashboard</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Logged in as</div>
                                <div className="text-sm font-bold text-slate-900">{currentEmployee.name || empId}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                            <Link
                                href="/tni"
                                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
                            >
                                <LogOut size={18} />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">



                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Profile (4 columns on large screens) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-24">
                            <TNIProfile employee={currentEmployee} sections={sections} />
                        </div>
                    </div>

                    {/* Right Column: Nomination Form (8 columns) */}
                    <div className="lg:col-span-8 space-y-8">
                        <TNIDashboardClient
                            nominations={nominations}
                            programs={programs as any}
                            empId={empId}
                        />
                    </div>
                </div>

                {/* Bottom Section: Training History (Full Width) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <History size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Training History</h2>
                                <p className="text-xs text-slate-500 font-medium">Record of past training sessions</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full aspect-[4/3] lg:aspect-[16/9] bg-slate-50">
                        <iframe
                            src="https://lookerstudio.google.com/embed/reporting/dbba1f2c-4ff6-4bda-b1ab-f7f96f0a9f90/page/zpm1D"
                            className="absolute inset-0 w-full h-full"
                            style={{ border: 0 }}
                            allowFullScreen
                            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        ></iframe>
                    </div>
                    <div className="p-3 bg-red-50 text-center border-t border-red-100">
                        <p className="text-xs text-red-600 font-bold flex items-center justify-center gap-1.5">
                            <ChevronRight size={12} />
                            <span>Tip: Select your name in the report dropdown to filter your records.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
