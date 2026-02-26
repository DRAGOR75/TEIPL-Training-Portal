import { getSessionById, getPendingNominationsForProgram } from '@/app/actions/sessions';
import ManagementClient from './management-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineUser } from 'react-icons/hi2';
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

    // 2. Auth Check: Ensure the logged in Trainer owns this session
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

    // Prevent access if the session belongs to another trainer
    if (trainerName && session.trainerName && session.trainerName !== trainerName) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-slate-600">You do not have permission to manage this session because it is assigned to another trainer.</p>
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
                        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">
                            {session.nominationBatch.program.category}
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            {session.programName}
                        </h1>
                        <div className="flex items-center gap-6 mt-4 text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                                <HiOutlineCalendar className="w-5 h-5 text-slate-400" />
                                {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <HiOutlineUser className="w-5 h-5 text-slate-400" />
                                {session.trainerName || 'No Trainer Assigned'}
                            </div>
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
