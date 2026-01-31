import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { verifySecureToken } from '@/lib/security';
import ApprovalClient from './ApprovalClient';
import { HiOutlineCalendar, HiOutlineUser, HiOutlineBookOpen, HiOutlineClock } from 'react-icons/hi2';

export default async function Page({
    params,
    searchParams
}: {
    params: Promise<{ nominationId: string }>;
    searchParams: Promise<{ token?: string }>;
}) {
    const { nominationId } = await params;
    const { token } = await searchParams;

    // SECURITY CHECK
    if (!token || !verifySecureToken(token, nominationId)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md border-t-4 border-red-500">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
                    <p className="text-slate-600">Invalid or expired security token.</p>
                </div>
            </div>
        );
    }

    const nomination = await db.nomination.findUnique({
        where: { id: nominationId },
        include: {
            employee: true,
            program: true,
            batch: {
                include: {
                    trainingSession: true
                }
            }
        }
    });

    if (!nomination) return notFound();

    const session = nomination.batch?.trainingSession;
    const hasDates = !!session?.startDate;
    // Use deterministic formatting to avoid hydration mismatch (if logic were shared) or inconsistencies
    const formatDate = (d: Date) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    };

    const startDate = session?.startDate ? formatDate(new Date(session.startDate)) : null;
    const endDate = session?.endDate ? formatDate(new Date(session.endDate)) : null;

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="bg-indigo-900 p-8 text-white relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-3 bg-indigo-800/50 px-3 py-1 rounded-full w-fit mx-auto border border-indigo-700/50">Training Nomination</p>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Manager Approval</h1>
                        <p className="text-indigo-200 font-medium">Review and validate training enrollment request</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">

                    {/* Employee Info */}
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="bg-white p-2 rounded-full shadow-sm text-slate-400">
                            <HiOutlineUser size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{nomination.employee.name}</h3>
                            <p className="text-sm text-slate-500">{nomination.employee.email}</p>
                            <p className="text-xs text-slate-400 uppercase font-bold mt-1 tracking-wide">{nomination.employee.designation || 'Employee'}</p>
                        </div>
                    </div>

                    {/* Program Info */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <HiOutlineBookOpen className="text-blue-600 shrink-0 mt-1" size={20} />
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{nomination.program.name}</h3>
                                <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">
                                        {nomination.program.category}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start border-t border-slate-100 pt-4">
                            <HiOutlineCalendar className="text-indigo-600 shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Session Dates</h4>
                                <div className="mt-1 flex items-center gap-2 text-slate-600">
                                    {hasDates ? (
                                        <>
                                            <span className="font-medium">{startDate}</span>
                                            <span className="text-slate-300">to</span>
                                            <span className="font-medium">{endDate}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded text-xs">Waiting for Admin Scheduling</span>
                                    )}
                                </div>
                                {session && (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                                        <HiOutlineClock size={12} />
                                        <span>Trainer: {session.trainerName || 'To be assigned'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Action Area */}
                    <div className="pt-4 border-t border-slate-100">
                        <ApprovalClient nomination={nomination} />
                    </div>

                </div>

                <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
                    <p className="text-xs text-slate-400">Secure approval link via Thriveni Training Portal</p>
                </div>
            </div>
        </div>
    );
}
