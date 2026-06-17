'use client';

import { useState } from 'react';
import { HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineArrowPath, HiOutlineCheckCircle } from 'react-icons/hi2';
import { lockSessionBatch, unlockSessionBatch } from '@/app/actions/sessions';
import { useRouter } from 'next/navigation';
import { FormSubmitButton } from '../FormSubmitButton';

interface ConfirmBatchButtonProps {
    sessionId: string;
    initialStatus: string; // 'Forming' | 'Scheduled' | 'Completed'
}

export default function ConfirmBatchButton({ sessionId, initialStatus }: ConfirmBatchButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(initialStatus);
    const router = useRouter();

    const isLocked = status === 'Scheduled' || status === 'Completed';

    const handleLock = async () => {
        if (!confirm('Are you sure you want to lock this batch? No further participants can be added.')) return;

        setIsLoading(true);
        try {
            const result = await lockSessionBatch(sessionId);
            if (result.success) {
                setStatus('Scheduled');
                router.refresh();
            } else {
                alert('Failed to lock batch: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (!confirm('Are you sure you want to unlock this batch? You will be able to add more participants, but the status will revert to Forming.')) return;

        setIsLoading(true);
        try {
            const result = await unlockSessionBatch(sessionId);
            if (result.success) {
                setStatus('Forming');
                router.refresh();
            } else {
                alert('Failed to unlock batch: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'Completed') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm font-bold text-sm">
                <HiOutlineCheckCircle size={16} />
                <span>Batch Completed</span>
            </div>
        );
    }

    if (status === 'Scheduled') {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm font-bold text-sm">
                    <HiOutlineCheckCircle size={16} />
                    <span>Batch Locked</span>
                </div>
                <FormSubmitButton
                    onClick={handleUnlock}
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText="Unlocking..."
                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm border border-slate-200 font-bold text-sm transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                    title="Unlock Batch to add more participants"
                >
                    <HiOutlineLockOpen size={16} />
                    <span>Unlock</span>
                </FormSubmitButton>
            </div>
        );
    }

    return (
        <FormSubmitButton
            onClick={handleLock}
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Confirming..."
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border border-indigo-500 font-bold text-sm transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
        >
            <HiOutlineLockClosed size={16} />
            <span>Confirm Batch</span>
        </FormSubmitButton>
    );
}
