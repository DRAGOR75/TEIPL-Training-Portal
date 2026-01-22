'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | null;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    searchPlaceholder?: string;
    noResultsText?: string;
    icon?: React.ReactNode;
    direction?: 'down' | 'up' | 'responsive-bottom';
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    disabled = false,
    className = '',
    searchPlaceholder = 'Search...',
    noResultsText = 'No results found.',
    icon,
    direction = 'down'
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = options.find(option => String(option.value) === String(value));

    const handleSelect = (optionValue: string | number) => {
        onChange(String(optionValue));
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchQuery('');
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Main Control (Trigger or Input) */}
            <div
                className={`
                    w-full rounded-xl border shadow-sm bg-slate-50 font-medium text-slate-900 
                    transition-all flex items-center justify-between cursor-pointer
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'hover:border-thriveni-blue/30 focus-within:ring-2 focus-within:ring-thriveni-blue/20 focus-within:border-thriveni-blue'}
                    ${isOpen ? 'border-thriveni-blue ring-2 ring-thriveni-blue/20 bg-white' : 'border-slate-200'}
                `}
                onClick={() => {
                    if (!disabled && !isOpen) {
                        setIsOpen(true);
                    }
                }}
            >
                {/* Icon (Always visible on left) */}
                {icon && (
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isOpen ? 'text-thriveni-blue' : 'text-slate-400'}`}>
                        {icon}
                    </div>
                )}

                <div className={`flex-1 flex items-center min-w-0 ${icon ? 'pl-11' : 'pl-3'}`}>
                    {isOpen ? (
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="w-full bg-transparent border-none p-3 text-sm focus:outline-none placeholder:text-slate-400 min-w-0"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                            autoComplete="off"
                        />
                    ) : (
                        <div className="p-3 w-full text-left break-words text-sm min-w-0 leading-snug">
                            {selectedOption ? selectedOption.label : <span className="text-slate-500">{placeholder}</span>}
                        </div>
                    )}
                </div>

                <div className="pr-4 flex items-center gap-2 text-slate-400">
                    {(selectedOption || searchQuery) && !disabled && (
                        <div
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-thriveni-blue' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`
                    absolute z-50 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100
                    ${direction === 'up' ? 'bottom-full mb-2' : ''}
                    ${direction === 'down' ? 'top-full mt-2' : ''}
                    ${direction === 'responsive-bottom' ? 'bottom-full mb-2 md:bottom-auto md:top-full md:mt-2 md:mb-0' : ''}
                `}>
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            <div className="p-1">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-4 py-3 rounded-lg text-sm cursor-pointer transition-colors break-words leading-relaxed border-b border-transparent hover:border-slate-100 last:border-0
                                            ${String(option.value) === String(value) ? 'bg-thriveni-blue/5 text-thriveni-blue font-bold' : 'text-slate-700 hover:bg-slate-50'}
                                        `}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                {noResultsText}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
