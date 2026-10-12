'use client';

import { useState, useRef, useEffect } from 'react';
import { HiOutlinePrinter, HiChevronDown, HiOutlineMapPin, HiOutlineBriefcase, HiOutlineSquares2X2 } from 'react-icons/hi2';

interface PrintAttendanceButtonProps {
    baseUrl: string;
    label?: string;
    variant?: 'indigo' | 'slate';
}

export default function PrintAttendanceButton({
    baseUrl,
    label = 'Print Sheet',
    variant = 'indigo'
}: PrintAttendanceButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const isIndigo = variant === 'indigo';
    const mainBtnClasses = isIndigo
        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800 border-slate-200';

    return (
        <div className="relative inline-flex items-stretch rounded-xl shadow-sm" ref={dropdownRef}>
            {/* Primary Action Button */}
            <a
                href={baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 font-bold border px-3.5 py-2 rounded-l-xl text-sm transition-colors ${mainBtnClasses}`}
                title="Open attendance print preview"
            >
                <HiOutlinePrinter className="w-4 h-4" />
                <span>{label}</span>
            </a>

            {/* Dropdown Toggle Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`px-2 border-y border-r rounded-r-xl transition-colors flex items-center justify-center ${mainBtnClasses} border-l-slate-200/60`}
                title="Print options (Location / Designation)"
                aria-expanded={isOpen}
            >
                <HiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Print Options
                    </div>

                    <a
                        href={`${baseUrl}?col=location&autoPrint=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium"
                    >
                        <HiOutlineMapPin className="w-4 h-4 text-blue-500" />
                        <div>
                            <div className="font-semibold">With Location</div>
                            <div className="text-[10px] text-slate-400">Shows employee work location</div>
                        </div>
                    </a>

                    <a
                        href={`${baseUrl}?col=designation&autoPrint=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium"
                    >
                        <HiOutlineBriefcase className="w-4 h-4 text-purple-500" />
                        <div>
                            <div className="font-semibold">With Designation</div>
                            <div className="text-[10px] text-slate-400">Shows employee designation</div>
                        </div>
                    </a>

                    <a
                        href={`${baseUrl}?col=both&autoPrint=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-medium"
                    >
                        <HiOutlineSquares2X2 className="w-4 h-4 text-emerald-500" />
                        <div>
                            <div className="font-semibold">With Both</div>
                            <div className="text-[10px] text-slate-400">Location and Designation</div>
                        </div>
                    </a>
                </div>
            )}
        </div>
    );
}
