'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    HiOutlineBuildingOffice2,
    HiOutlineMapPin,
    HiOutlineBookOpen,
    HiOutlineUsers,
    HiOutlineArrowUpTray,
    HiOutlineCog,
    HiOutlineCalendar
} from 'react-icons/hi2';

export default function MasterDataRibbon() {
    const pathname = usePathname();
    const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

    // Clear optimistic path once the actual navigation completes
    useEffect(() => {
        setOptimisticPath(null);
    }, [pathname]);

    const tabs = [
        { id: 'DEPARTMENTS', label: 'Sections', href: '/admin/tni-dashboard/departments', icon: HiOutlineBuildingOffice2 },
        { id: 'VENUES', label: 'Venues', href: '/admin/tni-dashboard/venues', icon: HiOutlineMapPin },
        { id: 'PROGRAMS', label: 'Subjects Menu', href: '/admin/tni-dashboard/subjects', icon: HiOutlineBookOpen },
        { id: 'EMPLOYEES', label: 'Employees', href: '/admin/tni-dashboard/employees', icon: HiOutlineUsers },
        { id: 'BULK_UPLOADS', label: 'Bulk Upload', href: '/admin/tni-dashboard/bulk-upload', icon: HiOutlineArrowUpTray },
        { id: 'CALENDAR', label: 'Calendar', href: '/admin/tni-dashboard/calendar', icon: HiOutlineCalendar },
        { id: 'NOMINATIONS', label: 'All TNI', href: '/admin/tni-dashboard/nominations', icon: HiOutlineBookOpen },
        { id: 'SETTINGS', label: 'Settings', href: '/admin/tni-dashboard/settings', icon: HiOutlineCog },
    ] as const;

    const currentPath = optimisticPath || pathname;

    return (
        <div className="bg-slate-200/50 p-1.5 rounded-2xl inline-flex overflow-x-auto max-w-full shadow-inner border border-slate-200/60">
            <div className="flex items-center gap-1 min-w-max">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    // Check if current optimistic or real pathname starts with the tab's href
                    const isActive = currentPath?.startsWith(tab.href);
                    
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            onClick={() => setOptimisticPath(tab.href)}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200
                                ${isActive
                                    ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'
                                }
                            `}
                        >
                            <Icon size={18} className={isActive ? 'stroke-[2.5]' : ''} />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
