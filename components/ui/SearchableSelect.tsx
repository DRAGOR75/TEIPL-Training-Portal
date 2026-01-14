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
    icon
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
            {/* Trigger Button */}
            <div
                className={`
                    w-full rounded-xl border-slate-200 shadow-sm border bg-slate-50 font-medium text-slate-900 
                    transition-all flex items-center justify-between cursor-pointer
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:border-orange-300 focus:ring-2 focus:ring-orange-500'}
                    ${isOpen ? 'border-orange-500 ring-2 ring-orange-200' : ''}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                <div className={`flex-1 p-4 ${icon ? 'pl-12' : 'pl-4'} text-left truncate`}>
                    {selectedOption ? selectedOption.label : <span className="text-slate-500">{placeholder}</span>}
                </div>

                <div className="pr-4 flex items-center gap-2 text-slate-400">
                    {selectedOption && !disabled && (
                        <div
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {/* Search Input */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            <div className="p-1">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-4 py-2.5 rounded-lg text-sm cursor-pointer transition-colors
                                            ${String(option.value) === String(value) ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}
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
