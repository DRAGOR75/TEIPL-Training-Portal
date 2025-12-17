import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">

      {/* Main Container */}
      <div className="max-w-4xl w-full space-y-12">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Thriveni Training Portal
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Welcome to the centralized hub for employee development.
            Select an option below to get started.
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Card 1: Nominations */}
          <Link
            href="/nominations"
            className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-blue-500 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <span className="text-3xl group-hover:text-white transition-colors">📝</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
              Nomintion System
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Manage and View Nominations .
            </p>
          </Link>

          {/* Card 2: Admin / Feedback Portal (NOW CLICKABLE) */}
          <Link
            href="/admin/dashboard"
            className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500 transition-all duration-300"
          >
            {/* Added an Indigo top border on hover to distinguish it from Nominations */}
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <span className="text-3xl group-hover:text-white transition-colors">📊</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
              Feedback System
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Admin Access Only. Manage training calendars, trigger feedback emails, and review reports.
            </p>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center pt-8 text-slate-400 text-sm">
          Thriveni Earthmovers Pvt. Ltd. | Internal Tool
        </div>

      </div>
    </div>
  );
}