import TrainingCalendarManager from '@/components/admin/TrainingCalendarManager';
import { getTrainers } from '@/app/actions/trainers';
import { getCachedAdminPrograms, getCachedAdminLocations } from '@/lib/cache-master-data';
import { db } from '@/lib/prisma';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
    const session = await auth();
    if (!session) {
        redirect("/api/auth/signin");
    }

    const [programs, trainers, locations, allSessions] = await Promise.all([
        getCachedAdminPrograms(),
        getTrainers(),
        getCachedAdminLocations(),
        db.trainingSession.findMany({ 
            select: { 
                id: true, 
                programName: true, 
                trainerName: true, 
                location: true, 
                startDate: true, 
                endDate: true, 
                enrollments: { select: { id: true } } 
            } 
        })
    ]);

    return (
        <TrainingCalendarManager 
            programs={programs} 
            trainers={trainers} 
            allSessions={allSessions} 
            locations={locations} 
        />
    );
}
