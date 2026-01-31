import { db } from '@/lib/prisma';
import { updateNominationStatus } from '@/app/actions/tni';
import { HiOutlineCheck, HiOutlineXMark, HiOutlineShieldExclamation, HiOutlineTrophy, HiOutlineUser, HiOutlineChatBubbleBottomCenterText } from 'react-icons/hi2';
import { notFound } from 'next/navigation';

// Server Component for Manager Approval
export default async function ManagerApprovalPage({ params }: { params: Promise<{ empId: string }> }) {
    const { empId } = await params;

    // Fetch pending nominations for this employee
    const employee = await db.employee.findUnique({
        where: { id: empId },
        include: {
            nominations: {
                where: { status: 'Pending' },
                include: { program: true }
            }
        }
    });

    if (!employee) {
        return notFound();
    }

    const nominations = employee.nominations;
    const justification = nominations.length > 0 ? nominations[0].justification : '';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12 font-sans">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">

                {/* Header Section */}
                <div className="bg-indigo-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <HiOutlineTrophy className="text-yellow-400" size={28} />
                                <h1 className="text-2xl font-bold tracking-tight">Nomination Approval</h1>
                            </div>
                            <p className="text-indigo-200 text-sm">Reviewing training requests for</p>
                            <h2 className="text-3xl font-bold text-white mt-1">{employee.name}</h2>
                            <div className="flex items-center gap-2 mt-2 text-indigo-300 text-sm">
                                <HiOutlineUser size={14} />
                                <span>{employee.id}</span>
                            </div>
                        </div>

                        <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{nominations.length}</div>
                                <div className="text-xs uppercase tracking-wider text-indigo-300 font-bold">Pending Requests</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Justification Section */}
                    {justification && (
                        <div className="mb-8 relative">
                            <div className="absolute -left-2 -top-2 text-slate-200">
                                <HiOutlineChatBubbleBottomCenterText size={40} />
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative z-10">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    Employee's Justification
                                </h3>
                                <p className="text-slate-700 text-lg italic leading-relaxed">"{justification}"</p>
                            </div>
                        </div>
                    )}

                    {/* Nominations List */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">
                            Requested Training Programs
                        </h3>

                        {nominations.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-70">
                                <div className="bg-slate-100 p-4 rounded-full mb-4">
                                    <HiOutlineShieldExclamation className="text-slate-400" size={32} />
                                </div>
                                <h4 className="text-slate-900 font-medium text-lg">All caught up!</h4>
                                <p className="text-slate-500">No pending nominations found for this employee.</p>
                            </div>
                        ) : (
                            nominations.map((nomination) => (
                                <div key={nomination.id} className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                            <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                                {nomination.program.name}
                                            </h4>
                                        </div>
                                        <div className="ml-5 mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                                                Status: {nomination.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pl-5 md:pl-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                                        <form action={async () => {
                                            'use server';
                                            await updateNominationStatus(nomination.id, 'Rejected');
                                        }}>
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 font-bold text-sm transition-all focus:ring-2 focus:ring-red-200 focus:outline-none"
                                            >
                                                <HiOutlineXMark size={16} strokeWidth={3} />
                                                Reject
                                            </button>
                                        </form>

                                        <form action={async () => {
                                            'use server';
                                            await updateNominationStatus(nomination.id, 'Approved');
                                        }}>
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm transition-all shadow-md hover:shadow-lg shadow-indigo-600/20 active:scale-95 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                                            >
                                                <HiOutlineCheck size={16} strokeWidth={3} />
                                                Approve
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Thriveni Training Management System • Secure Approval Portal</p>
                </div>
            </div>
        </div>
    );
}
