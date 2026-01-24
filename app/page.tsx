import Link from 'next/link';
import { ClipboardList, BarChart3, ChevronRight, ShieldCheck, Wrench, ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 md:p-12 font-sans text-slate-900">

      {/* Main Container */}
      <div className="max-w-6xl w-full flex flex-col gap-12">

        {/* Minimal Header */}
        <div className="flex flex-col items-start space-y-4">
          <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold tracking-widest uppercase text-blue-600">
            Internal Portal
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900">
            Training <span className="text-blue-600">Thriveni</span>
          </h1>

          <p className="max-w-xl text-lg text-slate-500 font-medium leading-relaxed">
            Select a workspace to manage employee development and operations.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-auto">

          {/* Card 1: TNI (Wide - Spans 2 Columns) */}
          <Link href="/tni" className="group md:col-span-2 relative overflow-hidden">
            <div className="h-full bg-white rounded-[2.5rem] p-8 border border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">

              <div className="flex flex-col justify-between h-full space-y-6 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList size={28} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                    TNI Hub
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                    Comprehensive Training Needs Identification. Process nominations and plan batches efficiently.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm tracking-wide uppercase group-hover:gap-3 transition-all">
                  <span>Open System</span>
                  <ArrowRight size={16} />
                </div>
              </div>

              {/* Decorative side illustration for wide card */}
              <div className="hidden md:flex h-full w-1/3 bg-blue-50/50 rounded-2xl border border-blue-100/50 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)]" />
                <div className="w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-60 absolute" />
                <ClipboardList className="text-blue-200 w-32 h-32 relative z-10 opacity-50 rotate-12" />
              </div>

            </div>
          </Link>

          {/* Card 2: Feedback (Tall/Standard - Spans 1 Column) */}
          <Link href="/admin/dashboard" className="group md:col-span-1 relative overflow-hidden">
            <div className="h-full bg-white rounded-[2.5rem] p-8 border border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 hover:border-indigo-200 flex flex-col justify-between relative z-10 min-h-[320px]">

              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 size={28} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                    Feedback
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm">
                    Analyze training metrics and reports.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                <span className="text-indigo-600 font-bold text-sm uppercase">Admin</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:rotate-45 transition-transform">
                  <ArrowRight size={14} className="text-indigo-600" />
                </div>
              </div>

            </div>
          </Link>

          {/* Card 3: Troubleshooting (Full Width - Spans 3 Columns) */}
          <Link href="/troubleshoot" className="group md:col-span-3 relative overflow-hidden">
            <div className="h-full bg-slate-900 lg:bg-white rounded-[2.5rem] p-8 border border-transparent lg:border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-red-900/10 hover:-translate-y-1 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">

              {/* Specialized Dark Style for Mobile, Light for Desktop with Accent */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-white opacity-0 lg:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-slate-900 lg:bg-transparent lg:hidden" />

              <div className="flex items-center gap-6 relative z-10 w-full">
                <div className="w-14 h-14 rounded-2xl bg-white/10 lg:bg-red-50 text-white lg:text-red-600 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                  <Wrench size={28} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold tracking-tight text-white lg:text-slate-900 mb-1">
                    Troubleshooting Center
                  </h2>
                  <p className="text-slate-300 lg:text-slate-500 font-medium text-sm">
                    Access diagnostic tools and operational guides.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10 px-6 py-3 bg-white/10 lg:bg-white rounded-xl border border-white/5 lg:border-slate-100 text-white lg:text-slate-700 font-bold text-sm tracking-wide uppercase transition-colors group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 self-stretch md:self-auto justify-center">
                <span>Diagnose</span>
                <ChevronRight size={16} />
              </div>

            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-left pt-4 border-t border-slate-200">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
            Thriveni Earthmovers and Infra pvt ltd &copy; {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  );
}