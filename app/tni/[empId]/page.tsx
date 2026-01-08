import { getEmployeeProfile } from '@/app/actions/tni';
import Link from 'next/link';
import TNIProfile from '@/components/TNIProfile';

export default async function TNIDashboardPage({ params }: { params: Promise<{ empId: string }> }) {
    const { empId } = await params;
    const { employee, sections } = await getEmployeeProfile(empId);

    // If employee doesn't exist, we might want to show a "Create Profile" UI.
    // For now, let's assume if it returns null, we show basic "Not Found" or "New User"

    if (!employee) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
                <div className="max-w-2xl w-full bg-white p-8 rounded shadow text-center">
                    <h1 className="text-2xl font-bold mb-4">Employee ID: {empId} Not Found</h1>
                    <p className="mb-6 text-slate-600">This ID does not exist in our system yet.</p>
                    <Link href="/tni" className="text-blue-600 hover:underline">Go Back</Link>
                    {/* We'll implement creating a new ONE in the next step/iteration if needed */}
                </div>
            </div>
        );
    }

    const nominations = employee.nominations || [];

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Training Portal</h1>
                        <p className="text-slate-400">Welcome, {employee.name}</p>
                    </div>
                    <Link href="/tni" className="text-sm text-slate-400 hover:text-slate-200">Sign Out</Link>
                </div>

                {/* Profile Section (Interactive) */}
                <TNIProfile employee={employee} sections={sections} />

                {/* Existing TNI Table */}
                <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-slate-800">My Nominations (TNI)</h2>

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
                                            No nominations found for this year.
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
