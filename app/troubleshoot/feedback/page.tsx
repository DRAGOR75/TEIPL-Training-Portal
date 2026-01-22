'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ThumbsUp, ThumbsDown, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { submitFeedback, FeedbackState } from '@/app/actions/feedback';
import Link from 'next/link';

export default function FeedbackPage() {
    const router = useRouter();
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

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-sm border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Thank You!</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Your feedback has been recorded. We appreciate you helping us improve our troubleshooting guide.
                    </p>
                    <Link
                        href="/troubleshoot"
                        className="block w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Back to Troubleshooting
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 md:py-12">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/troubleshoot" className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Your Feedback</h1>
                        <p className="text-slate-500 text-sm">Help us improve the experience</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. Usefulness */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-900  tracking-wide mb-4">
                            Was the information useful in your troubleshooting experience during your visit?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, isHelpful: true }))}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${form.isHelpful === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <ThumbsUp size={24} className={form.isHelpful === true ? 'fill-current' : ''} />
                                <span className="font-bold text-sm">Yes, it helped</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, isHelpful: false }))}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${form.isHelpful === false ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <ThumbsDown size={24} className={form.isHelpful === false ? 'fill-current' : ''} />
                                <span className="font-bold text-sm">No, it didn't</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Star Rating */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                        <label className="block text-sm font-bold text-slate-900  tracking-wide mb-4">
                            Help us improve by rating your experience
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
                        <p className="mt-2 text-sm font-medium text-slate-400 h-5">
                            {form.rating === 1 && "Poor"}
                            {form.rating === 2 && "Fair"}
                            {form.rating === 3 && "Good"}
                            {form.rating === 4 && "Very Good"}
                            {form.rating === 5 && "Excellent"}
                        </p>
                    </div>

                    {/* 3. Comments */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-900  tracking-wide mb-3">
                            Comments (Optional)
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Tell us more about your experience..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-medium"
                            value={form.comments}
                            onChange={(e) => setForm(prev => ({ ...prev, comments: e.target.value }))}
                        />
                    </div>

                    {/* 4. Contact Details */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900  tracking-wide mb-4">Your Details</h3>
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Full Name *"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <input
                                    type="tel"
                                    placeholder="Mobile Number *"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                    value={form.mobile}
                                    onChange={(e) => setForm(prev => ({ ...prev, mobile: e.target.value }))}
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email Address"

                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold text-center animate-in fade-in slide-in-from-bottom-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-200 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                    >
                        {loading ? 'Submitting...' : (
                            <>
                                <span>Submit Feedback</span>
                                <Send size={20} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
