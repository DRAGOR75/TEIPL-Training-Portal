
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { HiOutlineArrowPath, HiOutlineExclamationTriangle } from 'react-icons/hi2';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error Boundary caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-red-50/50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-red-100">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 anime-bounce">
                    <HiOutlineExclamationTriangle className="w-10 h-10 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Something went wrong!</h2>

                <p className="text-slate-500">
                    An unexpected error occurred. We've been notified and are looking into it.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-slate-100 p-3 rounded text-left overflow-auto max-h-32 text-xs font-mono text-slate-700 border border-slate-200">
                        {error.message}
                    </div>
                )}

                <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={
                            // Attempt to recover by trying to re-render the segment
                            () => reset()
                        }
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
                    >
                        <HiOutlineArrowPath className="w-4 h-4" />
                        Try Again
                    </button>

                    <button
                        onClick={() => window.location.href = '/admin/dashboard'}
                        className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium rounded-lg transition-all hover:shadow-sm"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>

            <div className="mt-8 text-slate-400 text-sm">
                Training Thriveni
            </div>
        </div>
    );
}
