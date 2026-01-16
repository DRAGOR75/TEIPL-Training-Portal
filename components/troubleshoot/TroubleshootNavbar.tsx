'use client';

import { Wrench, MessageSquarePlus } from 'lucide-react';
import Image from 'next/image';

export default function TroubleshootNavbar() {
    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="w-full px-2 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-20">
                    {/* Left Side: Stacked Logos */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {/* Thriveni Logo */}
                            <div className="relative w-32 h-16">
                                <Image
                                    src="/thriveny_logo.svg"
                                    alt="Thriveni Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <div className="h-8 w-[1px] bg-slate-300 mx-2 hidden sm:block"></div>
                            {/* Lloyds Logo */}
                            <div className="relative w-34 h-10">
                                <Image
                                    src="/LLoyds_logo.svg"
                                    alt="Lloyds Metals Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                    sizes="100px"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Feedback Button */}
                    <div>
                        <a
                            href="/troubleshoot/feedback"
                            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-lg font-bold text-sm border border-slate-200 transition-colors group animate-pulse hover:animate-none"
                            title="Give Feedback"
                        >
                            <MessageSquarePlus size={18} className="text-orange-500" />
                            <span className="hidden md:inline">Feedback</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}
