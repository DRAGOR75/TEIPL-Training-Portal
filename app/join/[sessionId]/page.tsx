import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { selfEnroll } from '@/app/actions/enrollment';
import {
    HiOutlineCalendar,
    HiOutlineUser,
    HiOutlineBriefcase,
    HiOutlineEnvelope,
    HiOutlineInformationCircle,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCheckCircle,
    HiOutlineBuildingOffice2,
    HiOutlineBookOpen
} from 'react-icons/hi2';
import JoinFormClient from './JoinFormClient';

export default async function JoinSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    // Await params in Next.js 15+
    const { sessionId } = await params;

    // 1. Fetch Session Info
    const session = await db.trainingSession.findUnique({
        where: { id: sessionId },
        include: {
            nominationBatch: {
                include: {
                    nominations: {
                        where: { status: 'Batched' },
                        include: { employee: true }
                    }
                }
            },
            enrollments: {
                select: { employeeEmail: true, empId: true }
            }
        }
    });

    if (!session) return notFound();

    const dateStr = new Date(session.endDate).toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // 2. Prepare Participants List
    // We get all valid participants from the batch
    const participants = session.nominationBatch?.nominations.map(n => {
        // Did they already submit an enrollment? (Check by empId or email)
        const hasSubmitted = session.enrollments.some(e => 
            (e.empId && e.empId === n.employee.id) || 
            (e.employeeEmail === n.employee.email)
        );

        return {
            empId: n.employee.id,
            name: n.employee.name,
            email: n.employee.email,
            managerName: n.employee.managerName,
            managerEmail: n.employee.managerEmail,
            hasSubmitted
        };
    }) || [];

    // Sort alphabetically, pushing submitted ones to the bottom
    participants.sort((a, b) => {
        if (a.hasSubmitted === b.hasSubmitted) return a.name.localeCompare(b.name);
        return a.hasSubmitted ? 1 : -1;
    });

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 font-sans text-slate-800">
            <div className="max-w-3xl w-full mx-auto bg-white rounded-2xl shadow-xl shadow-slate-900/50 border border-slate-800 overflow-hidden">

                {/* Header Section */}
                <div className="bg-slate-900 p-8 md:p-12 text-center text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900 pointer-events-none"></div>

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-500/20 text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <HiOutlineCheckCircle size={12} /> Official Training Record
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-white">
                            Training Feedback
                        </h1>
                        <p className="text-slate-300 text-sm md:text-base font-medium mb-8 leading-relaxed">
                            Your insights help us elevate the training experience. Please take a moment to share your feedback.
                        </p>

                        {/* Professional Metadata Strip */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6 mx-auto w-full max-w-2xl">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] uppercase text-blue-300 font-bold tracking-wider mb-0.5">Program</p>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-white font-semibold text-sm">
                                    <HiOutlineBookOpen size={14} className="text-blue-400" />
                                    {session.programName}
                                </div>
                            </div>

                            <div className="text-center md:text-right">
                                <p className="text-[10px] uppercase text-blue-300 font-bold tracking-wider mb-0.5">Trainer</p>
                                <div className="flex items-center justify-center md:justify-end gap-2 text-white font-semibold text-sm">
                                    <HiOutlineUser size={14} className="text-blue-400" />
                                    {session.trainerName}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 text-center pt-4 border-t border-white/10">
                                <p className="text-[10px] uppercase text-blue-300 font-bold tracking-wider mb-0.5">Date</p>
                                <div className="flex items-center justify-center gap-2 text-white font-semibold text-sm">
                                    <HiOutlineCalendar size={14} className="text-blue-400" />
                                    {dateStr}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* The Dynamic Client Form */}
                <JoinFormClient
                    sessionId={sessionId}
                    participants={participants}
                    allowWalkIns={session.allowWalkIns}
                />

            </div>
        </div>
    );
}

