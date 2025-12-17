import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { updateStatus } from '@/app/actions/nominations';

// 🟢 1. Update the interface to use Promise
interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ManagerApprovalPage({ params }: PageProps) {
    // 🟢 2. Await the params before using them
    const { id } = await params;

    // 3. Fetch data using the awaited ID
    const nomination = await db.nomination.findUnique({
        where: {
            id: id,
        },
    });

    if (!nomination) {
        return notFound();
    }

    const getStatusColor = (status: string) => {
        if (status === 'APPROVED') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'REJECTED') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    };

    return (
        <main className="min-h-screen bg-gray-100 py-10 px-4 flex items-center justify-center">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* Header */}
                <div className="bg-slate-800 p-8 text-white">
                    <h1 className="text-2xl font-bold">Nomination Approval Request</h1>
                    <p className="opacity-80">Review details for {nomination.employeeName}</p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Status Badge */}
                    <div className={`p-4 rounded-lg border text-center font-bold ${getStatusColor(nomination.status)}`}>
                        Current Status: {nomination.status}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-6 text-sm">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <label className="block text-gray-500 font-bold mb-1">Nominee Details</label>
                            <p className="text-lg text-gray-800">{nomination.employeeName} ({nomination.empId})</p>
                            <p className="text-gray-600">{nomination.designation} - {nomination.site}</p>
                            <p className="text-gray-600 mt-1">Email: {nomination.employeeEmail}</p>
                            <p className="text-gray-600">Mobile: {nomination.mobile}</p>
                            <p className="text-gray-600">Experience: {nomination.experience}</p>
                        </div>
                    </div>

                    {/* Justification Box */}
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                        <label className="block text-blue-800 font-bold mb-2">Reason for Nomination:</label>
                        <p className="text-gray-700 leading-relaxed italic">"{nomination.justification}"</p>
                    </div>

                    {/* Action Buttons - Only show if PENDING */}
                    {nomination.status === 'PENDING' && (
                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            {/* Approve Button */}
                            <form action={updateStatus} className="flex-1">
                                <input type="hidden" name="id" value={nomination.id} />
                                <input type="hidden" name="action" value="APPROVED" />
                                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition">
                                    ✅ Approve
                                </button>
                            </form>

                            {/* Reject Button */}
                            <form action={updateStatus} className="flex-1">
                                <input type="hidden" name="id" value={nomination.id} />
                                <input type="hidden" name="action" value="REJECTED" />
                                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition">
                                    ❌ Reject
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}