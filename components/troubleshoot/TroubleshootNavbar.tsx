'use client';

import Link from 'next/link';
import { HiOutlineWrench, HiOutlineChatBubbleBottomCenterText, HiOutlineArrowDownTray } from 'react-icons/hi2';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function TroubleshootNavbar() {
    const [isNavigating, setIsNavigating] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    useEffect(() => {
        const currentHost = window.location.hostname.toLowerCase();
        const isTroubleshoot = currentHost === 'hemmts.academythriveni.com' || 
                             currentHost.includes('hemmts') || 
                             currentHost.startsWith('troubleshoot');

        if (!isTroubleshoot) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        
        window.addEventListener('beforeinstallprompt', handler);

        // Check if iOS and not already installed
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        }
        const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator as any).standalone;
        
        // Match media for desktop PWAs installed already
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (isIos() && !isInStandaloneMode() && !isStandalone) {
            setShowInstallBtn(true);
        }

        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('Service Worker registration failed:', err);
            });
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowInstallBtn(false);
            }
            setDeferredPrompt(null);
        } else {
            alert("To install this app on your iPhone/iPad:\n\n1. Tap the Share button at the bottom of Safari\n2. Scroll down and tap 'Add to Home Screen'");
        }
    };

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            {isNavigating && <LoadingSpinner />}
            <div className="w-full px-2 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-20">
                    {/* Left Side: Header */}
                    <div className="flex items-center gap-4">
                        <a href="/" className="flex items-center gap-2 md:gap-3">
                            {/* Logos Container */}
                            <div className="flex flex-col md:flex-row items-center justify-center -space-y-2 md:space-y-0 md:gap-4">
                                {/* Thriveni Logo */}
                                <div className="relative w-20 h-6 md:w-32 md:h-16">
                                    <Image
                                        src="/thriveny_logo.svg"
                                        alt="Thriveni Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                                <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
                                {/* Lloyds Logo */}
                                <div className="relative w-22 h-6 md:w-34 md:h-10">
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
                        </a>
                    </div>

                    {/* Centered Title */}
                    <div className="flex items-center gap-2 md:gap-3 md:ml-0 md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center text-white shrink-0">
                            <HiOutlineWrench size={20} className="md:hidden" />
                            <HiOutlineWrench size={24} className="hidden md:block" />
                        </div>
                        <h1 className="text-sm md:text-2xl font-black text-slate-900 tracking-wide leading-tight">
                            Troubleshooting<br className="md:hidden" /> Library
                        </h1>
                    </div>

                    {/* Right Side: Install + Feedback Buttons */}
                    <div className="flex items-center gap-2">
                        {showInstallBtn && (
                            <button
                                onClick={handleInstallClick}
                                className="flex items-center gap-1.5 md:gap-2 bg-thriveni-blue hover:bg-thriveni-light text-white px-2.5 py-2 md:px-3 rounded-lg font-bold text-sm transition-colors shadow-sm"
                                title="Install App"
                            >
                                <HiOutlineArrowDownTray size={18} />
                                <span className="hidden md:inline">Install App</span>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsNavigating(true);
                                window.location.href = '/feedback';
                            }}
                            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-2 rounded-lg font-bold text-sm border border-slate-200 transition-colors group animate-pulse hover:animate-none"
                            title="Give Feedback"
                        >
                            <HiOutlineChatBubbleBottomCenterText size={18} className="text-lloyds-red" />
                            <span className="hidden md:inline">Feedback</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
