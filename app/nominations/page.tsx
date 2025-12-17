import Link from 'next/link';

export default function NominationDashboard() {
    return (
        <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">

            {/* Header Section */}
            <div className="text-center mb-12 space-y-2">
                <h1 className="text-4xl font-extrabold text-slate-900">Nomination Portal</h1>
                <p className="text-slate-500 text-lg">Centralized Rewards & Recognition System</p>

                {/* Back Link */}
                <Link href="/" className="inline-block text-sm text-blue-600 hover:underline mt-2">
                    &larr; Back to Main Portal
                </Link>
            </div>

            {/* The Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">

                {/* Button 1: Create New Nomination */}
                <Link
                    href="/create-nomination"
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-500 transition-all duration-300 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                >
                    <div className="bg-blue-50 p-6 rounded-full mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                        {/* Icon for Create */}
                        <span className="text-4xl group-hover:text-white transition-colors">📝</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Nomination</h2>
                    <p className="text-slate-500">Submit a new nomination for an employee.</p>
                </Link>

                {/* Button 2: Edit / View Previous */}
                <Link
                    href="/my-nominations"
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-green-500 transition-all duration-300 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
                >
                    <div className="bg-green-50 p-6 rounded-full mb-6 group-hover:bg-green-600 transition-colors duration-300">
                        {/* Icon for Edit */}
                        <span className="text-4xl group-hover:text-white transition-colors">🔍</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Track & Edit</h2>
                    <p className="text-slate-500">View your history, check status, or edit pending nominations.</p>
                </Link>

            </div>

            <div className="mt-12 text-slate-400 text-sm">
                Thriveni Earthmovers Pvt. Ltd. | Internal Tool
            </div>
        </main>
    );
}