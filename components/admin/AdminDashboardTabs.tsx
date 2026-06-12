'use client';

import { useState } from 'react';
import {
    HiOutlineBuildingOffice2,
    HiOutlineMapPin,
    HiOutlineBookOpen,
    HiOutlineUsers,
    HiOutlineArrowUpTray,
    HiOutlineCog,
    HiOutlineCalendar
} from 'react-icons/hi2';

interface AdminDashboardTabsProps {
    title?: React.ReactNode;
    reportsLink?: React.ReactNode;
    sectionManager: React.ReactNode;
    locationManager: React.ReactNode;
    programManager: React.ReactNode;
    employeeManager: React.ReactNode;
    bulkUploadManager: React.ReactNode;
    calendarManager?: React.ReactNode;
    systemSettingsManager?: React.ReactNode;
}

export default function AdminDashboardTabs({
    title,
    reportsLink,
    sectionManager,
    locationManager,
    programManager,
    employeeManager,
    bulkUploadManager,
    calendarManager,
    systemSettingsManager
}: AdminDashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'VENUES' | 'PROGRAMS' | 'EMPLOYEES' | 'BULK_UPLOADS' | 'CALENDAR' | 'SETTINGS'>('PROGRAMS');

    const tabs = [
        { id: 'DEPARTMENTS', label: 'Departments', icon: HiOutlineBuildingOffice2 },
        { id: 'VENUES', label: 'Venues', icon: HiOutlineMapPin },
        { id: 'PROGRAMS', label: 'Subjects Menu', icon: HiOutlineBookOpen },
        { id: 'EMPLOYEES', label: 'Employees', icon: HiOutlineUsers },
        { id: 'BULK_UPLOADS', label: 'Bulk Upload', icon: HiOutlineArrowUpTray },
        { id: 'CALENDAR', label: 'Calendar', icon: HiOutlineCalendar },
        { id: 'SETTINGS', label: 'Settings', icon: HiOutlineCog },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
                {/* Title & Actions Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {title && <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>}

                    {reportsLink && (
                        <div className="shrink-0">
                            {reportsLink}
                        </div>
                    )}
                </div>

                {/* The Ribbon Tab Container */}
                <div className="bg-slate-200/50 p-1.5 rounded-2xl inline-flex overflow-x-auto max-w-full shadow-inner border border-slate-200/60">
                    <div className="flex items-center gap-1 min-w-max">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
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
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* The Active Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'DEPARTMENTS' && sectionManager}
                {activeTab === 'VENUES' && locationManager}
                {activeTab === 'PROGRAMS' && programManager}
                {activeTab === 'EMPLOYEES' && employeeManager}
                {activeTab === 'BULK_UPLOADS' && bulkUploadManager}
                {activeTab === 'CALENDAR' && calendarManager}
                {activeTab === 'SETTINGS' && systemSettingsManager}
            </div>
        </div>
    );
}
