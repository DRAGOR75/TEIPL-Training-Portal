'use client';

import { useState } from 'react';
import { submitManagerNominationDecision } from '@/app/actions/manager-approval';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
    nomination: any; // Type this properly if possible, but any is fine for now
}

export default function ApprovalClient({ nomination }: Props) {
    const [status, setStatus] = useState<'IDLE' | 'APPROVING' | 'REJECTING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const router = useRouter();

    const handleApprove = async () => {
        if (!confirm("Are you sure you want to APPROVE this nomination?")) return;
        setStatus('APPROVING');
        const res = await submitManagerNominationDecision(nomination.id, 'Approved');
        if (res.success) {
            setStatus('SUCCESS');
            router.refresh(); // Refresh to update server-side view if we stay on page
        } else {
            setStatus('ERROR');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) return;
        setStatus('REJECTING');
        const res = await submitManagerNominationDecision(nomination.id, 'Rejected', rejectionReason);
        if (res.success) {
            setStatus('SUCCESS');
            router.refresh();
        } else {
            setStatus('ERROR');
        }
    };

    if (nomination.managerApprovalStatus === 'Approved') {
        return (
            <div className="bg-green-50 p-8 rounded-xl border border-green-100 text-center">
                <div className="bg-green-100 p-3 rounded-full inline-block mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-800">Nomination Approved!</h2>
                <p className="text-green-600 mt-2">You have approved {nomination.employee.name} for this training.</p>
            </div>
        );
    }

    if (nomination.managerApprovalStatus === 'Rejected') {
        return (
            <div className="bg-red-50 p-8 rounded-xl border border-red-100 text-center">
                <div className="bg-red-100 p-3 rounded-full inline-block mb-4">
                    <X className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-red-800">Nomination Rejected</h2>
                <p className="text-red-600 mt-2">You have rejected this nomination.</p>
                <div className="mt-4 bg-white p-4 rounded-lg text-left text-sm text-slate-600 border border-red-100">
                    <strong>Reason:</strong> {nomination.managerRejectionReason}
                </div>
            </div>
        );
    }

    if (status === 'SUCCESS') {
        return (
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                <h2 className="text-xl font-bold text-slate-800">Action Recorded</h2>
                <p className="text-slate-600 mt-2">Thank you for your response.</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 underline">View Status</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!showRejectForm ? (
                <div className="flex gap-4">
                    <button
                        onClick={handleApprove}
                        disabled={status !== 'IDLE'}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {status === 'APPROVING' ? <Loader2 className="animate-spin" /> : <Check />}
                        Approve Nomination
                    </button>
                    <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={status !== 'IDLE'}
                        className="flex-1 bg-white border-2 border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <X />
                        Reject
                    </button>
                </div>
            ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="text-red-500 w-5 h-5" />
                            Reason for Rejection
                        </h3>
                        <button onClick={() => setShowRejectForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={18} />
                        </button>
                    </div>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejecting this nomination..."
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none text-sm min-h-[100px]"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || status === 'REJECTING'}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {status === 'REJECTING' ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                            Confirm Rejection
                        </button>
                        <button
                            onClick={() => setShowRejectForm(false)}
                            className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {status === 'ERROR' && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Something went wrong. Please try again.
                </div>
            )}
        </div>
    );
}
