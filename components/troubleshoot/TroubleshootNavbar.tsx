'use client';

import Link from 'next/link';
import { Wrench, MessageSquarePlus } from 'lucide-react';
import Image from 'next/image';

export default function TroubleshootNavbar() {
    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="w-full px-2 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-20">
                    {/* Left Side: Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 md:gap-3">
                            {/* Logos Container */}
                            <div className="flex flex-col md:flex-row items-center justify-center -space-y-2 md:space-y-0 md:gap-4">
                                {/* Thriveni Logo */}
                                <div className="relative w-24 h-8 md:w-32 md:h-16">
                                    <Image
                                        src="/thriveny_logo.svg"
                                        alt="Thriveni Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                                <div className="h-8 w-[1px] bg-slate-300 mx-4 hidden md:block"></div>
                                {/* Lloyds Logo */}
                                <div className="relative w-27 h-8 md:w-34 md:h-10">
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
                        </Link>
                    </div>

                    {/* Centered Title */}
                    <div className="flex flex-col items-center  md:ml-0 md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2">
                        <h1 className="text-base md:text-2xl font-black text-slate-900 tracking-wide leading-snug md:leading-tight text-center">
                            Troubleshooting<br className="md:hidden" /> Library
                        </h1>
                    </div>

                    {/* Right Side: Feedback Button */}
                    <div>
                        <a
                            href="/troubleshoot/feedback"
                            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-lg font-bold text-sm border border-slate-200 transition-colors group animate-pulse hover:animate-none"
                            title="Give Feedback"
                        >
                            <MessageSquarePlus size={18} className="text-lloyds-red" />
                            <span className="hidden md:inline">Feedback</span>
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}
