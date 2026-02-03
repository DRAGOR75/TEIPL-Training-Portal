'use client';

import { useState, useEffect } from 'react';
import { HiXMark, HiOutlinePaperAirplane, HiOutlineArrowPath, HiOutlineUserGroup, HiOutlineEnvelope } from 'react-icons/hi2';
import { getBatchInvitationPreview, sendBatchInvitation } from '@/app/actions/sessions';
import { useRouter } from 'next/navigation';

interface EmailRecipientModalProps {
    sessionId: string;
    onClose: () => void;
    onSuccess: () => void;
}

type Tab = 'recipients' | 'content';

export default function EmailRecipientModal({ sessionId, onClose, onSuccess }: EmailRecipientModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('recipients');

    // Data State
    const [toDisplay, setToDisplay] = useState('');
    const [ccDisplay, setCcDisplay] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

    useEffect(() => {
        const loadPreview = async () => {
            const result = await getBatchInvitationPreview(sessionId);
            if (result.success && result.to && result.cc) {
                setToDisplay(result.to.join(', '));
                setCcDisplay(result.cc.join(', '));
                setHtmlContent(result.html || '');
            } else {
                setError(result.error || "Failed to load recipients.");
            }
            setIsLoading(false);
        };
        loadPreview();
    }, [sessionId]);

    const handleSend = async () => {
        setIsSending(true);
        setError(null);

        // Parse inputs back to arrays
        const toList = toDisplay.split(',').map(e => e.trim()).filter(Boolean);
        const ccList = ccDisplay.split(',').map(e => e.trim()).filter(Boolean);

        if (toList.length === 0) {
            setError("At least one recipient is required in 'To'.");
            setIsSending(false);
            return;
        }

        // CHUNKING STRATEGY to avoid Vercel Pro/Hobby Timeouts (10-60s)
        const CHUNK_SIZE = 5;
        const totalBatches = Math.ceil(toList.length / CHUNK_SIZE);
        let completedBatches = 0;
        let failedRecipients: string[] = [];

        // Initialize Progress
        setProgress({ current: 0, total: totalBatches });

        try {
            for (let i = 0; i < toList.length; i += CHUNK_SIZE) {
                const batchTo = toList.slice(i, i + CHUNK_SIZE);

                // Only CC on the first batch to avoid spamming managers with 10 duplicate emails
                // or potential "Reply All" confusion. 
                const batchCc = i === 0 ? ccList : [];

                // Update UI Progress
                setProgress({ current: i / CHUNK_SIZE + 1, total: totalBatches });

                // Update UI Progress (e.g. "Sending Batch 1/5...")
                // We use a temporary error/status message or add a new state for detailed progress
                // customized below in the button re-render later, but strictly logic here:

                // Use the return value to track failures
                const result = await sendBatchInvitation(sessionId, batchTo, batchCc, htmlContent);

                if (!result.success) {
                    console.error("Batch failed:", result.error);
                    failedRecipients.push(...batchTo);
                }

                completedBatches++;
            }

            if (failedRecipients.length > 0) {
                setError(`Completed with errors. Failed to send to: ${failedRecipients.join(', ')}`);
            } else {
                onSuccess();
            }

        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred during batched sending.");
        } finally {
            setIsSending(false);
            setProgress(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Send Invitation</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        <HiXMark size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('recipients')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'recipients' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <HiOutlineUserGroup size={18} /> Recipients
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'content' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <HiOutlineEnvelope size={18} /> Email Content
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <HiOutlineArrowPath className="animate-spin text-slate-400 w-8 h-8" />
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                    {error}
                                </div>
                            )}

                            {activeTab === 'recipients' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">To (Participants)</label>
                                        <p className="text-xs text-slate-500 mb-2">Comma separated email addresses.</p>
                                        <textarea
                                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono min-h-[100px]"
                                            value={toDisplay}
                                            onChange={(e) => setToDisplay(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Cc (Managers)</label>
                                        <p className="text-xs text-slate-500 mb-2">Comma separated email addresses.</p>
                                        <textarea
                                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono min-h-[80px]"
                                            value={ccDisplay}
                                            onChange={(e) => setCcDisplay(e.target.value)}
                                        />
                                    </div>

                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800">
                                        <strong>Note:</strong> Editing these lists only changes who receives the email. The participant table in the content tab reflects the current batch enrollment.
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">HTML Message Body</label>
                                    <p className="text-xs text-slate-500 mb-2">You can edit the HTML directly to customize the message. Be careful not to break the layout.</p>
                                    <textarea
                                        className="w-full flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono min-h-[300px]"
                                        value={htmlContent}
                                        onChange={(e) => setHtmlContent(e.target.value)}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors"
                        disabled={isSending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isLoading || isSending}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <HiOutlineArrowPath className="animate-spin" /> {progress ? `Sending Batch ${progress.current}/${progress.total}` : 'Sending...'}
                            </>
                        ) : (
                            <>
                                <HiOutlinePaperAirplane className="-rotate-45" /> Send Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
