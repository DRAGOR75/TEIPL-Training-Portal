'use client';

import { useState, useRef, useEffect } from 'react';
import { HiOutlineCheck, HiOutlineXMark, HiOutlinePencil } from 'react-icons/hi2';

interface InlineEditorProps {
    value: string;
    onSave: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    multiline?: boolean;
    disabled?: boolean;
}

export default function InlineEditor({
    value,
    onSave,
    placeholder = 'Enter value...',
    className = '',
    inputClassName = '',
    multiline = false,
    disabled = false
}: InlineEditorProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    function handleSave() {
        if (draft.trim() !== value) {
            onSave(draft.trim());
        }
        setEditing(false);
    }

    function handleCancel() {
        setDraft(value);
        setEditing(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !multiline) handleSave();
        if (e.key === 'Escape') handleCancel();
    }

    if (editing) {
        return (
            <div className={`flex items-center gap-1.5 ${className}`}>
                {multiline ? (
                    <textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={3}
                        className={`flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50/50 focus:ring-2 focus:ring-indigo-400 outline-none resize-none ${inputClassName}`}
                    />
                ) : (
                    <input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={`flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50/50 focus:ring-2 focus:ring-indigo-400 outline-none ${inputClassName}`}
                    />
                )}
                <button
                    onClick={handleSave}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Save"
                >
                    <HiOutlineCheck size={14} />
                </button>
                <button
                    onClick={handleCancel}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Cancel"
                >
                    <HiOutlineXMark size={14} />
                </button>
            </div>
        );
    }

    return (
        <span className={`group/inline inline-flex items-center gap-1.5 ${className}`}>
            <span>{value || <span className="text-slate-400 italic">{placeholder}</span>}</span>
            {!disabled && (
                <button
                    onClick={() => { setDraft(value); setEditing(true); }}
                    className="opacity-0 group-hover/inline:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                    title="Edit"
                >
                    <HiOutlinePencil size={12} />
                </button>
            )}
        </span>
    );
}
