'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import QRCode from "react-qr-code";
import {
    LayoutDashboard,
    Calendar as CalendarIcon,
    Users,
    Mail,
    ExternalLink,
    CheckCircle2,
    Clock,
    UserCheck,
    PlusCircle,
    QrCode,
    LogOut,
    Download
} from 'lucide-react';
import { sendFeedbackEmails } from '@/app/actions';
import { AddParticipantModal } from '@/components/AddParticipantModal';
import TrainerManager from '@/components/admin/TrainerManager';
import CreateSessionModal from '@/components/admin/CreateSessionModal';
import SignOutButton from "@/components/auth/SignOutButton";

type Session = {
    id: string;
    programName: string;
    trainerName: string | null;
    startDate: Date;
    endDate: Date;
    emailsSent: boolean;
    enrollments: any[];
};

type Trainer = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    createdAt: Date;
};

type DashboardClientProps = {
    initialSessions: Session[];
    initialTrainers: Trainer[];
    initialPendingReviews: number;
};

export default function DashboardClient({
    initialSessions,
    initialTrainers,
    initialPendingReviews
}: DashboardClientProps) {
    const [date, setDate] = useState<any>(new Date());
    // We can use state if we need client-side updates, 
    // but typically server actions + router.refresh() handles updates.
    // However, keeping state allows for immediate UI updates if we wanted.
    // For this refactor, we'll initialize with props.
    // Since revalidatePath reloads the page, props will update.
    const sessions = initialSessions;
    const trainers = initialTrainers;
    const pendingReviews = initialPendingReviews;

    const formatDateRange = (start: Date, end: Date) => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const hasSession = sessions.some(s => {
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                const current = new Date(date);
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

    const downloadQRCode = (sessionId: string, programName: string) => {
        const svg = document.getElementById(`qr-${sessionId}`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40; // Add padding
            canvas.height = img.height + 40;
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 20, 20);
                const pngFile = canvas.toDataURL("image/png");

                const downloadLink = document.createElement("a");
                downloadLink.download = `${programName}-QR.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
            {/* Navbar Removed - Moved to Global Navbar */}

            <main className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                {/* LEFT COLUMN */}
                <div className="w-full lg:w-1/3 space-y-8">
                    {/* Calendar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarIcon className="text-blue-700" size={20} />
                            <h2 className="text-lg font-bold text-slate-900">Training Schedule</h2>
                        </div>
                        <div className="calendar-wrapper">
                            <Calendar
                                onChange={setDate}
                                value={date}
                                tileContent={tileContent}
                                className="rounded-xl border-none w-full p-2"
                            />
                        </div>
                    </div>

                    <TrainerManager trainers={trainers} />
                </div>

                {/* RIGHT COLUMN */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6">
                    {/* Stats & Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-700 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
                            <Users className="absolute -right-4 -bottom-4 text-white/10" size={120} />
                            <div>
                                <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">Pending Reviews</p>
                                <h3 className="text-4xl font-black">{pendingReviews}</h3>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 backdrop-blur-md p-2 rounded-lg w-fit font-bold">
                                <Clock size={14} /> System Online
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-3 bg-blue-50 rounded-full text-blue-700">
                                <PlusCircle size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">New Training Session</h3>
                                <p className="text-xs text-slate-500 mt-1">Configure dates and assign a trainer.</p>
                            </div>
                            <CreateSessionModal trainers={trainers} />
                        </div>
                    </div>

                    {/* Sessions List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                            <QrCode className="text-blue-700" size={20} />
                            <h2 className="text-lg font-bold text-slate-900">Active Sessions</h2>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium italic">No active sessions found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((t) => (
                                    <div key={t.id} className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-blue-300 hover:shadow-md transition-all group">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">{t.programName}</h3>
                                                    <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter ${t.emailsSent ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {t.emailsSent ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                        {t.emailsSent ? 'Completed' : 'Active'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck size={16} className="text-slate-400" />
                                                        <span>Trainer: <span className="font-bold">{t.trainerName || 'N/A'}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon size={16} className="text-slate-400" />
                                                        <span>{formatDateRange(t.startDate, t.endDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={16} className="text-slate-400" />
                                                        <span>{t.enrollments.length} Participants</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <AddParticipantModal sessionId={t.id} />
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm("Send feedback emails to all participants?")) return;
                                                            await sendFeedbackEmails(t.id);
                                                            // window.location.reload(); // Not needed if server action revalidates
                                                        }}
                                                        disabled={t.emailsSent}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${t.emailsSent
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95'
                                                            }`}
                                                    >
                                                        <Mail size={14} />
                                                        {t.emailsSent ? 'Feedback Sent' : 'Trigger Level 3 Emails'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* QR Code */}
                                            <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    <QRCode
                                                        id={`qr-${t.id}`}
                                                        value={`https://templtrainingportal.vercel.app/join/${t.id}`}
                                                        size={80}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-center gap-2 mt-3">
                                                    <a
                                                        href={`/join/${t.id}`}
                                                        target="_blank"
                                                        className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest"
                                                    >
                                                        Live Link <ExternalLink size={10} />
                                                    </a>
                                                    <button
                                                        onClick={() => downloadQRCode(t.id, t.programName)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        <Download size={10} /> Download
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
