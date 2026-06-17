import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/prisma';
import { getSessions } from '@/app/actions/sessions';
import { getTrainers } from '@/app/actions/trainers';
import GanttCalendar from '@/components/planning/GanttCalendar';
import EmployeeCalendarClient from '@/components/user/EmployeeCalendarClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeCalendarPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/api/auth/signin');
    }

    const [programs, rawSessions, trainers, locations] = await Promise.all([
        db.program.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        }),
        getSessions(),
        getTrainers(),
        db.location.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    // Map to the simple interface required by the Gantt component
    const normalizedSessions = rawSessions.map(s => ({
        id: s.id,
        programName: s.programName,
        trainerName: s.trainerName,
        startDate: s.startDate,
        endDate: s.endDate,
        location: s.location ?? undefined,
    }));

    // Map upcoming actual sessions for the enrollment table
    const upcomingEvents = rawSessions
        .filter(s => new Date(s.startDate) >= new Date() && s.nominationBatchId)
        .map(s => ({
            id: s.nominationBatchId, // Used by selfNominateCalendar which expects a batchId
            capacity: s.nominationBatch?.capacity || null,
            nominations: s.nominationBatch?.nominations || [],
            proposedStartDate: s.startDate,
            proposedEndDate: s.endDate,
            program: { name: s.programName },
            proposedTrainer: s.trainerName,
            proposedLocation: s.location
        }));

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Training Calendar</h1>
                    <p className="text-slate-500 font-medium mt-2">View the upcoming training schedule across all trainers.</p>
                </div>
                
                <div className="mb-12">
                    <GanttCalendar 
                        programs={programs} 
                        sessions={normalizedSessions}
                        trainers={trainers}
                        locations={locations}
                        readOnly={true}
                    />
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upcoming Sessions</h2>
                    <p className="text-slate-500 font-medium mt-1">Browse scheduled training sessions and self-enroll with manager approval.</p>
                </div>
                
                <EmployeeCalendarClient events={upcomingEvents} userEmail={session.user.email} />
            </div>
        </main>
    );
}
