'use client';

import { useState, useRef, useEffect, useDeferredValue } from 'react';
import { HiOutlineChevronDown, HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: any; // string | number | null | (string | number)[]
    onChange: (value: any) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    name?: string;
    searchPlaceholder?: string;
    noResultsText?: string;
    icon?: React.ReactNode;
    direction?: 'down' | 'up' | 'responsive-bottom';
    onAddNew?: (searchQuery: string) => void;
    addNewLabel?: string;
    isMulti?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    disabled = false,
    className = '',
    name,
    searchPlaceholder = 'Search...',
    noResultsText = 'No results found.',
    icon,
    direction = 'down',
    onAddNew,
    addNewLabel = 'Add New',
    isMulti = false
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

    const deferredQuery = useDeferredValue(searchQuery);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(deferredQuery.toLowerCase())
    );
    
    // Performance optimization: only render up to 100 items at a time
    const displayedOptions = filteredOptions.slice(0, 100);

    const isSelected = (optValue: string | number) => {
        if (isMulti && Array.isArray(value)) {
            return value.some(v => String(v) === String(optValue));
        }
        return String(value) === String(optValue);
    };

    const handleSelect = (optionValue: string | number) => {
        if (isMulti) {
            const arr = Array.isArray(value) ? value : [];
            if (isSelected(optionValue)) {
                // remove
                onChange(arr.filter((v: any) => String(v) !== String(optionValue)));
            } else {
                // add
                onChange([...arr, String(optionValue)]);
            }
            setSearchQuery('');
        } else {
            onChange(String(optionValue));
            setIsOpen(false);
            setSearchQuery('');
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(isMulti ? [] : '');
        setSearchQuery('');
    };

    const renderSelected = () => {
        if (isMulti && Array.isArray(value)) {
            if (value.length === 0) return <span className="text-slate-500">{placeholder}</span>;
            
            return (
                <div className="flex flex-wrap gap-1">
                    {value.map((val) => {
                        const opt = options.find(o => String(o.value) === String(val));
                        return (
                            <span key={String(val)} className="inline-flex items-center gap-1 bg-thriveni-blue/10 text-thriveni-blue px-2 py-0.5 rounded-md text-xs font-medium border border-thriveni-blue/20">
                                {opt ? opt.label : val}
                                <button 
                                    type="button" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(value.filter((v: any) => String(v) !== String(val)));
                                    }}
                                    className="hover:text-red-500 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                                >
                                    <HiOutlineXMark size={12} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            );
        } else {
            const selectedOption = options.find(option => String(option.value) === String(value));
            if (selectedOption) {
                return selectedOption.label;
            } else if (value) {
                return value;
            } else {
                return <span className="text-slate-500">{placeholder}</span>;
            }
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {name && (
                isMulti && Array.isArray(value) 
                    ? value.map((val, idx) => <input key={idx} type="hidden" name={name} value={String(val)} />)
                    : <input type="hidden" name={name} value={String(value || '')} />
            )}
            
            {/* Main Control (Trigger or Input) */}
            <div
                className={`
                    w-full rounded-xl border shadow-sm bg-white font-medium text-slate-900 
                    transition-all flex items-center justify-between cursor-pointer min-h-[46px]
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'hover:border-thriveni-blue/30 focus-within:ring-2 focus-within:ring-thriveni-blue/20 focus-within:border-thriveni-blue'}
                    ${isOpen ? 'border-thriveni-blue ring-2 ring-thriveni-blue/20 bg-white shadow-md' : 'border-slate-200'}
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

                <div className={`flex-1 flex flex-col min-w-0 ${icon ? 'pl-11' : 'pl-3'} py-1.5`}>
                    {!isOpen || isMulti ? (
                        <div className="w-full text-left text-sm min-w-0 leading-snug">
                            {renderSelected()}
                        </div>
                    ) : null}
                    
                    {isOpen && (
                        <input
                            ref={searchInputRef}
                            type="text"
                            className={`w-full bg-transparent border-none text-sm focus:outline-none placeholder:text-slate-400 min-w-0 ${isMulti ? 'mt-2' : ''}`}
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                            autoComplete="off"
                        />
                    )}
                </div>

                <div className="pr-4 flex items-center gap-2 text-slate-400 self-start mt-3">
                    {((isMulti ? Array.isArray(value) && value.length > 0 : value) || searchQuery) && !disabled && (
                        <div
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
                        >
                            <HiOutlineXMark size={14} />
                        </div>
                    )}
                    <HiOutlineChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-thriveni-blue' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {
                isOpen && (
                    <div className={`
                    absolute z-50 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100
                    ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}
                `}>
                        <div className="max-h-72 overflow-y-auto scroll-smooth overscroll-contain" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent', WebkitOverflowScrolling: 'touch' }}>
                            {displayedOptions.length > 0 ? (
                                <div className="p-1">
                                    {displayedOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            className={`
                                            px-4 py-3 rounded-lg text-sm cursor-pointer transition-colors break-words leading-relaxed border-b border-transparent hover:border-slate-100 last:border-0
                                            ${isSelected(option.value) ? 'bg-thriveni-blue/5 text-thriveni-blue font-bold' : 'text-slate-700 hover:bg-slate-50'}
                                        `}
                                            onClick={() => handleSelect(option.value)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isMulti && (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected(option.value)} 
                                                        readOnly 
                                                        className="rounded border-slate-300 text-thriveni-blue focus:ring-thriveni-blue/50 w-4 h-4"
                                                    />
                                                )}
                                                <span>{option.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                                    <span>{noResultsText}</span>
                                    {onAddNew && searchQuery && (
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddNew(searchQuery);
                                                if(!isMulti) setIsOpen(false);
                                            }}
                                            className="bg-thriveni-blue/10 text-thriveni-blue hover:bg-thriveni-blue/20 px-4 py-2 rounded-lg font-bold transition-colors w-full"
                                        >
                                            {addNewLabel} "{searchQuery}"
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

