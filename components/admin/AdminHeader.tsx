'use client';

import { useState, useEffect } from 'react';
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
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineChevronLeft,

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
    const [isExpanded, setIsExpanded] = useState(true);

    // Optionally auto-collapse on smaller screens or remember user preference
    useEffect(() => {
        const savedState = localStorage.getItem('adminPanelExpanded');
        if (savedState !== null) {
            setIsExpanded(savedState === 'true');
        }
    }, []);

    const toggleExpanded = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('adminPanelExpanded', String(newState));
    };

    return (
        <div className="bg-white border-b border-slate-200 sticky top-20 z-40 transition-all duration-300">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-4 py-2">
                    {/* Admin Branding / Toggle Button */}
                    <button
                        onClick={toggleExpanded}
                        className="flex items-center gap-3 pr-4 border-r border-slate-100 hover:bg-slate-50 p-1.5 rounded-xl transition-colors select-none"
                        title={isExpanded ? "Collapse Admin Panel" : "Expand Admin Panel"}
                    >
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <HiOutlineSquares2X2 size={18} />
                        </div>
                        <div className="flex items-center gap-2 hidden md:flex">
                            <span className="text-xs font-black uppercase tracking-tighter text-slate-900">
                                Admin <span className="text-indigo-600">Panel</span>
                            </span>
                            {isExpanded ? (
                                <HiOutlineChevronLeft size={14} className="text-slate-400" />
                            ) : (
                                <HiOutlineChevronRight size={14} className="text-slate-400" />
                            )}
                        </div>
                    </button>

                    {/* Tabs */}
                    {isExpanded && (
                        <div className="flex-1 overflow-x-auto no-scrollbar">
                            <nav className="flex items-center gap-1 min-w-max animate-in fade-in slide-in-from-left-4 duration-300">
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
                    )}
                </div>
            </div>
        </div>
    );
}
