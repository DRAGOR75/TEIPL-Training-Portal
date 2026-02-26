'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { HiOutlineBars3, HiOutlineXMark, HiOutlineHome, HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineSquares2X2, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import SignOutButton from './auth/SignOutButton';
import { Session } from 'next-auth';

export default function Navbar({ session }: { session: Session | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const isLoggedIn = !!session?.user;
    const userRole = (session?.user as any)?.role;
    const pathname = usePathname();

    // Hide Navbar on Feedback, Join & TNI Pages
    if (pathname?.startsWith('/join') || pathname?.startsWith('/feedback') || pathname?.startsWith('/tni') || pathname?.startsWith('/troubleshoot')) {
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
                            <NavLink href="/admin" icon={<HiOutlineShieldCheck size={18} />} text="Admin" />
                        )}
                        {userRole === 'TRAINER' && (
                            <NavLink href="/trainer" icon={<HiOutlineClipboardDocumentList size={18} />} text="Trainer Hub" />
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
                            <MobileNavLink href="/admin" onClick={() => setIsOpen(false)} text="Admin" />
                        )}
                        {userRole === 'TRAINER' && (
                            <MobileNavLink href="/trainer" onClick={() => setIsOpen(false)} text="Trainer Hub" />
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
