'use client';

import { useState } from 'react';
import { HiOutlineArrowRight, HiOutlineUser } from 'react-icons/hi2';
import { BiTargetLock } from 'react-icons/bi';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { loginEmployee } from '@/app/actions/employee-auth';
import Link from 'next/link';

export default function EmployeePortalLoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);
        
        const res = await loginEmployee(formData);
        
        if (res?.error) {
            setError(res.error);
            setIsLoading(false);
        } else {
            // Success, redirect to dashboard
            window.location.href = '/user-hub/dashboard';
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-slate-900 to-slate-900"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <Link href="/" className="absolute -top-4 -left-4 text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                            <span>← Home</span>
                        </Link>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 mt-4">
                            <BiTargetLock className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Employee Portal</h1>
                        <p className="text-slate-400 text-sm">Enter your employee ID to access your workspace.</p>
                    </div>
                </div>

                <div className="p-8 pt-10">
                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="empId" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Employee ID
                            </label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <HiOutlineUser size={20} />
                                </div>
                                <input
                                    name="empId"
                                    id="empId"
                                    required
                                    placeholder="Enter your Employee ID"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium bg-slate-50 focus:bg-white"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 text-sm font-medium text-center">
                                    {error}
                                </p>
                            </div>
                        )}

                        <FormSubmitButton 
                            isLoading={isLoading}
                            loadingText="VERIFYING..."
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20"
                        >
                            <span>Access Portal</span>
                            <HiOutlineArrowRight size={20} />
                        </FormSubmitButton>
                    </form>
                </div>

                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Internal System • Authorized Personnel Only</p>
                </div>
            </div>
        </div>
    );
}
