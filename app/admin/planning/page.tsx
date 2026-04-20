import { db } from '@/lib/prisma';
import { getSessions } from '@/app/actions/sessions';
import { getTrainers } from '@/app/actions/trainers';
import GanttCalendar from '@/components/planning/GanttCalendar';
import OptionBGantt from '@/components/planning/OptionBGantt';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PlanningPage() {
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
    const normalizedSessions = rawSessions.map(session => ({
        id: session.id,
        programName: session.programName,
        trainerName: session.trainerName,
        startDate: session.startDate,
        endDate: session.endDate,
        // Calculate status internally if needed based on dates
    }));

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-8 shadow-sm relative z-10">
                <div className="container mx-auto px-6 max-w-[1600px]">
                    <div className="flex flex-col space-y-4">
                        <Link href="/admin" className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1 group w-fit">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
                                    Training <span className="text-indigo-600">Planning Board</span>
                                </h1>
                                <p className="text-slate-500 font-medium">
                                    Visualize and click on empty dates to seamlessly schedule upcoming program sessions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Option B */}
            <div className="container mx-auto px-6 pt-10 max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <OptionBGantt 
                   sessions={normalizedSessions}
                   trainers={trainers}
                />
            </div>
            
            <div className="container mx-auto px-6 mt-16 max-w-[1600px]">
                <h3 className="text-xl font-bold mb-4 text-slate-800">Option A (Custom Built Code Archive)</h3>
                <div className="opacity-50 grayscale pointer-events-none transform scale-95 origin-top">
                    <GanttCalendar 
                        programs={programs} 
                        sessions={normalizedSessions}
                        trainers={trainers}
                        locations={locations}
                    />
                </div>
            </div>
            
            <div className="mt-16 text-center">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                    Interactive Planning Interface Active
                </p>
            </div>
        </div>
    );
}
