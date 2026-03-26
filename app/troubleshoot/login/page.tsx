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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">


            {/* Login Card */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden transform transition-all">
                <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <HiOutlineWrench size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">Troubleshooting Library</h1>
                        <p className="text-slate-400 text-sm mt-1">Authorized Personnel Only</p>
                    </div>
                    {/* Decorative Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                </div>

                <div className="p-8">
                    <form action={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <HiOutlineUser size={18} />
                                </div>
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <HiOutlineLockClosed size={18} />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <FormSubmitButton
                            isLoading={isLoading}
                            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 group"
                        >
                            Access Library
                            <HiOutlineLockClosed className="group-hover:scale-110 transition-transform" />
                        </FormSubmitButton>
                    </form>
                </div>

                <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        Authorized personnel only
                    </p>
                </div>
            </div>


        </div>
    );
}
