import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans">

      {/* Main Container */}
      <div className="max-w-4xl w-full space-y-8 md:space-y-12">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Thriveni Training Portal
          </h1>
          <p className="text-base md:text-lg text-slate-700 max-w-2xl mx-auto font-medium">
            Welcome to the centralized hub for employee development.
            Select an option below to get started.
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

          {/* Card 1: Nominations */}
          <Link
            href="/nominations"
            className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-blue-600 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <span className="text-3xl group-hover:scale-110 transition-transform">📝</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
              Nominations
            </h2>
            <p className="text-slate-700 font-medium leading-relaxed">
              Submit new training requests, manage approvals, and view upcoming program nominations.
            </p>
          </Link>

          {/* Card 2: Admin / Feedback Portal */}
          <Link
            href="/admin/dashboard"
            className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-600 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <span className="text-3xl group-hover:scale-110 transition-transform">📊</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">
              Feedback Hub
            </h2>
            <p className="text-slate-700 font-medium leading-relaxed">
              <span className="text-indigo-700 font-bold underline">Admin Access Only.</span> Manage training calendars, trigger feedback emails, and review performance reports.
            </p>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-200">
          <p className="text-slate-600 font-bold text-xs md:text-sm tracking-wider uppercase">
            Thriveni Earthmovers And Infra Pvt. Ltd.
          </p>
          <p className="text-slate-500 text-[10px] md:text-xs mt-1 uppercase tracking-widest">
            Training Department
          </p>
        </div>

      </div>
    </div>
  );
}