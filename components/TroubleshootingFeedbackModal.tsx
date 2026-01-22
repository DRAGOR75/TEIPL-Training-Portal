'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Send, CheckCircle2, X } from 'lucide-react';
import { submitFeedback, FeedbackState } from '@/app/actions/feedback';

interface TroubleshootingFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TroubleshootingFeedbackModal({ isOpen, onClose }: TroubleshootingFeedbackModalProps) {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<FeedbackState>({
        rating: 0,
        isHelpful: null,
        comments: '',
        name: '',
        mobile: '',
        email: ''
    });

    const handleRating = (rating: number) => {
        setForm(prev => ({ ...prev, rating }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await submitFeedback(form);

        if (result.success) {
            setSubmitted(true);
        } else {
            setError(result.error || 'Something went wrong.');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {submitted ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Thank You!</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Your feedback has been recorded. We appreciate you helping us improve our troubleshooting guide.
                        </p>
                        <button
                            onClick={onClose}
                            className="block w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900">Your Feedback</h2>
                            <p className="text-slate-500 text-sm">Help us improve the experience</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 1. Usefulness */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-900 tracking-wide text-center">
                                    Was this helpful?
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, isHelpful: true }))}
                                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${form.isHelpful === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <ThumbsUp size={20} className={form.isHelpful === true ? 'fill-current' : ''} />
                                        <span className="font-bold text-xs">Yes</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, isHelpful: false }))}
                                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${form.isHelpful === false ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <ThumbsDown size={20} className={form.isHelpful === false ? 'fill-current' : ''} />
                                        <span className="font-bold text-xs">No</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Star Rating */}
                            <div className="text-center space-y-3">
                                <label className="block text-sm font-bold text-slate-900 tracking-wide">
                                    Rate Experience
                                </label>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleRating(star)}
                                            className="group p-1 focus:outline-none transition-transform active:scale-90"
                                        >
                                            <Star
                                                size={32}
                                                className={`transition-colors ${star <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 group-hover:text-amber-200'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Comments */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 tracking-wide">
                                    Comments (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Tell us what we can improve..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium"
                                    value={form.comments}
                                    onChange={(e) => setForm(prev => ({ ...prev, comments: e.target.value }))}
                                />
                            </div>

                            {/* 4. Contact Details */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 tracking-wide mb-2">Your Details</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Full Name *"
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 transition-all font-medium"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number *"
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 transition-all font-medium"
                                        value={form.mobile}
                                        onChange={(e) => setForm(prev => ({ ...prev, mobile: e.target.value }))}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 transition-all font-medium"
                                        value={form.email}
                                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-bold text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-200 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                            >
                                {loading ? 'Submitting...' : (
                                    <>
                                        <span>Submit Feedback</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
