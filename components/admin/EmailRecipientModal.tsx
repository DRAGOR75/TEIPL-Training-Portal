import { useState, useEffect, useRef } from 'react';
import { HiXMark, HiOutlinePaperAirplane, HiOutlineArrowPath, HiOutlineArrowPathRoundedSquare } from 'react-icons/hi2';
import { getBatchInvitationPreview, sendBatchInvitation } from '@/app/actions/sessions';

interface EmailRecipientModalProps {
    sessionId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmailRecipientModal({ sessionId, onClose, onSuccess }: EmailRecipientModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Data State
    const [toDisplay, setToDisplay] = useState('');
    const [ccDisplay, setCcDisplay] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [subject, setSubject] = useState('');
    const [defaultContent, setDefaultContent] = useState({ html: '', subject: '' });
    const [sessionData, setSessionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadPreview = async () => {
            const result = await getBatchInvitationPreview(sessionId);
            if (result.success && result.to && result.cc) {
                setToDisplay(result.to.join(', '));
                setCcDisplay(result.cc.join(', '));
                setHtmlContent(result.html || '');

                const defaultSub = result.sessionData ? `Invitation: ${result.sessionData.programName} (${new Date(result.sessionData.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(result.sessionData.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})` : '';
                setSubject(defaultSub);
                setDefaultContent({ html: result.html || '', subject: defaultSub });

                if (result.sessionData) {
                    setSessionData(result.sessionData);
                }
            } else {
                setError(result.error || "Failed to load recipients.");
            }
            setIsLoading(false);
        };
        loadPreview();
    }, [sessionId]);

    const handleReset = () => {
        if (!confirm("Are you sure you want to reset all changes to the email content and subject?")) return;
        setSubject(defaultContent.subject);
        setHtmlContent(defaultContent.html);
        if (contentRef.current) {
            contentRef.current.innerHTML = defaultContent.html;
        }
    };

    const handleSend = async () => {
        setIsSending(true);
        setError(null);

        const toList = toDisplay.split(',').map(e => e.trim()).filter(Boolean);
        const ccList = ccDisplay.split(',').map(e => e.trim()).filter(Boolean);

        if (toList.length === 0) {
            setError("At least one recipient is required in 'To'.");
            setIsSending(false);
            return;
        }

        // Sync HTML content from the editable div
        const finalHtml = contentRef.current?.innerHTML || htmlContent;

        const CHUNK_SIZE = 5;
        const totalBatches = Math.ceil(toList.length / CHUNK_SIZE);

        setProgress({ current: 0, total: totalBatches });

        try {
            for (let i = 0; i < toList.length; i += CHUNK_SIZE) {
                const batchTo = toList.slice(i, i + CHUNK_SIZE);
                const batchCc = i === 0 ? ccList : [];

                setProgress({ current: i / CHUNK_SIZE + 1, total: totalBatches });

                const result = await sendBatchInvitation(sessionId, batchTo, batchCc, finalHtml, subject);

                if (!result.success) {
                    setError(`Failed to send to some recipients.`);
                    setIsSending(false);
                    return;
                }
            }
            onSuccess();
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsSending(false);
            setProgress(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-slate-800">Review Invitation</h3>
                        <p className="text-[10px] bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded uppercase tracking-wider">Direct Edit Mode</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        <HiXMark size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <HiOutlineArrowPath className="animate-spin text-slate-400 w-8 h-8" />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col min-h-0">
                            {/* Email Header Fields */}
                            <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
                                {error && (
                                    <div className="p-3 mb-2 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                                        {error}
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <span className="text-sm font-bold text-slate-400 w-12 pt-2 shrink-0">To:</span>
                                    <div className="flex-1 flex flex-col">
                                        <textarea
                                            className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 resize-none min-h-[40px] max-h-[80px] overflow-y-auto placeholder:text-slate-300"
                                            placeholder="Example: emp1@company.com, emp2@company.com"
                                            value={toDisplay}
                                            onChange={(e) => setToDisplay(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 pt-1">
                                    <span className="text-sm font-bold text-slate-400 w-12 pt-2 shrink-0">Cc:</span>
                                    <div className="flex-1 flex flex-col">
                                        <textarea
                                            className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 resize-none min-h-[40px] max-h-[60px] overflow-y-auto placeholder:text-slate-300"
                                            placeholder="Example: manager1@company.com, admin@company.com"
                                            value={ccDisplay}
                                            onChange={(e) => setCcDisplay(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-1">
                                    <span className="text-sm font-bold text-slate-400 w-12 shrink-0">Subject:</span>
                                    <input
                                        type="text"
                                        className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold text-slate-700"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Email Content Preview - DIRECT EDITABLE */}
                            <div className="flex-1 bg-slate-100 p-6 overflow-hidden flex flex-col relative group">
                                <div className="mb-2 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Body (Click to edit text directly)</span>
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors bg-white rounded-md border border-slate-200"
                                    >
                                        <HiOutlineArrowPathRoundedSquare size={12} /> Reset to Default
                                    </button>
                                </div>
                                <div className="flex-1 border border-slate-200 rounded-2xl overflow-y-auto bg-white shadow-sm ring-1 ring-black/5 p-8 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    ref={contentRef}
                                    contentEditable={true}
                                    suppressContentEditableWarning={true}
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                />
                            </div>
                        </div>
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
