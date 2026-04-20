'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HiOutlineSquares2X2,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineClipboardDocumentList,
    HiOutlineWrench,
    HiOutlineBookOpen,
    HiOutlineUsers,
    HiOutlinePaperAirplane,
    HiOutlineChevronRight,
    HiOutlineChartBar
} from 'react-icons/hi2';

const ADMIN_TABS = [
    { id: 'hub', label: 'Hub', href: '/admin', icon: HiOutlineSquares2X2 },
    { id: 'feedback', label: 'Feedback', href: '/admin/dashboard', icon: HiOutlineChatBubbleBottomCenterText },
    { id: 'tni', label: 'Master Data', href: '/admin/tni-dashboard', icon: HiOutlineClipboardDocumentList },
    { id: 'troubleshooting', label: 'Diagnostics', href: '/admin/troubleshooting', icon: HiOutlineWrench },
    { id: 'manuals', label: 'Manuals', href: '/training-manuals', icon: HiOutlineBookOpen },
    { id: 'sessions', label: 'Sessions', href: '/admin/sessions', icon: HiOutlineUsers },
    { id: 'reports', label: 'Reports', href: '/admin/reports', icon: HiOutlineChartBar },
    { id: 'email', label: 'Bulk Email', href: '/admin/bulk-email', icon: HiOutlinePaperAirplane },
];

export default function AdminHeader() {
    const pathname = usePathname();

    return (
        <div className="bg-white border-b border-slate-200 sticky top-20 z-40">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                    {/* Admin Branding */}
                    <div className="flex items-center gap-2 pr-4 border-r border-slate-100 hidden md:flex">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                            <HiOutlineSquares2X2 size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-tighter text-slate-900">
                            Admin <span className="text-indigo-600">Panel</span>
                        </span>
                    </div>

                    {/* Tabs */}
                    <nav className="flex items-center gap-1 min-w-max">
                        {ADMIN_TABS.map((tab) => {
                            // Check if active: exact match or subpath (except for hub)
                            const isActive = tab.id === 'hub' 
                                ? pathname === '/admin' 
                                : pathname.startsWith(tab.href);

                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative
                                        ${isActive 
                                            ? 'bg-indigo-50 text-indigo-700' 
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                                    `}
                                >
                                    <tab.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                    {tab.label}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-600 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}
