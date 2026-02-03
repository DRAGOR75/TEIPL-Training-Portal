'use client';

import { useState } from 'react';
import { HiOutlinePaperAirplane, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import EmailRecipientModal from './EmailRecipientModal';

interface SendInvitationButtonProps {
    sessionId: string;
    emailsSent: boolean;
    participantCount: number;
}

export default function SendInvitationButton({ sessionId, emailsSent, participantCount }: SendInvitationButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [hasSent, setHasSent] = useState(emailsSent);
    const router = useRouter();

    const handleSuccess = () => {
        setHasSent(true);
        setShowModal(false);
        alert("Invitations sent successfully!");
        router.refresh();
    };

    if (hasSent) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shadow-sm font-bold text-sm">
                <HiOutlineCheckCircle size={16} />
                <span>Invites Sent</span>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={participantCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-md border border-slate-700 font-bold text-sm transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
                <HiOutlinePaperAirplane size={16} className="-rotate-45" />
                <span>Send Invites</span>
            </button>

            {showModal && (
                <EmailRecipientModal
                    sessionId={sessionId}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
}
