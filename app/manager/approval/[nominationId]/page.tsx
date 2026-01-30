import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ApprovalClient from './ApprovalClient';
import { Calendar, User, BookOpen, Clock } from 'lucide-react';

export default async function Page({ params }: { params: Promise<{ nominationId: string }> }) {
    const { nominationId } = await params;

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
    const startDate = session?.startDate ? new Date(session.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
    const endDate = session?.endDate ? new Date(session.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="bg-white p-8 text-center border-b border-slate-100 pb-0">
                    <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2 bg-blue-50 px-2 py-1 rounded-full w-fit mx-auto">Training Nomination</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manager Approval</h1>
                    <p className="text-slate-500 mt-2 text-sm">Review request for training enrollment</p>
                </div>

                <div className="p-8 space-y-8">

                    {/* Employee Info */}
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="bg-white p-2 rounded-full shadow-sm text-slate-400">
                            <User size={24} />
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
                            <BookOpen className="text-blue-600 shrink-0 mt-1" size={20} />
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
                            <Calendar className="text-indigo-600 shrink-0 mt-1" size={20} />
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
                                        <Clock size={12} />
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
