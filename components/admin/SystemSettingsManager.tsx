'use client';

import { useState, useTransition } from 'react';
import { updateSystemSetting } from '@/app/actions/settings';
import { HiOutlineCog, HiOutlineCheck } from 'react-icons/hi2';

type SystemSettingsManagerProps = {
    initialTniEnabled: boolean;
};

export default function SystemSettingsManager({ initialTniEnabled }: SystemSettingsManagerProps) {
    const [tniEnabled, setTniEnabled] = useState(initialTniEnabled);
    const [isPending, startTransition] = useTransition();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const handleToggle = () => {
        const newValue = !tniEnabled;
        setTniEnabled(newValue);
        setSaveStatus('saving');
        
        startTransition(async () => {
            const res = await updateSystemSetting('enable_employee_tni_add', newValue.toString());
            if (res.success) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                // Revert on failure
                setTniEnabled(!newValue);
                setSaveStatus('idle');
                alert(res.error || 'Failed to update setting');
            }
        });
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <HiOutlineCog size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">System Settings</h2>
                        <p className="text-sm font-medium text-slate-500">Global configurations for the platform</p>
                    </div>
                </div>
                {saveStatus === 'saved' && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-in fade-in duration-300">
                        <HiOutlineCheck size={14} /> Saved
                    </span>
                )}
                {saveStatus === 'saving' && (
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                        <div className="w-3 h-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></div>
                        Saving...
                    </span>
                )}
            </div>
            
            <div className="p-6">
                <div className="flex items-center justify-between max-w-3xl border border-slate-200 p-5 rounded-2xl bg-white shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">Enable Employee Self-Service TNI</h3>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Allow employees to nominate themselves for new training programs from their TNI dashboard.
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleToggle}
                        disabled={isPending}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                            tniEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        role="switch"
                        aria-checked={tniEnabled}
                    >
                        <span className="sr-only">Use setting</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                tniEnabled ? 'translate-x-7' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
