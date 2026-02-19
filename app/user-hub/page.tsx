import Link from 'next/link';
import {
    HiOutlineClipboardDocumentList,
    HiOutlineWrench,
    HiOutlineArrowRight,
} from 'react-icons/hi2';

export default function UserHubPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col items-start space-y-2">
                        <Link href="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors mb-2 flex items-center gap-1 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                            Employee <span className="text-orange-600">Portal</span>
                        </h1>
                        <p className="max-w-xl text-lg text-slate-500 font-medium leading-relaxed">
                            Manage your training nominations and access technical troubleshooting guides.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Card 1: TNI Management - Amber */}
                    <UserCard
                        href="/tni"
                        title="TNI Management"
                        description="Identify your training needs, submit nominations, and track your learning journey."
                        icon={<HiOutlineClipboardDocumentList size={32} />}
                        tag="Personal Growth"
                        color="amber"
                    />

                    {/* Card 2: Troubleshooting - Red */}
                    <UserCard
                        href="/troubleshoot"
                        title="Troubleshooting Library"
                        description="Access diagnostic procedures and solutions for machine faults and operational issues."
                        icon={<HiOutlineWrench size={32} />}
                        tag="Support"
                        color="red"
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

function UserCard({ href, title, description, icon, tag, color }: {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tag: string;
    color: 'amber' | 'red';
}) {
    const colorStyles = {
        amber: 'bg-amber-50 border-amber-100 text-amber-600 hover:border-amber-500 hover:shadow-amber-900/5',
        red: 'bg-red-50 border-red-100 text-red-600 hover:border-red-500 hover:shadow-red-900/5',
    };

    return (
        <Link href={href} className={`group ${colorStyles[color]} border rounded-[2.5rem] p-10 transition-all duration-500 hover:shadow-air-lg hover:-translate-y-1 block relative overflow-hidden bg-white`}>
            {/* Themed Background Accent */}
            <div className={`absolute top-0 right-0 w-48 h-48 ${colorStyles[color].split(' ')[0]} rounded-full -mr-24 -mt-24 opacity-40 blur-3xl group-hover:scale-150 transition-transform duration-700`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">
                        {tag}
                    </span>
                </div>

                <div className="space-y-3 mb-10">
                    <h3 className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-current transition-colors">
                        {title}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed text-base">
                        {description}
                    </p>
                </div>

                <div className="mt-auto flex items-center gap-3 font-bold text-sm uppercase tracking-wider group-hover:gap-4 transition-all pt-8 border-t border-slate-100">
                    <span>Open Hub</span>
                    <HiOutlineArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Link>
    );
}
