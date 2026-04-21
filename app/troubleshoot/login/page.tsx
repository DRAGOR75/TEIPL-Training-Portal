'use client';

import { useState } from 'react';
import { loginTroubleshoot } from '@/app/actions/troubleshoot-auth';
import Image from 'next/image';
import { HiOutlineWrench, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi2';
import { FormSubmitButton } from '@/components/FormSubmitButton';

export default function TroubleshootLoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        const res = await loginTroubleshoot(formData);

        if (res?.error) {
            setError(res.error);
            setIsLoading(false);
        } else {
            // Redirect will happen via middleware or we can force refresh
            window.location.href = '/';
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                
                <div className="bg-slate-900 p-8 text-center">
                    <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                        <HiOutlineWrench className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Troubleshooting</h1>
                    <p className="text-slate-300 text-xs mt-1 uppercase tracking-widest font-bold">Secure Access</p>
                </div>

                <div className="p-8 pt-6">
                    <form action={handleSubmit} className="space-y-6">

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Username
                            </label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    placeholder="Enter your username"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Password
                            </label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-xs font-bold text-center italic">
                                    {error}
                                </p>
                            </div>
                        )}

                        <FormSubmitButton
                            isLoading={isLoading}
                            loadingText="VERIFYING..."
                            className="w-full bg-slate-900 hover:bg-black text-white font-black py-3 rounded-xl shadow-lg flex justify-center items-center gap-3 transition-all active:scale-95 disabled:opacity-70"
                        >
                            ACCESS LIBRARY
                        </FormSubmitButton>
                    </form>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Secure Environment • Thriveni 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
