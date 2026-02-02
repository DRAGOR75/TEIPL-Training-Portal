'use client';

import { useState } from 'react';
import { updateNominationStatus } from '@/app/actions/tni';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineArrowPath } from 'react-icons/hi2';

interface ManagerApprovalButtonsProps {
    nominationId: string;
}

export default function ManagerApprovalButtons({ nominationId }: ManagerApprovalButtonsProps) {
    const [status, setStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAction = async (newStatus: 'Approved' | 'Rejected') => {
        // Optimistic Update
        const previousStatus = status;
        setStatus(newStatus);
        setIsUpdating(true);

        try {
            const result = await updateNominationStatus(nominationId, newStatus);
            if (!result.success) {
                throw new Error(result.error);
            }
            // Success: Keep the new status (UI stays "Approved"/"Rejected")
            // The page will revalidate in background, ensuring consistency on refresh
        } catch (error) {
            console.error('Approval/Rejection failed:', error);
            // Revert on error
            setStatus(previousStatus);
            alert('Failed to update status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (status === 'Approved') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 font-bold text-sm animate-in fade-in zoom-in duration-300">
                <HiOutlineCheck size={18} strokeWidth={2.5} />
                Approved
            </div>
        );
    }

    if (status === 'Rejected') {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 font-bold text-sm animate-in fade-in zoom-in duration-300">
                <HiOutlineXMark size={18} strokeWidth={2.5} />
                Rejected
            </div>
        );
    }

    return (
        <div className="flex w-full md:w-auto items-center gap-3 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-4 md:mt-0">
            <button
                onClick={() => handleAction('Rejected')}
                disabled={isUpdating}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 font-bold text-sm transition-all focus:ring-2 focus:ring-red-200 focus:outline-none disabled:opacity-50"
            >
                <HiOutlineXMark size={18} strokeWidth={3} />
                Reject
            </button>

            <button
                onClick={() => handleAction('Approved')}
                disabled={isUpdating}
                className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 md:py-2.5 rounded-xl md:rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm transition-all shadow-md hover:shadow-lg shadow-indigo-600/20 active:scale-95 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50"
            >
                {isUpdating ? <HiOutlineArrowPath className="animate-spin" size={18} /> : <HiOutlineCheck size={18} strokeWidth={3} />}
                Approve
            </button>
        </div>
    );
}
