import { db } from '@/lib/prisma';
import SessionForm from './session-form';
import Link from 'next/link';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

export default async function NewSessionPage() {
    const programs = await db.program.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });

    const locations = await db.location.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });

    const trainers = await db.trainer.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-center items-center gap-4">

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Schedule New Session</h1>
                        <p className="text-slate-500 mt-1">Create a session and start building its batch.</p>
                    </div>
                </div>

                <div className="mt-8">
                    <SessionForm programs={programs} locations={locations} trainers={trainers} />
                </div>
            </div>
        </div>
    );
}
