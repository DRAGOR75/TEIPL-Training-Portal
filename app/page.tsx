import Link from 'next/link';
import Image from 'next/image';
import { ClipboardList, BarChart3, ChevronRight, GraduationCap, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans">

      {/* Main Container */}
      <div className="max-w-4xl w-full space-y-8 md:space-y-12">

        {/* Logo Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 w-full mb-4">
          {/* Add your Image components back here if needed */}
          <div className="h-10 w-48 bg-slate-200 animate-pulse rounded md:block hidden" /> {/* Placeholder for Logos */}
          <div className="h-10 w-48 bg-slate-200 animate-pulse rounded md:block hidden" />
        </div>

        {/* Header Section */}
        <div className="text-center space-y-4">

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
            Thriveni Training <span className="text-blue-700">Portal</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto font-bold leading-snug">
            Centralized hub for employee growth. Select a system to manage training requirements and performance.
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

          {/* Card 1: Nominations */}
          <Link
            href="/tni"
            className="group relative bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-blue-600 transition-all duration-500 overflow-hidden"
          >
            {/* Visual Flair */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                <ClipboardList size={32} strokeWidth={2.5} />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Nominations
              </h2>
              <p className="text-slate-600 font-bold text-sm leading-relaxed mb-6">
                Submit new training requests, track employee eligibility, and manage the approval workflow for upcoming programs.
              </p>

              <div className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-widest">
                Access System <ChevronRight size={16} />
              </div>
            </div>
          </Link>

          {/* Card 2: Feedback Hub */}
          <Link
            href="/admin/dashboard"
            className="group relative bg-white rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-indigo-600 transition-all duration-500 overflow-hidden"
          >
            {/* Visual Flair */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-indigo-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 group-hover:-rotate-6 transition-transform">
                <BarChart3 size={32} strokeWidth={2.5} />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                Feedback Hub
              </h2>
              <p className="text-slate-600 font-bold text-sm leading-relaxed mb-6">
                Review training effectiveness and trigger automated email assessments.
              </p>

              <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest">
                Admin Portal <ShieldCheck size={16} />
              </div>
            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t-2 border-slate-200">
          <p className="text-slate-900 font-black text-xs md:text-sm tracking-widest uppercase">
            Thriveni Earthmovers And Infra Pvt. Ltd.
          </p>
          <p className="text-slate-500 font-bold text-[10px] md:text-xs mt-1 uppercase tracking-[0.2em]">
            Training Department
          </p>
        </div>

      </div>
    </div>
  );
}