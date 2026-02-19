import Link from 'next/link';
import {
    HiOutlineUsers,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineArrowRight,
} from 'react-icons/hi2';
import { SiLooker } from 'react-icons/si';

export default function TrainerHubPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-12">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col items-start space-y-2">
                        <Link href="/" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors mb-2 flex items-center gap-1 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
                            Trainer <span className="text-emerald-600">Workspace</span>
                        </h1>
                        <p className="max-w-xl text-lg text-slate-500 font-medium leading-relaxed">
                            Access your training sessions, monitor feedback, and track program performance.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

                    {/* Card 1: Training Sessions - Emerald */}
                    <TrainerCard
                        href="/admin/sessions"
                        title="Training Sessions"
                        description="Schedule workshops, manage participant batches, and generate enrollment QR codes."
                        icon={<HiOutlineUsers size={28} />}
                        tag="Operations"
                        color="emerald"
                    />

                    {/* Card 2: Training Feedback - Blue */}
                    <TrainerCard
                        href="/admin/dashboard"
                        title="Training Feedback"
                        description="Review employee feedback and training ratings to improve program delivery."
                        icon={<HiOutlineChatBubbleBottomCenterText size={28} />}
                        tag="Analytics"
                        color="blue"
                    />

                    {/* Card 3: Looker Studio - Sky (External) */}
                    <TrainerCard
                        href="https://lookerstudio.google.com/reporting/de8484cd-fb51-4155-b9d5-1130c3365c4f/page/p_px2aw4z0yd"
                        title="Looker Reports"
                        description="Visualize training metrics and performance benchmarks through deep-dive dashboards."
                        icon={<SiLooker size={28} />}
                        tag="Reporting"
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

function TrainerCard({ href, title, description, icon, tag, color, isExternal }: {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tag: string;
    color: 'emerald' | 'blue' | 'sky';
    isExternal?: boolean;
}) {
    const colorStyles = {
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-500 hover:shadow-emerald-900/5',
        blue: 'bg-blue-50 border-blue-100 text-blue-600 hover:border-blue-500 hover:shadow-blue-900/5',
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
