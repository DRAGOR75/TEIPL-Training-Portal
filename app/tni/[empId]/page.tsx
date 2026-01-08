import { getEmployeeProfile } from '@/app/actions/tni';
import Link from 'next/link';
import TNIProfile from '@/components/TNIProfile';

export default async function TNIDashboardPage({ params }: { params: Promise<{ empId: string }> }) {
    const { empId } = await params;
    const { employee, sections } = await getEmployeeProfile(empId);

    // If employee doesn't exist, we might want to show a "Create Profile" UI.
    // For now, let's assume if it returns null, we show basic "Not Found" or "New User"

    // 🟢 CREATE BLANK PROFILE FOR FRESH START
    const currentEmployee = employee || {
        id: empId,
        name: '',
        email: '',
        grade: '',
        sectionName: '',
        location: '',
        manager_name: '',
        manager_email: '',
        nominations: []
    };

    const nominations = currentEmployee.nominations || [];

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Training Portal</h1>
                        <p className="text-slate-400">
                            {currentEmployee.name ? `Welcome, ${currentEmployee.name}` : `Setup Profile for ID: ${empId}`}
                        </p>
                    </div>
                    <Link href="/tni" className="text-sm text-slate-400 hover:text-slate-200">Sign Out</Link>
                </div>

                {/* Profile Section (Interactive) */}
                <TNIProfile employee={currentEmployee} sections={sections} />

                {/* 🟢 LOOKER STUDIO EMBED (PAST RECORDS) */}
                <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-semibold text-slate-800">Training History (Past Records)</h2>
                        <p className="text-sm text-slate-500">View your historical training data below.</p>
                    </div>
                    <div className="w-full h-[600px] bg-slate-50 flex items-center justify-center">
                        <iframe
                            src="https://lookerstudio.google.com/embed/reporting/dbba1f2c-4ff6-4bda-b1ab-f7f96f0a9f90/page/zpm1D"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        ></iframe>
                    </div>
                </div>

                {/* Existing TNI Table */}
                <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-slate-800">Current Nominations (Fresh Start)</h2>

                        {/* Start New Nomination Button */}
                        <Link href={`/tni/${empId}/new`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors">
                            + Submit New TNI
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold text-sm uppercase">
                                <tr>
                                    <th className="p-4">Program Name</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Submitted On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {nominations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">
                                            No recent nominations found. Click "Submit New TNI" to start.
                                        </td>
                                    </tr>
                                ) : (
                                    nominations.map((nom: any) => (
                                        <tr key={nom.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-900">{nom.program?.name || 'Unknown Program'}</td>
                                            <td className="p-4 text-slate-600">{nom.program?.category}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${nom.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    nom.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {nom.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {new Date(nom.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
