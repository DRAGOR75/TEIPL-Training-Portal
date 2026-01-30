
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold text-blue-600">404</span>
                </div>

                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Page Not Found</h2>

                <p className="text-slate-500 text-lg">
                    The page you are looking for doesn't exist or has been moved.
                </p>

                <div className="pt-4">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                    >
                        <Home className="w-4 h-4" />
                        Return to Dashboard
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-slate-400 text-sm">
                Thriveni Training Management System
            </div>
        </div>
    );
}
