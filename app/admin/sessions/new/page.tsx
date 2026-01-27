import { db } from '@/lib/prisma';
import SessionForm from './session-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewSessionPage() {
    const programs = await db.program.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/sessions" className="p-2 rounded-full hover:bg-white transition-colors text-slate-500">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Schedule New Session</h1>
                        <p className="text-slate-500 mt-1">Create a session and start building its batch.</p>
                    </div>
                </div>

                <div className="mt-8">
                    <SessionForm programs={programs} />
                </div>
            </div>
        </div>
    );
}
