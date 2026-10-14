import { auth } from '@/auth';
import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PrintAttendanceSheet, { ColumnMode } from '@/components/attendance/PrintAttendanceSheet';

export default async function PrintAttendancePage({
    params,
    searchParams
}: {
    params: Promise<{ sessionId: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { sessionId } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const colParam = typeof resolvedSearchParams.col === 'string' ? resolvedSearchParams.col : 'location';
    const initialColMode: ColumnMode = (['location', 'designation', 'both'].includes(colParam) ? colParam : 'location') as ColumnMode;
    const autoPrint = resolvedSearchParams.autoPrint === 'true';

    const sessionUser = await auth();
    if (!sessionUser) {
        redirect('/api/auth/signin');
    }

    const session = await db.trainingSession.findUnique({
        where: { id: sessionId },
        include: {
            nominationBatch: {
                include: {
                    nominations: {
                        include: { employee: true },
                        orderBy: { employee: { name: 'asc' } }
                    }
                }
            }
        }
    });

    if (!session) {
        return <div className="p-10 text-center">Session not found</div>;
    }

    return (
        <PrintAttendanceSheet
            session={session}
            initialColMode={initialColMode}
            autoPrint={autoPrint}
            backUrl={`/trainer/dashboard/session/${sessionId}`}
        />
    );
}
