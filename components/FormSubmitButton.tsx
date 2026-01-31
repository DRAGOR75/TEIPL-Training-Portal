'use client';

import { useFormStatus } from 'react-dom';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import React from 'react';

interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loadingText?: string;
    isLoading?: boolean; // Manual loading state override
    children: React.ReactNode;
}

export function FormSubmitButton({
    children,
    className = "",
    loadingText = "Submitting...",
    isLoading = false,
    ...props
}: FormSubmitButtonProps) {
    const { pending } = useFormStatus();
    const isSubmitting = pending || isLoading;

    return (
        <button
            type="submit"
            disabled={isSubmitting || props.disabled}
            className={`${className} ${isSubmitting ? 'opacity-80 cursor-not-allowed' : ''}`}
            {...props}
        >
            {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                    <HiOutlineArrowPath className="animate-spin" size={20} />
                    {loadingText}
                </span>
            ) : (
                children
            )}
        </button>
    );
}
