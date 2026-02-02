import { db } from '@/lib/prisma';
import { updateNominationStatus, getManagerApprovalData } from '@/app/actions/tni';
import { HiOutlineShieldExclamation, HiOutlineUser, HiOutlineChatBubbleBottomCenterText, HiClipboard } from 'react-icons/hi2';
import { verifySecureToken } from '@/lib/security';
import ManagerApprovalButtons from '@/components/admin/tni/ManagerApprovalButtons';
import { notFound, redirect } from 'next/navigation';

// Server Component for Manager Approval
export default async function ManagerApprovalPage({
    params,
    searchParams
}: {
    params: Promise<{ empId: string }>;
    searchParams: Promise<{ token?: string }>;
}) {
    const { empId } = await params;
    const { token } = await searchParams;

    // 1. SECURITY CHECK (HMAC Token Verification)
    if (!token || !verifySecureToken(token, empId)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md border-t-4 border-red-500">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
                    <p className="text-slate-600 mb-6">Invalid or expired security token. Please use the link provided in your email.</p>
                </div>
            </div>
        );
    }

    // Fetch pending nominations for this employee (CACHED)
    const employee = await getManagerApprovalData(empId);

    if (!employee) {
        return notFound();
    }

    const nominations = employee.nominations;

    // Logic Fix: Check if justifications are unique across nominations
    // If they differ, we should display them per-card instead of globally
    const uniqueJustifications = Array.from(new Set(nominations.map(n => n.justification)));
    const hasConsistentJustification = uniqueJustifications.length === 1;
    const globalJustification = hasConsistentJustification ? uniqueJustifications[0] : null;

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 md:p-12 font-sans">
            <div className="max-w-4xl w-full bg-white rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl overflow-hidden border border-slate-200">

                {/* Header Section */}
                <div className="bg-indigo-900 p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex justify-between items-start md:items-center flex-col md:flex-row gap-6 md:gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <HiClipboard className="text-yellow-400" size={28} />
                                <h1 className="text-2xl font-bold tracking-tight">Nomination Approval</h1>
                            </div>
                            <p className="text-indigo-200 text-sm">Reviewing training requests for</p>
                            <h2 className="text-3xl font-bold text-white mt-1">{employee.name}</h2>
                            <div className="flex items-center gap-2 mt-2 text-indigo-300 text-sm">
                                <HiOutlineUser size={14} />
                                <span className="font-mono bg-indigo-800/50 px-2 py-0.5 rounded text-xs">{employee.id}</span>
                            </div>
                        </div>

                        <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 backdrop-blur-sm shadow-inner">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{nominations.length}</div>
                                <div className="text-xs uppercase tracking-wider text-indigo-300 font-bold">Pending Requests</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8">
                    {/* GLOBAL Justification Section (Only if consistent) */}
                    {hasConsistentJustification && globalJustification && (
                        <div className="mb-10 relative group">
                            <div className="absolute -left-3 -top-3 text-slate-200 transition-transform group-hover:-translate-y-1">
                                <HiOutlineChatBubbleBottomCenterText size={48} />
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 relative z-10 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 w-fit">
                                    Employee's Justification
                                </h3>
                                <p className="text-slate-700 text-lg italic leading-relaxed">"{globalJustification}"</p>
                            </div>
                        </div>
                    )}

                    {/* Nominations List */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-6">
                            <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide whitespace-nowrap">
                                Requested Training Programs
                            </h3>
                            <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                            {nominations.length === 0 ? (
                                <div className="py-16 flex flex-col items-center justify-center text-center opacity-60">
                                    <div className="bg-slate-100 p-6 rounded-full mb-6">
                                        <HiOutlineShieldExclamation className="text-slate-400" size={48} />
                                    </div>
                                    <h4 className="text-slate-900 font-bold text-xl mb-2">All caught up!</h4>
                                    <p className="text-slate-500 max-w-sm mx-auto">No pending nominations found for this employee at the moment.</p>
                                </div>
                            ) : (
                                nominations.map((nomination) => (
                                    <div key={nomination.id} className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></div>
                                                    <h4 className="text-xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                                        {nomination.program.name}
                                                    </h4>
                                                </div>
                                                <div className="ml-6 flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                        {nomination.program.category}
                                                    </span>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">
                                                        Status: {nomination.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                                <ManagerApprovalButtons nominationId={nomination.id} />
                                            </div>
                                        </div>

                                        {/* INDIVIDUAL Justification (If inconsistent) */}
                                        {!hasConsistentJustification && nomination.justification && (
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm italic text-slate-600 ml-6 relative">
                                                <div className="absolute -left-2 top-4 w-2 h-2 bg-slate-200 rotate-45"></div>
                                                <span className="font-bold text-slate-400 not-italic mr-2">Justification:</span>
                                                "{nomination.justification}"
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thriveni Training Management System • Secure Approval Portal</p>
                </div>
            </div>
        </div>
    );
}
