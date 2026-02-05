import { getEmployeeProfile, getAvailablePrograms } from '@/app/actions/tni';
import Link from 'next/link';
import TNIProfile from '@/components/TNIProfile';
import TNIDashboardClient from '@/components/TNIDashboardClient';
import { HiOutlineArrowRightOnRectangle, HiOutlineChevronRight, HiOutlineClipboardDocumentList, HiOutlineClock } from 'react-icons/hi2';

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
        mobile: '',
        designation: '',
        yearsOfExperience: '',
        subDepartment: '',
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

        <div className="min-h-screen bg-slate-100 pb-12">
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-md border-b border-slate-200 sticky top-0 z-50">
                <div className="w-full px-2 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Left Side: Logos */}
                        <div className="flex items-center gap-2">

                            <div className="flex flex-col md:flex-row items-center justify-center -space-y-1 md:space-y-0 md:gap-4">
                                {/* Thriveni Logo */}
                                <div className="relative w-20 h-6 md:w-32 md:h-16">
                                    <img
                                        src="/thriveny_logo.svg"
                                        alt="Thriveni Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="h-4 md:h-8 w-[1px] bg-slate-300 hidden md:block"></div>
                                {/* Lloyds Logo */}
                                <div className="relative w-20 h-6 md:w-34 md:h-10">
                                    <img
                                        src="/LLoyds_logo.svg"
                                        alt="Lloyds Metals Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Centered Title */}
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-[120px] md:max-w-none pointer-events-none">
                            <h1 className="text-sm md:text-2xl font-black text-slate-900 tracking-wide leading-tight truncate">
                                TNI Dashboard
                            </h1>
                        </div>

                        {/* Right Side: User Info & Sign Out */}
                        <div className="flex items-center gap-2 md:gap-4 z-10">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Logged in as</div>
                                <div className="text-sm font-bold text-slate-900">{currentEmployee.name || empId}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                            <Link
                                href="/tni"
                                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 p-2 md:px-3 md:py-2 rounded-lg transition-all"
                            >
                                <HiOutlineArrowRightOnRectangle size={20} />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 space-y-4 md:space-y-8">



                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">

                    {/* Left Column: Profile (4 columns on large screens) */}
                    <div className="lg:col-span-4 space-y-4 md:space-y-8">
                        <div className="static md:sticky md:top-24">
                            <TNIProfile employee={currentEmployee as any} sections={sections} />
                        </div>
                    </div>

                    {/* Right Column: Nomination Form (8 columns) */}
                    <div className="lg:col-span-8 space-y-4 md:space-y-8">
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
                                <HiOutlineClock size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Training History</h2>
                                <p className="text-xs text-slate-500 font-medium">Record of past training sessions</p>
                            </div>
                        </div>
                    </div>

                    {/* P0 Mitigation: Privacy Warning Case T09 */}
                    <div className="p-4 bg-amber-50 border-b border-amber-200">
                        <p className="text-sm text-amber-800 flex items-start gap-3">
                            <span className="flex-shrink-0 mt-0.5">⚠️</span>
                            <span><strong>Privacy Note:</strong> This report view is currently shared across all users. Secure, personalized filtering is in progress. For now, please use the dropdown filter within the report to find your own records only.</span>
                        </p>
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
                            <HiOutlineChevronRight size={12} />
                            <span>Tip: Select your name in the report dropdown to filter your records.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
