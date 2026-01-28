import Link from 'next/link';
import { getSessions } from '@/app/actions/sessions';
import { Plus, Calendar, Users, ArrowRight } from 'lucide-react';

export default async function SessionsPage() {
    const sessions = await getSessions();

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Training Sessions</h1>
                        <p className="text-slate-500 mt-1">Manage batches, enrollments, and QR codes.</p>
                    </div>
                    <Link
                        href="/admin/sessions/new"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Session</span>
                    </Link>
                </div>

                {/* Sessions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">

                            <div className="flex justify-between items-start">
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    {session.nominationBatch?.status || 'Planned'}
                                </div>
                                {/* <div className="text-slate-400">
                    Menu?
                </div> */}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900 line-clamp-1">
                                    <Link href={`/admin/sessions/${session.id}/manage`} className="hover:text-blue-600 transition-colors">
                                        {session.programName}
                                    </Link>
                                </h3>
                                <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(session.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                    <Users className="w-4 h-4" />
                                    <span>{session.nominationBatch?.nominations.length || 0} Enrolled</span>
                                </div>

                                <Link
                                    href={`/admin/sessions/${session.id}/manage`}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-sm"
                                >
                                    Manage
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            No sessions found. Create one to get started.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
