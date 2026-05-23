'use client';

import { useState } from 'react';
import { 
    HiOutlineBuildingOffice2, 
    HiOutlineMapPin, 
    HiOutlineBookOpen, 
    HiOutlineUsers,
    HiOutlineArrowUpTray
} from 'react-icons/hi2';

interface AdminDashboardTabsProps {
    sectionManager: React.ReactNode;
    locationManager: React.ReactNode;
    programManager: React.ReactNode;
    employeeManager: React.ReactNode;
    bulkUploadManager: React.ReactNode;
}

export default function AdminDashboardTabs({
    sectionManager,
    locationManager,
    programManager,
    employeeManager,
    bulkUploadManager
}: AdminDashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'VENUES' | 'PROGRAMS' | 'EMPLOYEES' | 'BULK_UPLOADS'>('PROGRAMS');

    const tabs = [
        { id: 'DEPARTMENTS', label: 'Departments', icon: HiOutlineBuildingOffice2 },
        { id: 'VENUES', label: 'Venues', icon: HiOutlineMapPin },
        { id: 'PROGRAMS', label: 'Training Programs', icon: HiOutlineBookOpen },
        { id: 'EMPLOYEES', label: 'Employees', icon: HiOutlineUsers },
        { id: 'BULK_UPLOADS', label: 'Bulk Import', icon: HiOutlineArrowUpTray },
    ] as const;

    return (
        <div className="space-y-6">
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
                                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
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

            {/* The Active Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'DEPARTMENTS' && sectionManager}
                {activeTab === 'VENUES' && locationManager}
                {activeTab === 'PROGRAMS' && programManager}
                {activeTab === 'EMPLOYEES' && employeeManager}
                {activeTab === 'BULK_UPLOADS' && bulkUploadManager}
            </div>
        </div>
    );
}
