import { db } from "@/lib/db";
import { updateNomination } from "@/app/actions/nominations";
import { notFound, redirect } from "next/navigation";

export default async function EditNominationPage({ params }: { params: Promise<{ id: string }> }) {
    // 1. Await params (Next.js 15+ requirement)
    const { id } = await params;

    // 2. Fetch the existing data
    const nomination = await db.nomination.findUnique({
        where: { id }
    });

    if (!nomination) return notFound();

    // 3. Security Check: Lock editing if manager has already acted
    if (nomination.status !== 'Pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md border border-gray-200">
                    <div className="text-5xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Locked</h1>
                    <p className="text-gray-600 mb-6">
                        This nomination has already been processed ({nomination.status}).
                        You cannot edit it anymore.
                    </p>
                    <a href="/my-nominations" className="text-blue-600 hover:underline font-semibold">
                        &larr; Back to My Nominations
                    </a>
                </div>
            </div>
        );
    }

    // 4. Bind the ID to the server action so we know which record to update
    const updateWithId = updateNomination.bind(null, nomination.id);

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">

                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Edit Nomination</h1>
                        <p className="text-indigo-100 text-sm mt-1">Refine the details before manager approval.</p>
                    </div>
                </div>

                <div className="p-8">
                    <form action={updateWithId} className="space-y-6">

                        {/* Section 1: Nominee Info */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Nominee Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                    <input name="nomineeName" defaultValue={nomination.employeeName} className="w-full border p-3 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Emp ID</label>
                                    <input name="empId" defaultValue={nomination.empId} className="w-full border p-3 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Site</label>
                                    <input name="site" defaultValue={nomination.site} className="w-full border p-3 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                                    <input name="designation" defaultValue={nomination.designation} className="w-full border p-3 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile</label>
                                    <input name="mobile" defaultValue={nomination.mobile} className="w-full border p-3 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Experience</label>
                                    <input name="experience" defaultValue={nomination.experience} className="w-full border p-3 rounded-lg" required />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Manager & Program Info */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Training & Manager</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Program Name</label>
                                    <select name="programName" defaultValue={nomination.programName} className="w-full border p-3 rounded-lg">
                                        <option value="Advanced Excel">Advanced Excel</option>
                                        <option value="Leadership Training">Leadership Training</option>
                                        <option value="Safety Compliance">Safety Compliance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Email</label>
                                    <input name="managerEmail" defaultValue={nomination.managerEmail} type="email" className="w-full border p-3 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Name</label>
                                    <input name="managerName" defaultValue={nomination.managerName} className="w-full border p-3 rounded-lg" required />
                                </div>
                            </div>
                        </div>

                        {/* Justification */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Justification</label>
                            <textarea name="justification" defaultValue={nomination.justification} rows={4} className="w-full border p-3 rounded-lg"></textarea>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
                                Save Changes
                            </button>
                            <a href="/my-nominations" className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 text-center transition">
                                Cancel
                            </a>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}