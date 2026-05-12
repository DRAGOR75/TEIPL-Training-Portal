'use client';

import { useState } from 'react';
import { HiOutlinePaperAirplane, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import EmailRecipientModal from './EmailRecipientModal';

interface SendInvitationButtonProps {
    sessionId: string;
    emailsSent: boolean;
    participantCount: number;
    isLocked: boolean;
}

export default function SendInvitationButton({ sessionId, emailsSent, participantCount, isLocked }: SendInvitationButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [hasSent, setHasSent] = useState(emailsSent);
    const router = useRouter();

    const handleSuccess = () => {
        setHasSent(true);
        setShowModal(false);
        alert("Invitations sent successfully!");
        router.refresh();
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                disabled={participantCount === 0 || !isLocked}
                title={!isLocked ? "Batch must be confirmed/locked before sending invites" : participantCount === 0 ? "No participants in batch" : hasSent ? "Send Reminders" : "Send Invites"}
                className={`flex items-center gap-2 px-4 py-2 ${hasSent ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700'} rounded-xl shadow-md border font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <HiOutlinePaperAirplane size={16} className={hasSent ? "" : "-rotate-45"} />
                <span>{hasSent ? "Send Reminders" : "Send Invites"}</span>
            </button>

            {showModal && (
                <EmailRecipientModal
                    sessionId={sessionId}
                    isReminder={hasSent}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
}
