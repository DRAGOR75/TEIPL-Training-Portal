'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import QRCode from "react-qr-code";
import { getDashboardData, sendFeedbackEmails } from '@/app/actions';
import { getTrainers } from '@/app/actions/trainers'; // 🟢 Import this
import { AddParticipantModal } from '@/components/AddParticipantModal';
import TrainerManager from '@/components/admin/TrainerManager'; // 🟢 Import this
import CreateSessionModal from '@/components/admin/CreateSessionModal'; // 🟢 Import this

// 1. Updated Session Type with Dates
type Session = {
    id: string;
    programName: string;
    trainerName: string | null;
    startDate: Date;      // 🟢 New
    endDate: Date;        // 🟢 New
    emailsSent: boolean;
    enrollments: any[];
};

type Trainer = {
    id: string;
    name: string;
    expertise: string | null;
};

export default function AdminDashboard() {
    const [date, setDate] = useState<any>(new Date());

    // Data State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]); // 🟢 Store trainers
    const [pendingReviews, setPendingReviews] = useState(0);
    const [loading, setLoading] = useState(true);

    // FETCH DATA
    useEffect(() => {
        async function loadData() {
            try {
                // Parallel fetching for speed
                const [dashboardData, trainersData] = await Promise.all([
                    getDashboardData(),
                    getTrainers()
                ]);

                setSessions(dashboardData.sessions);
                setPendingReviews(dashboardData.pendingCount);
                setTrainers(trainersData); // 🟢 Save trainers
            } catch (err) {
                console.error("Failed to load dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Helper to format date range
    const formatDateRange = (start: Date, end: Date) => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    // Calendar Sync Logic
    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            // Check if this date falls within any session's range
            const hasSession = sessions.some(s => {
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                const current = new Date(date);
                // Reset hours for accurate comparison
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return current >= start && current <= end;
            });

            if (hasSession) {
                return (
                    <div className="flex justify-center mt-1">
                        <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

            {/* Navbar */}
            <nav className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold text-blue-900">Thriveni Training Admin</h1>
                <div className="flex gap-4 text-sm font-medium text-slate-600">
                    <span className="cursor-pointer hover:text-blue-600">Manage Nominations</span>
                    <span className="cursor-pointer text-blue-600 border-b-2 border-blue-600 pb-1">Feedback System</span>
                </div>
            </nav>

            <main className="flex-1 p-8 flex flex-col lg:flex-row gap-8">

                {/* LEFT COLUMN: Calendar & Trainers */}
                <div className="w-full lg:w-1/3 space-y-8">

                    {/* 1. Calendar */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-bold mb-2 text-slate-800">Training Calendar</h2>
                        <div className="flex justify-center calendar-wrapper">
                            <Calendar
                                onChange={setDate}
                                value={date}
                                tileContent={tileContent}
                                className="rounded-lg border-none w-full p-2"
                            />
                        </div>
                    </div>

                    {/* 2. Trainer Manager Component */}
                    <TrainerManager trainers={trainers} />

                </div>

                {/* RIGHT COLUMN: Actions & Session List */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6">

                    {/* Stats & Create Button Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-600 text-white rounded-xl p-6 shadow-md flex flex-col justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Pending Reviews</p>
                                <h3 className="text-3xl font-bold">{pendingReviews}</h3>
                            </div>
                            <div className="mt-4 text-sm bg-blue-700/50 p-2 rounded inline-block w-fit">
                                🚀 System Active
                            </div>
                        </div>

                        {/* 🟢 NEW Create Session Modal (With Dropdown) */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border flex flex-col items-center justify-center text-center space-y-3">
                            <h3 className="font-bold text-slate-700">Schedule New Training</h3>
                            <p className="text-xs text-slate-500">Set up dates, select trainer, and generate QR code.</p>
                            <CreateSessionModal trainers={trainers} />
                        </div>
                    </div>

                    {/* Sessions List */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-lg font-bold mb-4 text-slate-800 border-b pb-2">Active Sessions</h2>

                        {loading ? (
                            <div className="text-slate-400 text-sm animate-pulse p-4">Loading data...</div>
                        ) : sessions.length === 0 ? (
                            <div className="text-slate-400 text-sm italic p-4 text-center">No training sessions found. Schedule one above!</div>
                        ) : (
                            sessions.map((t) => (
                                <div key={t.id} className="p-5 border border-slate-200 rounded-xl mb-4 bg-slate-50 hover:shadow-md transition-all">

                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">

                                        {/* Session Info */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg text-slate-900">{t.programName}</h3>
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${t.emailsSent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {t.emailsSent ? 'Completed' : 'In Progress'}
                                                </span>
                                            </div>

                                            <div className="text-sm text-slate-600 space-y-1 mb-4">
                                                <p>👨‍🏫 <strong>Trainer:</strong> {t.trainerName || 'Unassigned'}</p>
                                                <p>📅 <strong>Date:</strong> {formatDateRange(t.startDate, t.endDate)}</p>
                                                <p>👥 <strong>Enrollments:</strong> {t.enrollments.length}</p>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                <AddParticipantModal sessionId={t.id} />

                                                {/* Email Trigger Button */}
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("Send feedback emails to all participants?")) return;
                                                        await sendFeedbackEmails(t.id);
                                                        window.location.reload();
                                                    }}
                                                    disabled={t.emailsSent}
                                                    className={`px-4 py-2 rounded-lg font-bold text-xs transition ${t.emailsSent
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                        }`}
                                                >
                                                    {t.emailsSent ? '✓ Emails Sent' : '✉️ Trigger Level 3 Feedback'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 🟢 QR CODE SECTION */}
                                        <div className="flex flex-col items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Scan to Join</p>
                                            <div className="bg-white">
                                                <QRCode
                                                    value={`https://templtrainingportal.vercel.app/join/${t.id}`}
                                                    size={80}
                                                />
                                            </div>
                                            <a
                                                href={`/join/${t.id}`}
                                                target="_blank"
                                                className="text-[10px] text-blue-500 mt-2 hover:underline"
                                            >
                                                Open Link ↗
                                            </a>
                                        </div>

                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}