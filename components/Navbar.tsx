'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
    HiOutlineBars3, HiOutlineXMark, HiOutlineHome, HiOutlineShieldCheck, 
    HiOutlineDocumentText, HiOutlineSquares2X2, HiOutlineClipboardDocumentList, 
    HiOutlineChartBar, HiOutlineWrench, HiOutlineBookOpen, HiOutlineUsers, 
    HiOutlinePaperAirplane, HiOutlineChatBubbleBottomCenterText, HiOutlineChevronDown
} from 'react-icons/hi2';
import SignOutButton from './auth/SignOutButton';
import { Session } from 'next-auth';

export default function Navbar({ session, hostname = '' }: { session: Session | null; hostname?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const isLoggedIn = !!session?.user;
    const userRole = (session?.user as any)?.role;
    const pathname = usePathname();
    const isTroubleshootHost = hostname.toLowerCase().startsWith('troubleshoot') || hostname.toLowerCase().includes('hemmts');

    // Hide Navbar on Troubleshooting Subdomain or specific paths
    const isTroubleshootPage = isTroubleshootHost || 
                               pathname?.startsWith('/join') || 
                               pathname?.startsWith('/feedback') || 
                               pathname?.startsWith('/tni') || 
                               pathname?.startsWith('/troubleshoot');

    if (isTroubleshootPage) {
        return null;
    }

    return (
        <nav className="glass shadow-air border-b border-white/20 sticky top-0 z-50">
            <div className="w-full px-2 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-20">

                    {/* Left Side: Stacked Logos */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            {/* Thriveni Logo */}
                            <div className="relative w-24 sm:w-32 h-16 transition-transform group-hover:scale-105">
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
                            <div className="relative w-24 sm:w-36 h-10 transition-transform group-hover:scale-105">
                                <Image
                                    src="/LLoyds_logo.svg"
                                    alt="Lloyds Metals Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                    sizes="100px"
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Right Side: Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        <NavLink href="/" icon={<HiOutlineHome size={18} />} text="Home" />
                        {userRole === 'ADMIN' && (
                            <AdminDropdown />
                        )}
                        {userRole === 'TRAINER' && (
                            <>
                                <NavLink href="/trainer/dashboard" icon={<HiOutlineClipboardDocumentList size={18} />} text="Trainer Hub" />
                                <NavLink href="/trainer/reports" icon={<HiOutlineChartBar size={18} />} text="Reports" />
                            </>
                        )}

                        {isLoggedIn && (
                            <div className="ml-4 pl-4 border-l border-slate-200 flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-700 mb-1">{session?.user?.name}</span>
                                <SignOutButton />
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-600 hover:text-blue-700 p-2 rounded-md focus:outline-none transition-colors"
                        >
                            {isOpen ? <HiOutlineXMark size={28} /> : <HiOutlineBars3 size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-lg animate-in slide-in-from-top-5">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <MobileNavLink href="/" onClick={() => setIsOpen(false)} text="Home" />
                        {userRole === 'ADMIN' && (
                            <MobileAdminMenu closeNav={() => setIsOpen(false)} />
                        )}
                        {userRole === 'TRAINER' && (
                            <>
                                <MobileNavLink href="/trainer/dashboard" onClick={() => setIsOpen(false)} text="Trainer Hub" />
                                <MobileNavLink href="/trainer/reports" onClick={() => setIsOpen(false)} text="Reports" />
                            </>
                        )}

                        {isLoggedIn && (
                            <div className="pt-4 border-t border-slate-100 mt-2 flex flex-col items-center gap-2">
                                <span className="text-sm font-bold text-slate-700">{session?.user?.name}</span>
                                <SignOutButton />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

// Helper Components
function NavLink({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-700 font-medium text-sm transition-colors py-2 px-3 rounded-lg hover:bg-white/50"
        >
            {icon}
            <span>{text}</span>
        </Link>
    );
}

function MobileNavLink({ href, onClick, text }: { href: string; onClick: () => void; text: string }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="block text-lg font-semibold text-slate-800 py-3 px-2 border-b border-slate-50 hover:bg-slate-50 hover:pl-4 transition-all"
        >
            {text}
        </Link>
    );
}

const ADMIN_TABS = [
    { id: 'hub', label: 'Admin Hub', href: '/admin', icon: HiOutlineSquares2X2 },
    { id: 'feedback', label: 'Feedback', href: '/admin/dashboard', icon: HiOutlineChatBubbleBottomCenterText },
    { id: 'tni', label: 'Master Data', href: '/admin/tni-dashboard', icon: HiOutlineClipboardDocumentList },
    { id: 'troubleshooting', label: 'Diagnostics', href: '/admin/troubleshooting', icon: HiOutlineWrench },
    { id: 'manuals', label: 'Manuals', href: '/training-manuals', icon: HiOutlineBookOpen },
    { id: 'sessions', label: 'Sessions', href: '/admin/sessions', icon: HiOutlineUsers },
    { id: 'reports', label: 'Reports', href: '/admin/reports', icon: HiOutlineChartBar },
    { id: 'email', label: 'Bulk Email', href: '/admin/bulk-email', icon: HiOutlinePaperAirplane },
];

function AdminDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => setIsOpen(false), [pathname]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-700 font-medium text-sm transition-colors py-2 px-3 rounded-lg hover:bg-indigo-50/50 focus:outline-none"
            >
                <HiOutlineBars3 size={20} />
                <span>Admin</span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white shadow-xl border border-slate-100 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="py-2 px-2 space-y-1">
                        {ADMIN_TABS.map(tab => {
                            const isActive = pathname === tab.href || (tab.id !== 'hub' && pathname.startsWith(tab.href));
                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium'
                                    }`}
                                >
                                    <tab.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                    <span className="text-sm">{tab.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function MobileAdminMenu({ closeNav }: { closeNav: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const pathname = usePathname();
    return (
        <div>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-lg font-semibold text-slate-800 py-3 px-2 border-b border-slate-50 hover:bg-slate-50 hover:pl-4 transition-all focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <HiOutlineBars3 size={24} className="text-slate-500" />
                    <span>Admin Menu</span>
                </div>
                <HiOutlineChevronDown size={20} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="bg-slate-50/50 py-2 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200 border-b border-slate-50">
                    {ADMIN_TABS.map(tab => {
                        const isActive = pathname === tab.href || (tab.id !== 'hub' && pathname.startsWith(tab.href));
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                onClick={closeNav}
                                className={`flex items-center gap-3 py-3 px-6 transition-colors ${
                                    isActive ? 'text-indigo-700 font-bold bg-indigo-50/50' : 'text-slate-600 hover:text-indigo-700 font-medium'
                                }`}
                            >
                                <tab.icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
