import Link from 'next/link';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineWrench,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
  HiOutlineAcademicCap
} from 'react-icons/hi2';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-8 md:p-24 font-sans text-slate-900 relative overflow-hidden">

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl w-full flex flex-col gap-24 relative z-10">

        {/* High-Impact Editorial Header */}
        <div className="group relative flex flex-col items-start pt-12 md:pt-20">

          {/* Massive Background Logo Watermark */}
          <div className="absolute top-8 md:-top-40 -left-12 md:-left-24 w-[120%] md:w-[120%] opacity-[0.03] pointer-events-none select-none transition-all duration-700 group-hover:opacity-[0.06] group-hover:-translate-y-4">
            <img
              src="/thriveny_logo.svg"
              alt=""
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="relative z-10 flex flex-col items-start">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-1.5 h-16 md:h-24 bg-thriveni-blue rounded-full transition-transform duration-500 group-hover:scale-y-110" />
              <div className="flex flex-col transition-transform duration-500 group-hover:translate-x-2">
                <span className="text-thriveni-blue font-black text-xs md:text-sm uppercase tracking-[0.6em] mb-2">Excellence in Learning</span>
                <span className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-[0.3em]">Internal Tool</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-8xl md:text-[10rem] font-black tracking-tighter text-slate-900 uppercase leading-[0.75] mb-8 select-none transition-transform duration-500 group-hover:translate-x-4">
              Training <br />
              <span className="text-thriveni-blue">Thriveni</span>
            </h1>

            <p className="max-w-2xl text-xl md:text-3xl text-slate-500 font-medium leading-relaxed italic border-l-4 border-slate-100 pl-8 ml-2">
              Select your designated workspace based on your role to <br className="hidden md:block" />
              manage professional growth, oversee operations, and drive excellence.
            </p>
          </div>
        </div>

        {/* Editorial Collage Layout */}
        <div className="flex flex-col gap-24 md:gap-40 w-full pt-12">

          {/* Hub 1: Employee Portal */}
          <Link href="/user-hub" className="group relative flex flex-col md:flex-row items-start md:items-end gap-8 md:gap-16">
            <div className="absolute -top-12 md:-top-24 -left-6 md:-left-12 text-[10rem] md:text-[20rem] font-black text-orange-500/5 select-none transition-all duration-700 group-hover:text-orange-500/10 group-hover:-translate-y-4">
              01
            </div>
            <div className="relative z-10 flex-1">
              <span className="text-orange-600 font-black text-sm uppercase tracking-[0.4em] mb-4 block">General Access</span>
              <h2 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase transition-transform duration-500 group-hover:translate-x-4">
                Employee <br />
                <span className="text-orange-600">Portal</span>
              </h2>
            </div>
            <div className="relative z-10 max-w-sm">
              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-8">
                The central hub for TNI nominations and the comprehensive troubleshooting library for technical support.
              </p>
              <div className="inline-flex items-center gap-4 text-orange-600 font-bold uppercase tracking-widest text-sm group-hover:gap-6 transition-all">
                <span>Enter Workspace</span>
                <HiOutlineArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Hub 2: Trainer Hub - Shifted Right */}
          <Link href="/wip" className="group relative flex flex-col md:flex-row-reverse items-start md:items-end gap-8 md:gap-16 self-end text-right md:text-left">
            <div className="absolute -top-12 md:-top-24 -right-6 md:-right-12 text-[10rem] md:text-[20rem] font-black text-emerald-500/5 select-none transition-all duration-700 group-hover:text-emerald-500/10 group-hover:-translate-y-4">
              02
            </div>
            <div className="relative z-10 flex-1 md:text-right">
              <span className="text-emerald-600 font-black text-sm uppercase tracking-[0.4em] mb-4 block">Staff Tools</span>
              <h2 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase transition-transform duration-500 group-hover:-translate-x-4">
                Trainer <br />
                <span className="text-emerald-600">Hub</span>
              </h2>
            </div>
            <div className="relative z-10 max-w-sm md:text-right">
              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-8">
                Specialized dashboard for trainers to manage live sessions, monitor feedback, and analyze performance metrics.
              </p>
              <div className="inline-flex items-center gap-4 text-emerald-600 font-bold uppercase tracking-widest text-sm group-hover:gap-6 transition-all flex-row-reverse md:flex-row">
                <span>Open Dashboard</span>
                <HiOutlineArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* Hub 3: Admin Center */}
          <Link href="/admin" className="group relative flex flex-col md:flex-row items-start md:items-end gap-8 md:gap-16">
            <div className="absolute -top-12 md:-top-24 -left-6 md:-left-12 text-[10rem] md:text-[20rem] font-black text-indigo-500/5 select-none transition-all duration-700 group-hover:text-indigo-500/10 group-hover:-translate-y-4">
              03
            </div>
            <div className="relative z-10 flex-1">
              <span className="text-indigo-600 font-black text-sm uppercase tracking-[0.4em] mb-4 block">System Control</span>
              <h2 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase transition-transform duration-500 group-hover:translate-x-4">
                Admin <br />
                <span className="text-indigo-600">Center</span>
              </h2>
            </div>
            <div className="relative z-10 max-w-sm">
              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-8">
                Global management of departments, master records, bulk communications, and system-wide visibility.
              </p>
              <div className="inline-flex items-center gap-4 text-indigo-600 font-bold uppercase tracking-widest text-sm group-hover:gap-6 transition-all">
                <span>Access Control</span>
                <HiOutlineArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-left pt-6 border-t border-slate-200">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
            Thriveni Earthmovers and Infra pvt ltd &copy; {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  );
}
