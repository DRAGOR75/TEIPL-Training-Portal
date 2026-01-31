import { getAvailablePrograms, submitTNINomination, getEmployeeProfile } from '@/app/actions/tni';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { HiOutlineBookmarkSquare } from 'react-icons/hi2';
import Link from 'next/link';
import { FormSubmitButton } from '@/components/FormSubmitButton';

export default async function NewNominationPage({ params }: { params: Promise<{ empId: string }> }) {
    const { empId } = await params;
    const { employee } = await getEmployeeProfile(empId);

    // Fetch programs compatible with the employee's grade AND section (for Functional)
    const programs = await getAvailablePrograms(
        employee?.grade || undefined,
        employee?.sectionName || undefined
    );

    if (!employee) {
        return <div className="p-8 text-center text-red-600">Employee Profile Not Found</div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Link href={`/tni/${empId}`} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors font-medium">
                    <HiOutlineArrowLeft size={18} className="mr-2" /> Back to Dashboard
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <h1 className="text-xl font-bold">New Nomination</h1>
                        <p className="text-slate-300 text-sm mt-1">Submit a training request for {employee.name}</p>
                    </div>

                    <div className="p-6 md:p-8">
                        <form action={submitTNINomination} className="space-y-6">
                            <input type="hidden" name="empId" value={empId} />

                            {/* Employee Details (Read Only) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee Name</label>
                                    <div className="font-semibold text-slate-900">{employee.name}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Department</label>
                                    <div className="font-semibold text-slate-900">{employee.sectionName || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Manager</label>
                                    <div className="font-semibold text-slate-900">{employee.managerName || 'Not Assigned'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Manager Email</label>
                                    <div className="font-semibold text-slate-900 text-sm overflow-hidden text-ellipsis">{employee.managerEmail || 'Not Assigned'}</div>
                                </div>
                            </div>

                            {/* Alert if no manager */}
                            {!employee.managerEmail && (
                                <div className="bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-200">
                                    ⚠️ <strong>Warning:</strong> No manager email is linked to your profile. Approvals might be delayed. Please update your profile if possible.
                                </div>
                            )}

                            {/* Program Selection - Broken into Categories */}

                            {/* 1. FOUNDATIONAL */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Foundational Programs
                                </label>
                                <select
                                    name="programId_FOUNDATIONAL"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white text-slate-900"
                                >
                                    <option value="">-- Select Foundational Program --</option>
                                    {programs.filter(p => p.category === 'FOUNDATIONAL').map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. FUNCTIONAL */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Functional Programs
                                </label>
                                <select
                                    name="programId_FUNCTIONAL"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white text-slate-900"
                                >
                                    <option value="">-- Select Functional Program --</option>
                                    {programs.filter(p => p.category === 'FUNCTIONAL').map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. BEHAVIOURAL */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Behavioural Programs
                                </label>
                                <select
                                    name="programId_BEHAVIOURAL"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white text-slate-900"
                                >
                                    <option value="">-- Select Behavioural Program --</option>
                                    {programs.filter(p => p.category === 'BEHAVIOURAL').map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 4. COMMON */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Common Programs
                                </label>
                                <select
                                    name="programId_COMMON"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all bg-white text-slate-900"
                                >
                                    <option value="">-- Select Common Program --</option>
                                    {programs.filter(p => p.category === 'COMMON').map(prog => (
                                        <option key={prog.id} value={prog.id}>{prog.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Justification */}
                            <div className="space-y-2">
                                <label htmlFor="justification" className="block text-sm font-bold text-slate-900">
                                    Justification / Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="justification"
                                    id="justification"
                                    required
                                    placeholder="Explain why this training is needed..."
                                    rows={4}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder-slate-500 text-slate-900"
                                ></textarea>
                            </div>

                            <FormSubmitButton className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <HiOutlineBookmarkSquare size={20} /> Submit Nomination
                            </FormSubmitButton>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
