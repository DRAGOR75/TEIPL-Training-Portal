'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getDashboardData, sendFeedbackEmails, createTrainingSession } from '@/app/actions';
import { AddParticipantModal } from '@/components/AddParticipantModal';

// Define what the data looks like
type Session = {
    id: string;
    programName: string;
    trainerName: string | null;
    completionDate: Date;
    emailsSent: boolean;
    enrollments: any[];
};

export default function AdminDashboard() {
    const [date, setDate] = useState<any>(new Date());
    const [showModal, setShowModal] = useState(false);

    // REAL DATA STATE
    const [sessions, setSessions] = useState<Session[]>([]);
    const [pendingReviews, setPendingReviews] = useState(0);
    const [loading, setLoading] = useState(true);

    // FETCH DATA ON LOAD
    useEffect(() => {
        async function loadData() {
            try {
                const data = await getDashboardData();
                setSessions(data.sessions);
                setPendingReviews(data.pendingCount);
            } catch (err) {
                console.error("Failed to load dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Helper to format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Handle Create Session
    async function handleCreateSession(formData: FormData) {
        await createTrainingSession(formData);
        setShowModal(false);
        window.location.reload();
    }

    // --- NEW: Calendar Sync Logic ---
    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const hasSession = sessions.some(s =>
                new Date(s.completionDate).toDateString() === date.toDateString()
            );

            if (hasSession) {
                return (
                    <div className="flex justify-center mt-1">
                        <div className="h-2 w-2 bg-blue-600 rounded-full shadow-sm"></div>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

            {/* Navbar */}
            <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold text-blue-900">Thriveni Training Admin</h1>
                <div className="flex gap-4 text-sm font-medium text-slate-600">
                    <span className="cursor-pointer hover:text-blue-600">Manage Nominations</span>
                    <span className="cursor-pointer text-blue-600 border-b-2 border-blue-600 pb-1">Feedback System</span>
                </div>
            </nav>

            <main className="flex-1 p-8 flex gap-8">

                {/* LEFT: Calendar */}
                <div className="w-1/2 bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-bold mb-2 text-slate-800">Training Calendar</h2>
                    <p className="text-sm text-slate-500 mb-6">Days with training are marked with a blue dot.</p>
                    <div className="flex justify-center calendar-wrapper">
                        <Calendar
                            onChange={setDate}
                            value={date}
                            onClickDay={(value) => { setDate(value); setShowModal(true); }}
                            tileContent={tileContent}
                            className="rounded-lg border-none shadow-sm w-full p-2"
                        />
                    </div>
                </div>

                {/* RIGHT: Action Center */}
                <div className="w-1/2 flex flex-col gap-6">

                    {/* Sessions List */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-bold mb-4 text-slate-800">Recent Sessions</h2>

                        {loading ? (
                            <div className="text-slate-400 text-sm animate-pulse">Loading data...</div>
                        ) : sessions.length === 0 ? (
                            <div className="text-slate-400 text-sm italic">No training sessions found. Log one in the calendar!</div>
                        ) : (
                            sessions.map((t) => (
                                <div key={t.id} className="p-4 border border-slate-200 rounded-lg mb-3 bg-slate-50 hover:bg-white transition shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{t.programName}</h3>
                                            <p className="text-xs text-slate-600">
                                                Trainer: {t.trainerName || 'N/A'} • Ended: {formatDate(t.completionDate)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                                                {t.enrollments.length} Enrollments
                                            </span>
                                        </div>
                                    </div>

                                    {/* --- 1. ADD PARTICIPANTS BUTTON --- */}
                                    <div className="mb-3">
                                        <AddParticipantModal sessionId={t.id} />
                                    </div>

                                    {/* --- 2. SEND EMAILS BUTTON --- */}
                                    <form action={async () => {
                                        await sendFeedbackEmails(t.id);
                                        window.location.reload();
                                    }}>
                                        <button
                                            className={`w-full py-2 rounded-lg font-bold text-sm transition shadow-sm flex justify-center items-center gap-2 ${t.emailsSent
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                }`}
                                            disabled={t.emailsSent}
                                        >
                                            {t.emailsSent ? <>✓ Emails Sent</> : <>✉️ Send Feedback Emails</>}
                                        </button>
                                    </form>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <h3 className="font-bold text-blue-900 mb-2">System Status</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-3 rounded shadow-sm">
                                <span className="block text-slate-500 text-xs">Total Sessions</span>
                                <span className="font-bold text-xl">{sessions.length}</span>
                            </div>

                            <div className="bg-white p-3 rounded shadow-sm">
                                <span className="block text-slate-500 text-xs">Pending Reviews</span>
                                <span className="font-bold text-xl text-blue-600">
                                    {loading ? '...' : pendingReviews}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">Log New Training Session</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form action={handleCreateSession} className="p-6 space-y-4">
                            <input type="hidden" name="date" value={date.toISOString()} />

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Program Name</label>
                                <input required name="programName" type="text" placeholder="e.g. Advanced Excel" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Trainer Name</label>
                                <input required name="trainerName" type="text" placeholder="e.g. John Doe" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Completion Date</label>
                                <div className="p-3 bg-slate-50 border rounded-lg text-slate-600 text-sm font-medium">
                                    📅 {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow mt-2 transition">
                                Save Session
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}