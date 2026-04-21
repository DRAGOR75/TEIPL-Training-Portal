'use client';

import { HiOutlineChevronRight, HiOutlineHome } from 'react-icons/hi2';

export interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
}

interface ManualBreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function ManualBreadcrumb({ items }: ManualBreadcrumbProps) {
    return (
        <nav className="flex items-center gap-1 text-sm mb-6 animate-in fade-in slide-in-from-left-2 duration-300">
            {items.map((item, index) => (
                <span key={index} className="flex items-center gap-1">
                    {index > 0 && (
                        <HiOutlineChevronRight size={12} className="text-slate-300 mx-0.5" />
                    )}
                    {item.onClick ? (
                        <button
                            onClick={item.onClick}
                            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors hover:underline underline-offset-2"
                        >
                            {index === 0 && <HiOutlineHome size={14} className="inline mr-1 -mt-0.5" />}
                            {item.label}
                        </button>
                    ) : (
                        <span className="text-slate-800 font-bold">
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
