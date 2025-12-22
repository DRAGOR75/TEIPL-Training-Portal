import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-green-100">

                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} strokeWidth={3} />
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">Feedback Submitted!</h1>
                <p className="text-slate-600 mb-8">
                    Thank you for rating the training program. Your feedback helps us improve future sessions.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500 mb-6">
                    Your manager has been notified to validate your effectiveness rating.
                </div>

                <Link href="/" className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                    Return to Home
                </Link>


            </div>
        </div>
    );
}