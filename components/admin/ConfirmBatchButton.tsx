'use client';

import { useState } from 'react';
import { Lock, Unlock, Loader2, CheckCircle2 } from 'lucide-react';
import { lockSessionBatch } from '@/app/actions/sessions';
import { useRouter } from 'next/navigation';

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

    if (isLocked) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm font-bold text-sm">
                <CheckCircle2 size={16} />
                <span>Batch Locked</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleLock}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border border-indigo-500 font-bold text-sm transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
        >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            <span>Confirm Batch</span>
        </button>
    );
}
