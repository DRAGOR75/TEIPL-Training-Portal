import Link from 'next/link';
import { Construction, ArrowLeft } from 'lucide-react';

export default function WorkInProgressPage() {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-lg w-full border border-slate-200">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Construction size={40} />
                </div>

                <h1 className="text-3xl font-black text-slate-900 mb-4">
                    Work in Progress
                </h1>

                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    We are currently building the Nominations Management System to serve you better. Please check back soon!
                </p>

                <div className="space-y-4">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-300 transform hover:-translate-y-0.5"
                    >
                        <ArrowLeft size={18} /> Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
