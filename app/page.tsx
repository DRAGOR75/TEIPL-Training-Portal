import Link from 'next/link';
import { ClipboardList, BarChart3, ChevronRight, ShieldCheck, Wrench, ArrowRight, Zap, User } from 'lucide-react';

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full h-auto">

          {/* Card 1: TNI (Wide - Spans 1 Column on Mobile, 2 on Desktop) - Blue Theme */}
          <Link href="/tni" className="group col-span-1 md:col-span-2 relative overflow-hidden">
            <div className="h-full bg-blue-50/50 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-blue-100 transition-all duration-500 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 relative z-10">

              <div className="flex flex-col justify-between h-full space-y-4 md:space-y-6 flex-1">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <ClipboardList className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                    TNI Hub
                  </h2>
                  <p className="text-slate-600 font-medium leading-relaxed max-w-sm text-sm md:text-base line-clamp-3 md:line-clamp-none">
                    Comprehensive Training Needs Identification. Process nominations and plan batches efficiently.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs md:text-sm tracking-wide uppercase group-hover:gap-3 transition-all">
                  <span>Open System</span>
                  <ArrowRight className="w-4 h-4" />
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

          {/* Card 2: Feedback (Tall/Standard - Spans 1 Column) - Indigo Theme */}
          <Link href="/admin/dashboard" className="group col-span-1 relative overflow-hidden">
            <div className="h-full bg-indigo-50/50 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-indigo-100 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 hover:border-indigo-200 flex flex-col justify-between relative z-10 min-h-[220px] md:min-h-[320px]">

              <div className="space-y-4 md:space-y-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <BarChart3 className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">
                    Feedback
                  </h2>
                  <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-sm line-clamp-3 md:line-clamp-none">
                    Analyze training metrics and reports.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-indigo-100">
                <span className="text-indigo-700 font-bold text-xs md:text-sm uppercase">Admin</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:rotate-45 transition-transform shadow-sm">
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </div>
              </div>

            </div>
          </Link>

          {/* Card 3: Troubleshooting (Compact - Spans 1 Column) - Red Theme */}
          <Link href="/troubleshoot" className="group col-span-1 relative overflow-hidden">
            <div className="h-full bg-red-50/50 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-red-100 transition-all duration-500 hover:shadow-xl hover:shadow-red-900/10 hover:-translate-y-1 hover:border-red-200 flex flex-col justify-between relative z-10 min-h-[220px] md:min-h-[320px]">

              <div className="space-y-4 md:space-y-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Wrench className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-red-700 transition-colors">
                    Troubleshoot
                  </h2>
                  <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-sm line-clamp-3 md:line-clamp-none">
                    Diagnostic tools & guides.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-red-100">
                <span className="text-red-700 font-bold text-xs md:text-sm uppercase">Support</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:rotate-45 transition-transform shadow-sm">
                  <ArrowRight className="w-4 h-4 text-red-600" />
                </div>
              </div>

            </div>
          </Link>

          {/* Card 4: Training Sessions (Wide - Spans 2 Columns) - Emerald Theme */}
          <Link href="/admin/sessions" className="group col-span-1 md:col-span-2 relative overflow-hidden">
            <div className="h-full bg-emerald-50/50 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 border border-emerald-100 transition-all duration-500 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 hover:border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 relative z-10">

              {/* Decorative Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-white opacity-0 md:opacity-100 transition-opacity" />

              <div className="flex flex-col justify-between h-full space-y-4 md:space-y-6 flex-1 relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <User className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    Training Sessions
                  </h2>
                  <p className="text-slate-600 font-medium leading-relaxed max-w-sm text-sm md:text-base line-clamp-3 md:line-clamp-none">
                    Manage sessions, Batches, and direct QR Enrollments.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs md:text-sm tracking-wide uppercase group-hover:gap-3 transition-all">
                  <span>Manage</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Decorative side illustration for wide card */}
              <div className="hidden md:flex h-full w-1/3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)]" />
                <div className="w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-60 absolute" />
                <Zap className="text-emerald-200 w-32 h-32 relative z-10 opacity-50 -rotate-12" />
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
