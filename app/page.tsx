import Link from 'next/link';
import { ClipboardList, BarChart3, ChevronRight, ShieldCheck, Wrench, ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 md:p-12 font-sans text-slate-900">

      {/* Main Container */}
      <div className="max-w-6xl w-full flex flex-col gap-12">

        {/* Minimal Header */}
        <div className="flex flex-col items-start space-y-4">


          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-slate-900">
            Training <span className="text-thriveni-blue">Thriveni</span>
          </h1>

          <p className="max-w-xl text-lg text-slate-500 font-medium leading-relaxed">
            Select a workspace to manage employee development and operations.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 w-full h-auto">

          {/* Card 1: TNI (Wide - Spans 1 Column on Mobile, 2 on Desktop) */}
          <Link href="/tni" className="group col-span-1 md:col-span-2 relative overflow-hidden">
            <div className="h-full bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 relative z-10">

              <div className="flex flex-col justify-between h-full space-y-3 md:space-y-6 flex-1">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg md:text-3xl font-bold tracking-tight text-slate-900 mb-1 md:mb-2 group-hover:text-blue-700 transition-colors">
                    TNI Hub
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-sm text-xs md:text-base line-clamp-2 md:line-clamp-none">
                    Comprehensive Training Needs Identification. Process nominations and plan batches efficiently.
                  </p>
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-blue-600 font-bold text-xs md:text-sm tracking-wide uppercase group-hover:gap-2 md:group-hover:gap-3 transition-all">
                  <span>Open System</span>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
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
          <Link href="/admin/dashboard" className="group col-span-1 relative overflow-hidden">
            <div className="h-full bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 hover:border-indigo-200 flex flex-col justify-between relative z-10 min-h-[180px] md:min-h-[320px]">

              <div className="space-y-3 md:space-y-6">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 mb-1 md:mb-2 group-hover:text-indigo-700 transition-colors">
                    Feedback
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed text-xs md:text-sm line-clamp-2 md:line-clamp-none">
                    Analyze training metrics and reports.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 md:pt-6 md:mt-8 border-t border-slate-50">
                <span className="text-indigo-600 font-bold text-xs md:text-sm uppercase">Admin</span>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:rotate-45 transition-transform">
                  <ArrowRight className="w-3 h-3 md:w-[14px] md:h-[14px] text-indigo-600" />
                </div>
              </div>

            </div>
          </Link>

          {/* Card 3: Troubleshooting (Full Width - Spans 2 Columns on Mobile, 3 on Desktop) */}
          <Link href="/troubleshoot" className="group col-span-2 md:col-span-3 relative overflow-hidden">
            <div className="h-full bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-red-900/10 hover:-translate-y-1 relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 overflow-hidden">

              {/* Specialized Gradient for both Mobile and Desktop */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-white opacity-100 transition-opacity" />

              <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                  <Wrench className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 mb-0.5 md:mb-1">
                    Troubleshooting Center
                  </h2>
                  <p className="text-slate-500 font-medium text-xs md:text-sm">
                    Access diagnostic tools and operational guides.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 relative z-10 px-4 py-2 md:px-6 md:py-3 bg-white rounded-xl border border-slate-100 text-slate-700 font-bold text-xs md:text-sm tracking-wide uppercase transition-colors group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 self-stretch md:self-auto justify-center">
                <span>Diagnose</span>
                <ChevronRight className="w-4 h-4 md:w-4 md:h-4" />
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
