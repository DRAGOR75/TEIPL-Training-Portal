import { getSessionById, getPendingNominationsForProgram } from '@/app/actions/sessions';
import ManagementClient from './management-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ManageSessionPage({ params }: PageProps) {
    const { sessionId } = await params;
    const session = await getSessionById(sessionId);

    if (!session) {
        notFound();
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
                    <Link href="/admin/sessions" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" />
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
                                <Calendar className="w-5 h-5 text-slate-400" />
                                {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" />
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
