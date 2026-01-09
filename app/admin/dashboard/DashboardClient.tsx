'use client';

import { useState, useEffect } from 'react';
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
    Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSessionsForDate, toggleFeedbackAutomation, sendFeedbackEmails } from '@/app/actions';

import TrainerManager from '@/components/admin/TrainerManager';
import CreateSessionModal from '@/components/admin/CreateSessionModal';
import LoadingScreen from '@/app/loading';

type Session = {
    id: string;
    programName: string;
    trainerName: string | null;
    startDate: Date;
    endDate: Date;
    feedbackCreationDate?: Date | null;
    emailsSent: boolean;
    sendFeedbackAutomatically: boolean;
    enrollments: any[];
};

type SessionMetadata = {
    id: string;
    startDate: Date;
    endDate: Date;
    feedbackCreationDate: Date | null;
};

type Trainer = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    createdAt: Date;
};

type DashboardClientProps = {
    initialMetadata: SessionMetadata[];
    initialSessions: Session[];
    initialTrainers: Trainer[];
    initialPendingReviews: number;
    currentPage: number;
    totalPages: number;
};

export default function DashboardClient({
    initialMetadata,
    initialSessions,
    initialTrainers,
    initialPendingReviews,
}: DashboardClientProps) {
    const [date, setDate] = useState<any>(new Date());
    const [optimisticToggles, setOptimisticToggles] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Sessions is now the "Active List" for the selected date
    const [sessions, setSessions] = useState<Session[]>(initialSessions);

    // Initial Load / Prop updates
    useEffect(() => {
        setSessions(initialSessions);
    }, [initialSessions]);

    // Handle Date Change
    const handleDateChange = async (newDate: any) => {
        setDate(newDate);
        setIsLoading(true);
        try {
            // 🟢 DATE FIX: Send YYYY-MM-DD (Local) to prevent Timezone shift
            // toISOString() converts 00:00 IST to Previous Day UTC, causing the bug.
            const offset = newDate.getTimezoneOffset();
            const localDate = new Date(newDate.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0]; // "2024-01-08"

            const result = await getSessionsForDate(dateStr);
            setSessions(result.sessions as Session[]);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSessionEmail = async (sessionId: string, currentStatus: boolean, realStatus: boolean) => {
        const nextStatus = !currentStatus;
        setOptimisticToggles(prev => ({ ...prev, [sessionId]: nextStatus }));

        try {
            await toggleFeedbackAutomation(sessionId, nextStatus);
            router.refresh();
        } catch (error) {
            alert("Failed to update settings");
            setOptimisticToggles(prev => ({ ...prev, [sessionId]: realStatus }));
        }
    };

    const trainers = initialTrainers;

    const isSameDay = (date1: Date, date2: Date) => {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    // Calendar Dots: Use lightweight metadata (ALL sessions)
    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const events: { color: string; title: string }[] = [];

            // Check Metadata for PFA Dates
            const pfaSessions = initialMetadata.filter(s =>
                s.feedbackCreationDate && isSameDay(date, new Date(s.feedbackCreationDate))
            );
            pfaSessions.forEach(() => events.push({ color: 'bg-red-500', title: 'Post training (30 days) performance feedback' }));

            // Check Metadata for Session End Dates
            const endSessions = initialMetadata.filter(s => isSameDay(date, new Date(s.endDate)));
            endSessions.forEach(() => events.push({ color: 'bg-purple-600', title: 'Training End Date' }));

            // OPTIONAL: Check for Active/Start Dates too (if desired)
            const activeStart = initialMetadata.filter(s => isSameDay(date, new Date(s.startDate)));
            activeStart.forEach(() => events.push({ color: 'bg-emerald-500', title: 'Training Start Date' }));


            if (events.length > 0) {
                return (
                    <div className="flex flex-col gap-0.5 mt-1 w-full px-1">
                        {events.map((evt, idx) => (
                            <div
                                key={idx}
                                className={`h-1 w-full rounded-full ${evt.color}`}
                                title={evt.title}
                            />
                        ))}
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
            const scale = 3;
            const padding = 40;

            canvas.width = (img.width * scale) + (padding * 2);
            canvas.height = (img.height * scale) + (padding * 2);

            if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, padding, padding, img.width * scale, img.height * scale);
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
            {isLoading && <LoadingScreen />}

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
                                onChange={handleDateChange}
                                value={date}
                                tileContent={tileContent}
                                className="w-full"
                            />
                            <div className="flex gap-4 mt-4 text-xs justify-center flex-wrap">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-slate-500">Start Date</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                    <span className="text-slate-500">End Date</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-slate-500">Post-Training (30days) Feedback Deadline</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <TrainerManager trainers={trainers} />
                </div>

                {/* RIGHT COLUMN */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6">
                    {/* Stats & Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Session Overview Card */}
                        <div className="bg-blue-700 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between">
                            <LayoutDashboard className="absolute -right-8 -bottom-8 text-white/10" size={150} />

                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Clock size={18} /> Session Overview
                                </h3>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Active Count */}
                                    <div>
                                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Active</p>
                                        <h3 className="text-4xl font-black">
                                            {sessions.filter(s => !s.emailsSent).length}
                                        </h3>
                                        <div className="mt-2 text-[10px] font-medium opacity-80">
                                            In Progress
                                        </div>
                                    </div>

                                    {/* Completed Count */}
                                    <div className="border-l border-blue-500/30 pl-8">
                                        <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest mb-1">Completed</p>
                                        <h3 className="text-4xl font-black text-emerald-100">
                                            {sessions.filter(s => s.emailsSent).length}
                                        </h3>
                                        <div className="mt-2 text-[10px] font-medium opacity-80 text-emerald-100">
                                            Finished
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Create Session */}
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
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 justify-between flex-wrap">
                            <div className="flex items-center gap-2">
                                <QrCode className="text-blue-700" size={20} />
                                <h2 className="text-lg font-bold text-slate-900">
                                    {date ? `Sessions for ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Active Sessions'}
                                </h2>
                            </div>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium italic">No sessions scheduled for this date.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((t) => {
                                    const trainingFeedbackCount = t.enrollments.filter((e: any) => e.trainingRating != null).length;
                                    const postFeedbackCount = t.enrollments.filter((e: any) => e.averageRating != null || e.q1_Relevance != null).length;

                                    // Determine the effective status (Optimistic > Server Data)
                                    const isAutoSendEnabled = optimisticToggles[t.id] ?? t.sendFeedbackAutomatically;

                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => {
                                                // setIsNavigating(true); // Don't trigger loading screen just for navigation for now
                                                router.push(`/admin/dashboard/session/${t.id}`);
                                            }}
                                            className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer relative"
                                        >
                                            {/* ROW 1: Program Name and Dates - Moved to Top Level */}
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                                                        {t.programName}
                                                    </h3>
                                                    {t.emailsSent ? (
                                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200 uppercase tracking-wide flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> Completed
                                                        </span>
                                                    ) : (
                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 uppercase tracking-wide flex items-center gap-1 animate-pulse">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap md:flex-nowrap items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-full md:w-auto">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarIcon size={14} className="text-blue-500" />
                                                        <span>StartDate: {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                    <div className="hidden md:block w-px h-3 bg-slate-300 mx-1"></div>
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarIcon size={14} className="text-emerald-500" />
                                                        <span>EndDate: {new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* LOWER SECTION: Metrics + QR Code */}
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                                <div className="flex-1 space-y-4">

                                                    {/* Unified Grid for Perfect Alignment */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-2">
                                                        {/* Left Col: Trainer */}
                                                        <div className="flex items-center gap-3 h-full">
                                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0">
                                                                <UserCheck size={18} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Trainer</span>
                                                                <span className="font-bold text-slate-900 text-sm block">{t.trainerName || 'N/A'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Right Col: Training Feedback */}
                                                        <div className="flex items-center gap-3 h-full">
                                                            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 shrink-0">
                                                                <CheckCircle2 size={18} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Training Feedback</span>
                                                                <span className="font-bold text-slate-900 text-sm block">{trainingFeedbackCount} <span className="text-slate-400 text-xs font-medium">/ {t.enrollments.length} submitted</span></span>
                                                            </div>
                                                        </div>

                                                        {/* Left Col: Enable Button */}
                                                        <div className="flex flex-wrap items-center gap-3 h-full">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleSessionEmail(t.id, isAutoSendEnabled, t.sendFeedbackAutomatically);
                                                                    }}
                                                                    className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none shrink-0 ${isAutoSendEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                                >
                                                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] shadow-sm transition-all duration-200 ease-in-out ${isAutoSendEnabled ? 'left-[18px]' : 'left-[3px]'}`} />
                                                                </button>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isAutoSendEnabled ? 'text-blue-700' : 'text-slate-400'}`}>
                                                                    {isAutoSendEnabled ? 'Auto-Send On' : 'Enable to send Post Training Performance Feedback'}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!confirm("Send feedback emails to all participants?")) return;
                                                                    await sendFeedbackEmails(t.id);
                                                                }}
                                                                disabled={t.emailsSent}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all shrink-0 ${t.emailsSent
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95'
                                                                    }`}
                                                            >
                                                                <Mail size={12} />
                                                                {t.emailsSent ? 'Sent' : 'Send Manually'}
                                                            </button>
                                                        </div>

                                                        {/* Right Col: PFA Date */}
                                                        <div className="flex items-center h-full">
                                                            {t.feedbackCreationDate ? (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-red-50 p-2 rounded-lg text-red-600 shrink-0">
                                                                        <Clock size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5"> POST TRAINING (30 DAYS) FEEDBACK DATE</span>
                                                                        <span className="font-bold text-slate-900 text-sm block">{new Date(t.feedbackCreationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-3 opacity-50">
                                                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-400 shrink-0">
                                                                        <Clock size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">30 Days Post Feedback Date</span>
                                                                        <span className="font-medium text-slate-400 text-sm block">Not Scheduled</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* ROW 4: 30-Day Feedback (Full Width) */}
                                                    <div className="pt-2 border-t border-slate-100 mt-1">
                                                        <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors -ml-2 -mr-2">
                                                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600 shrink-0">
                                                                <Users size={18} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">POST TRAINING (30 DAYS) PERFORMANCE FEEDBACK</span>
                                                                <span className="font-bold text-slate-900 text-sm">{postFeedbackCount} <span className="text-slate-400 text-xs font-medium">/ {t.enrollments.length} submitted</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* QR Code */}
                                                <div
                                                    className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <QRCode
                                                            id={`qr-${t.id}`}
                                                            value={`https://templtrainingportal.vercel.app/join/${t.id}`}
                                                            size={150}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-2 mt-3">
                                                        <a
                                                            href={`/join/${t.id}`}
                                                            target="_blank"
                                                            className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Live Link <ExternalLink size={10} />
                                                        </a>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadQRCode(t.id, t.programName);
                                                            }}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                                        >
                                                            <Download size={10} /> Download
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

        </div>
    );
}
