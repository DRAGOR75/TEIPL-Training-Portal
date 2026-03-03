import { getSessionById } from '@/app/actions/sessions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import ParticipantTableClient from './participant-table-client';

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ParticipantsPage({ params }: PageProps) {
    const { sessionId } = await params;
    const session = await getSessionById(sessionId);

    if (!session) {
        notFound();
    }

    const batchId = session.nominationBatchId;

    if (!batchId || !session.nominationBatch) {
        return <div className="p-8 text-red-500">Error: No Batch linked to this session.</div>;
    }

    // Extract all participants
    const participants = session.nominationBatch.nominations.map((nom: any) => ({
        ...nom.employee,
        nominationStatus: nom.status,
        managerApprovalStatus: nom.managerApprovalStatus
    }));

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <Link href={`/admin/sessions/${sessionId}/manage`} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors w-fit">
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        Back to Session Management
                    </Link>

                    <div>
                        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">
                            {session.nominationBatch.program.category}
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Participants: {session.programName}
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Comprehensive list of all enrolled participants and their details.
                        </p>
                    </div>
                </div>

                {/* Table Client Component */}
                <ParticipantTableClient participants={participants} sessionName={session.programName} />

            </div>
        </div>
    );
}
