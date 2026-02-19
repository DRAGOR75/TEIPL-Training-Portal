import Link from 'next/link';
import {
    HiOutlineChartBar,
    HiOutlineCog6Tooth,
    HiOutlineCircleStack,
    HiOutlineChevronRight,
    HiOutlineSquares2X2,
    HiOutlineUsers,
    HiOutlineWrench,
    HiOutlineClipboardDocumentList,
    HiOutlinePaperAirplane,
    HiOutlineAcademicCap,
    HiOutlineArrowRight,
    HiOutlineChatBubbleBottomCenterText,
} from 'react-icons/hi2';
import { SiLooker } from 'react-icons/si';

export const dynamic = 'force-dynamic';

export default async function AdminHubPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col items-start space-y-2">
                        <Link href="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-2 flex items-center gap-1 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                            Admin <span className="text-indigo-600">Panel</span>
                        </h1>
                        <p className="max-w-xl text-lg text-slate-500 font-medium leading-relaxed">
                            Manage your workspace, training programs, and monitor system performance.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

                    {/* Card 1: Training Feedback */}
                    <AdminCard
                        href="/admin/dashboard"
                        title="Training Feedback"
                        description="View training ratings, read employee feedback, and track program effectiveness."
                        icon={<HiOutlineChatBubbleBottomCenterText size={24} />}
                        tag="Analytics"
                        color="blue"
                    />

                    {/* Card 2: TNI Management */}
                    <AdminCard
                        href="/admin/tni-dashboard"
                        title="TNI Control Panel"
                        description="Manage training programs, sections/departments, and employee database."
                        icon={<HiOutlineClipboardDocumentList size={24} />}
                        tag="Master Data"
                        color="amber"
                    />

                    {/* Card 3: Troubleshooting Library */}
                    <AdminCard
                        href="/admin/troubleshooting"
                        title="Troubleshooting Control Panel"
                        description="Configure machines, fault codes, and create step-by-step diagnostic guides."
                        icon={<HiOutlineWrench size={24} />}
                        tag="Diagnostics"
                        color="red"
                    />

                    {/* Card 4: Training Sessions */}
                    <AdminCard
                        href="/admin/sessions"
                        title="Training Sessions"
                        description="Schedule trainings, manage batches, and access Enrollment QR codes."
                        icon={<HiOutlineUsers size={24} />}
                        tag="Batches"
                        color="emerald"
                    />

                    {/* Card 5: Training Cohorts - Indigo */}
                    <AdminCard
                        href="/admin/cohorts"
                        title="Cohort Control Panel"
                        description="Create structured multi-program learning paths for specialized employee groups."
                        icon={<HiOutlineAcademicCap size={24} />}
                        tag="Development"
                        color="indigo"
                    />

                    {/* Card 6: Bulk Email - Purple */}
                    <AdminCard
                        href="/admin/bulk-email"
                        title="Bulk Emails"
                        description="Import recipient lists to send bulk login credentials and system notifications."
                        icon={<HiOutlinePaperAirplane size={28} className="-rotate-45" />}
                        tag="Email"
                        color="purple"
                    />

                    {/* Card 7: Looker Reports */}
                    <AdminCard
                        href="https://lookerstudio.google.com/reporting/de8484cd-fb51-4155-b9d5-1130c3365c4f/page/p_px2aw4z0yd"
                        title="Looker Reports"
                        description="Deep-dive analytics and program performance benchmarks."
                        icon={<SiLooker size={24} />}
                        tag="Analytics"
                        color="sky"
                        isExternal
                    />

                </div>

                <div className="mt-20 text-center">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.25em]">
                        Thriveni Earthmovers &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}

function AdminCard({ href, title, description, icon, tag, color, isExternal }: {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tag: string;
    color: 'blue' | 'indigo' | 'red' | 'emerald' | 'amber' | 'purple' | 'sky';
    isExternal?: boolean;
}) {
    const colorStyles = {
        blue: 'bg-blue-50 border-blue-100 text-blue-600 hover:border-blue-500 hover:shadow-blue-900/5',
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:border-indigo-500 hover:shadow-indigo-900/5',
        red: 'bg-red-50 border-red-100 text-red-600 hover:border-red-500 hover:shadow-red-900/5',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-500 hover:shadow-emerald-900/5',
        amber: 'bg-amber-50 border-amber-100 text-amber-600 hover:border-amber-500 hover:shadow-amber-900/5',
        purple: 'bg-purple-50 border-purple-100 text-purple-600 hover:border-purple-500 hover:shadow-purple-900/5',
        sky: 'bg-sky-50 border-sky-100 text-sky-600 hover:border-sky-500 hover:shadow-sky-900/5',
    };

    const linkProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};

    return (
        <Link href={href} {...linkProps} className={`group ${colorStyles[color]} border rounded-[2rem] p-8 transition-all duration-500 hover:shadow-air-lg hover:-translate-y-1 block relative overflow-hidden bg-white`}>
            {/* Themed Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${colorStyles[color].split(' ')[0]} rounded-full -mr-16 -mt-16 opacity-40 blur-2xl group-hover:scale-150 transition-transform duration-700`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {tag}
                    </span>
                </div>

                <div className="space-y-2 mb-8">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-current transition-colors">
                        {title}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed text-sm">
                        {description}
                    </p>
                </div>

                <div className="mt-auto flex items-center gap-2 font-bold text-xs uppercase tracking-wider group-hover:gap-3 transition-all pt-6 border-t border-slate-100">
                    <span>{isExternal ? 'Open Link' : 'Manage Section'}</span>
                    <HiOutlineArrowRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}
