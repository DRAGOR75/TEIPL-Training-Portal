import { getSessionDetails } from '@/app/actions';
import {
    Calendar,
    User,
    Users,
    CheckCircle2,
    ArrowLeft,
    Clock,
    AlertCircle,
    BookOpen,
    Star
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SessionDetailsPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const session = await getSessionDetails(sessionId);

    if (!session) return notFound();

    const enrollments = session.enrollments || [];
    const completedCount = enrollments.filter((e: any) => e.status === 'Completed').length;
    const completionRate = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0;

    // Calculate global average from all completed reviews
    const ratedEnrollments = enrollments.filter((e: any) => e.trainingRating > 0);
    const averageRating = ratedEnrollments.length > 0
        ? (ratedEnrollments.reduce((acc: number, e: any) => {
            const scores = [
                e.trainingRating,
                e.contentRating,
                e.trainerRating,
                e.materialRating
            ].filter(s => s !== null && s !== undefined);
            const userAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            return acc + userAvg;
        }, 0) / ratedEnrollments.length).toFixed(1)
        : '0.0';

    try {
        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
                {/* Header Strip */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <BookOpen size={20} className="text-blue-600" />
                                {session.programName}
                            </h1>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                <span className="flex items-center gap-1"><User size={12} /> {session.trainerName}</span>
                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Main Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Participants</h3>
                            <div className="flex items-center gap-3">
                                <Users size={24} className="text-blue-600" />
                                <span className="text-3xl font-black text-slate-800">{enrollments.length}</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Completion Rate</h3>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={24} className="text-emerald-500" />
                                <span className="text-3xl font-black text-slate-800">{completionRate}%</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Training Average</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl"><Star size={24} className="text-yellow-500" /></span>
                                <span className="text-3xl font-black text-slate-800">{averageRating}</span>
                                <span className="text-sm font-medium text-slate-400 self-end mb-1">/ 5.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Participants Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-800">Participation & Feedback Details</h2>
                            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                                {enrollments.length} Records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-slate-600">Employee</th>
                                        <th className="px-6 py-4 font-bold text-slate-600">Feedback Rating</th>
                                        <th className="px-6 py-4 font-bold text-slate-600 w-64">Additional Comments</th>
                                        <th className="px-6 py-4 font-bold text-slate-600">Post training (30 days) performance feedback Status</th>
                                        <th className="px-6 py-4 font-bold text-slate-600">Post training (30 days) performance feedback</th>
                                        <th className="px-6 py-4 font-bold text-slate-600">Manager Review</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {enrollments.map((e: any) => {
                                        // Calculate Feedback Rating (Average of 6 fields)
                                        const feedbackScores = [
                                            e.trainingRating,
                                            e.contentRating,
                                            e.trainerRating,
                                            e.materialRating
                                        ].filter(s => s !== null && s !== undefined);

                                        const feedbackAverage = feedbackScores.length > 0
                                            ? (feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length).toFixed(1)
                                            : null;

                                        return (
                                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{e.employeeName}</div>
                                                    <div className="text-xs text-slate-500">{e.employeeEmail}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{e.empId || 'No ID'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {feedbackAverage ? (
                                                        <div className="flex items-center gap-1 font-bold text-slate-700">
                                                            <span className="text-amber-500"><Star size={12} /></span> {feedbackAverage}/5
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2 max-w-xs text-xs">
                                                        {e.topicsLearned && (
                                                            <div>
                                                                <span className="font-bold text-slate-600 block">Topics:</span>
                                                                <p className="text-slate-500 line-clamp-3 hover:line-clamp-none transition-all">{e.topicsLearned}</p>
                                                            </div>
                                                        )}
                                                        {e.actionPlan && (
                                                            <div>
                                                                <span className="font-bold text-slate-600 block">Action Plan:</span>
                                                                <p className="text-slate-500 line-clamp-3 hover:line-clamp-none transition-all">{e.actionPlan}</p>
                                                            </div>
                                                        )}
                                                        {e.suggestions && (
                                                            <div>
                                                                <span className="font-bold text-slate-600 block">Suggestions:</span>
                                                                <p className="text-slate-500 line-clamp-3 hover:line-clamp-none transition-all">{e.suggestions}</p>
                                                            </div>
                                                        )}
                                                        {!e.topicsLearned && !e.actionPlan && !e.suggestions && (
                                                            <span className="text-slate-300 italic">- No comments -</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(e.status)}`}>
                                                        {e.status === 'Completed' ? <CheckCircle2 size={12} /> :
                                                            e.status === 'Pending Manager' ? <Clock size={12} /> :
                                                                <AlertCircle size={12} />}
                                                        {e.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {e.averageRating ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-lg">{e.averageRating.toFixed(1)}</span>
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Average</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <div className="font-medium text-slate-800 text-xs mb-1">
                                                            {e.managerName || 'Manager'}
                                                            <span className="text-slate-400 font-normal"> ({e.managerEmail})</span>
                                                        </div>
                                                        {e.managerComment ? (
                                                            <div className="text-slate-600 text-xs italic bg-slate-50 p-2 rounded border border-slate-100">
                                                                "{e.managerComment}"
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">- No comments -</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {enrollments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                No participants enrolled yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div >
            </div >
        );
    } catch (error) {
        return (
            <div className="p-10 text-center text-red-500">
                <h1 className="text-2xl font-bold">Error loading session details</h1>
                <p>Please try again later.</p>
            </div>
        )
    }
}

function getStatusStyles(status: string) {
    switch (status) {
        case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Pending Manager': return 'bg-amber-50 text-amber-700 border-amber-200';
        default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
}
