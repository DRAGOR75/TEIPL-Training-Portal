import Link from 'next/link';
import { FilePlus, Search, Trophy, ArrowLeft, ClipboardCheck } from 'lucide-react';

export default function NominationDashboard() {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
            {/* Header / Navbar Replacement for consistent view */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <ClipboardCheck size={20} className="text-blue-700" />
                            Nomination Portal
                        </h1>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8">
                {/* Intro / Section Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Choose an Action</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage new and view existing nominations.</p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Create Session-Style Card */}
                    <Link
                        href="/create-nomination"
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group flex items-start gap-6"
                    >
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FilePlus size={32} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors mb-2">
                                New Nomination
                            </h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                Submit nomination for an upcoming Training program.
                            </p>
                            <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                Get Started &rarr;
                            </div>
                        </div>
                    </Link>

                    {/* Track/Edit-Style Card */}
                    <Link
                        href="/my-nominations"
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group flex items-start gap-6"
                    >
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Search size={32} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors mb-2">
                                Track & Edit
                            </h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                View your history, check approval status, or update pending nominations.
                            </p>
                            <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                View History &rarr;
                            </div>
                        </div>
                    </Link>

                </div>
            </main>
        </div>
    );
}