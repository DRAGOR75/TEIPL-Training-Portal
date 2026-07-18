'use client';

import { useState, useTransition } from 'react';
import { HiOutlineXMark, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { cancelTrainingSession } from '@/app/actions/cancel-session';

export default function CancelSessionModal({
    session,
    triggerComponent
}: {
    session: any;
    triggerComponent: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleCancel = () => {
        if (!reason.trim()) {
            setError('Please provide a reason for cancellation.');
            return;
        }

        setError('');
        startTransition(async () => {
            const res = await cancelTrainingSession(session.id, reason);
            if (res.success) {
                setIsOpen(false);
                setReason('');
            } else {
                setError(res.error || 'Failed to cancel session.');
            }
        });
    };

    if (!isOpen) {
        return <div onClick={() => setIsOpen(true)}>{triggerComponent}</div>;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <HiOutlineExclamationTriangle className="text-rose-600" size={24} />
                            Cancel Session
                        </h2>
                        <button
                            onClick={() => !isPending && setIsOpen(false)}
                            disabled={isPending}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <HiOutlineXMark size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="mb-4 text-sm text-slate-600 bg-rose-50 p-3 rounded-lg border border-rose-100 text-left">
                        You are about to cancel the scheduled session for <strong>{session.altProgramName || session.programName}</strong>. 
                        Nominated employees will be reverted to 'Pending' status.
                    </div>

                    {error && (
                        <div className="mb-4 text-sm text-rose-600 font-medium text-left">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2 text-left">
                        <label className="block text-sm font-bold text-slate-700">
                            Reason for Cancellation <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={4}
                            placeholder="Enter the reason why this session is being cancelled..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={() => setIsOpen(false)}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                    >
                        Keep Session
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPending ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                </div>
            </div>
        </div>
    );
}
