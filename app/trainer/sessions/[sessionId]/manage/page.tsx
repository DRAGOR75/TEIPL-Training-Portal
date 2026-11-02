import { getSessionById, getPendingNominationsForProgram } from '@/app/actions/sessions';
import ManagementClient from '@/app/admin/sessions/[sessionId]/manage/management-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineUser, HiOutlineUsers } from 'react-icons/hi2';
import { auth } from '@/auth';
import { db } from '@/lib/prisma';

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ManageSessionPage({ params }: PageProps) {
    const { sessionId } = await params;

    // 1. Get Session Data
    const session = await getSessionById(sessionId);

    if (!session) {
        notFound();
    }

    // 2. Auth Check: Ensure the logged in Trainer or Coordinator is assigned to this session
    const userSession = await auth();
    let trainerName: string | undefined = undefined;

    if (userSession?.user?.email) {
        const trainerRecord = await db.trainer.findUnique({
            where: { email: userSession.user.email }
        });
        if (trainerRecord) {
            trainerName = trainerRecord.name;
        }
    }

    // Prevent access if the user is a trainer/coordinator and this session is assigned to someone else
    const isTrainer = !!(session.trainerName && trainerName && session.trainerName.toLowerCase() === trainerName.toLowerCase());
    const isCoordinator = !!(session.coordinatorName && trainerName && session.coordinatorName.toLowerCase() === trainerName.toLowerCase());

    if (trainerName && !isTrainer && !isCoordinator) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-slate-600">You do not have permission to manage this session because you are not assigned as its Trainer or Coordinator.</p>
                <Link href="/trainer/sessions" className="text-blue-600 hover:underline font-medium">Return to My Sessions</Link>
            </div>
        );
    }

    const batchId = session.nominationBatchId;
    // If no batch exists (legacy data?), we might have an issue. 
    // But createSession ensures batch creation.

    if (!batchId || !session.nominationBatch) {
        return <div className="p-8 text-red-500">Error: No Batch linked to this session.</div>;
    }

    const programId = session.nominationBatch.programId;
    const pendingNominations = await getPendingNominationsForProgram(programId);

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col gap-6">
                    <Link href="/trainer/sessions" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors w-fit">
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        Back to Sessions
                    </Link>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit">
                                {session.nominationBatch.program.category}
                            </div>
                            <div className="bg-slate-200 text-slate-700 text-xs font-mono font-bold px-3 py-1 rounded-full w-fit">
                                ID: {session.nominationBatch.program.id}
                            </div>
                        </div>

                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            {session.altProgramName || session.programName}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 mt-4 text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                                <HiOutlineCalendar className="w-5 h-5 text-slate-400" />
                                {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <HiOutlineUser className="w-5 h-5 text-slate-400" />
                                <span>Trainer: {session.trainerName || 'No Trainer Assigned'}</span>
                            </div>
                            {session.coordinatorName && (
                                <div className="flex items-center gap-2">
                                    <HiOutlineUsers className="w-5 h-5 text-indigo-500" />
                                    <span>Coordinator: {session.coordinatorName}</span>
                                </div>
                            )}
                            {trainerName && (isTrainer || isCoordinator) && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                    <span className="text-xs uppercase font-bold text-slate-400">Your Role:</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                                        isTrainer && isCoordinator
                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                            : isCoordinator
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {isTrainer && isCoordinator ? 'Trainer & Coordinator' : isCoordinator ? 'Coordinator' : 'Trainer'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ManagementClient
                    session={session}
                    pendingNominations={pendingNominations}
                    batchId={batchId}
                />

            </div>
        </div>
    );
}
