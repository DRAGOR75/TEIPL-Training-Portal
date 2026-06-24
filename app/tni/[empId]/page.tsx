import { getEmployeeProfile, getAvailablePrograms } from '@/app/actions/tni';
import Link from 'next/link';
import TNIProfile from '@/components/TNIProfile';
import TNIDashboardClient from '@/components/TNIDashboardClient';
import { getSystemSetting } from '@/app/actions/settings';
import {
    HiOutlineArrowRightOnRectangle,
    HiOutlineChevronRight,
    HiOutlineClipboardDocumentList,
    HiOutlineClock,
    HiOutlineStar,
    HiOutlineUser,
    HiOutlineMapPin,
    HiOutlineServer,
    HiOutlineFolder,
    HiOutlineCheckCircle
} from 'react-icons/hi2';

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
        projectLocation: '',
        managerName: '',
        managerEmail: '',
        nominations: [],
        trainingHistory: []
    };

    // Fetch Programs (Filtered by Grade & Section)
    const programs = await getAvailablePrograms(
        (currentEmployee.grade as any) || undefined,
        currentEmployee.sectionName || undefined
    );

    const nominations = currentEmployee.nominations || [];

    // Fetch System Setting for Add TNI feature
    const isTniEnabledStr = await getSystemSetting('enable_employee_tni_add', 'true');
    const isAddTNIDisabled = isTniEnabledStr === 'false';

    return (

        <div className="min-h-screen bg-slate-50/50 pb-12 selection:bg-blue-600 selection:text-white">
            {/* Top Navigation Bar */}
            <nav className="glass sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Left Side: Logos */}
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col md:flex-row items-center justify-center -space-y-1 md:space-y-0 md:gap-4">
                                {/* Thriveni Logo */}
                                <div className="relative w-20 h-6 md:w-32 md:h-12">
                                    <img
                                        src="/thriveny_logo.svg"
                                        alt="Thriveni Logo"
                                        className="w-full h-full object-contain filter hover:brightness-110 transition-all duration-300"
                                    />
                                </div>
                                <div className="h-4 md:h-8 w-[1px] bg-slate-200 hidden md:block"></div>
                                {/* Lloyds Logo */}
                                <div className="relative w-20 h-6 md:w-34 md:h-8">
                                    <img
                                        src="/LLoyds_logo.svg"
                                        alt="Lloyds Metals Logo"
                                        className="w-full h-full object-contain filter hover:brightness-110 transition-all duration-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Centered Title */}
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-[120px] md:max-w-none pointer-events-none">
                            <h1 className="text-sm md:text-2xl font-black text-slate-900 tracking-wide leading-tight truncate uppercase">
                                Training Dashboard
                            </h1>
                        </div>

                        {/* Right Side: User Info & Sign Out */}
                        <div className="flex items-center gap-2 md:gap-4 z-10">
                            <div className="text-right hidden sm:block">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</div>
                                <div className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">{currentEmployee.name || empId}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                            <Link
                                href="/tni"
                                className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 px-3 py-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-red-500/10 active:scale-95"
                            >
                                <HiOutlineArrowRightOnRectangle size={18} />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
                {/* 1. Profile Card (Full Width) */}
                <TNIProfile employee={currentEmployee as any} sections={sections} employeeView={true} />

                {/* 2. Dashboard lists & inline nomination form (Full Width) */}
                <TNIDashboardClient
                    nominations={nominations}
                    programs={programs as any}
                    empId={empId}
                    trainingHistory={[...(currentEmployee.trainingHistory || []), ...(currentEmployee.systemTrainingHistory || [])].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())}
                    managerEmail={currentEmployee.managerEmail || undefined}
                    managerName={currentEmployee.managerName || undefined}
                    isAddTNIDisabled={isAddTNIDisabled}
                    sections={sections}
                />
            </div>
        </div>
    );
}
