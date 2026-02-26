'use client';

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import QRCode from "react-qr-code";
import Link from 'next/link';
import {
    HiOutlineCalendar,
    HiOutlineUsers,
    HiOutlineArrowRight,
    HiOutlinePlusCircle,
    HiOutlineSquares2X2,
    HiOutlineClock,
    HiOutlineUser,
    HiOutlineCheckCircle,
    HiOutlineCalendarDays,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineArrowDownTray,
    HiOutlineShare,
    HiOutlineLink,
    HiOutlineClipboard,
    HiOutlinePhoto,
    HiOutlineCheck
} from 'react-icons/hi2';
import { getTrainingSessionsForDate } from '@/app/actions/sessions';
import { SessionWithDetails } from '@/types/sessions';
import LoadingScreen from '@/app/loading';
import { useRouter } from 'next/navigation';
import CreateSessionModal from '@/components/admin/CreateSessionModal';

type Trainer = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
};

type SessionsDashboardProps = {
    initialSessions: SessionWithDetails[];
    initialMetadata: any[];
    initialTrainers: Trainer[];
    programs: any[];
    locations: any[];
    currentTrainerName?: string;
};

export default function TrainerSessionsDashboard({
    initialSessions,
    initialMetadata,
    initialTrainers,
    programs,
    locations,
    currentTrainerName
}: SessionsDashboardProps) {
    const [date, setDate] = useState<any>(new Date());
    const [sessions, setSessions] = useState<SessionWithDetails[]>(initialSessions);
    const [isLoading, setIsLoading] = useState(false);
    const [origin, setOrigin] = useState('');
    const [activeShareId, setActiveShareId] = useState<string | null>(null);

    // Track copied state for different actions
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    const [copiedImage, setCopiedImage] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Close if clicking outside the popover or share button
            // This is a simple global close, can be refined with refs if needed
            setActiveShareId(null);
        };
        // Add listener with a small delay to prevent immediate closing when clicking the toggle button
        // Logic handled by e.stopPropagation on the button itself usually
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Initial Load
    useEffect(() => {
        setSessions(initialSessions);
    }, [initialSessions]);

    const handleDateChange = async (newDate: any) => {
        setDate(newDate);
        setIsLoading(true);
        try {
            const offset = newDate.getTimezoneOffset();
            const localDate = new Date(newDate.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];

            const result = await getTrainingSessionsForDate(dateStr);
            setSessions(result as any);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isSameDay = (date1: Date, date2: Date) => {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const events: { color: string; title: string }[] = [];
            const hasSessionStart = initialMetadata.some(s => isSameDay(date, new Date(s.startDate)));
            if (hasSessionStart) events.push({ color: 'bg-blue-600', title: 'Training Start Date' });

            if (events.length > 0) {
                return (
                    <div className="flex flex-col gap-0.5 mt-1 w-full px-1">
                        {events.map((evt, idx) => (
                            <div key={idx} className={`h-1 w-full rounded-full ${evt.color}`} title={evt.title} />
                        ))}
                    </div>
                );
            }
        }
        return null;
    };

    // --- QR Code Helper ---
    const getQRBlob = (sessionId: string): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const svg = document.getElementById(`qr-${sessionId}`);
            if (!svg) {
                resolve(null);
                return;
            }

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

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/png');
                } else {
                    resolve(null);
                }
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        });
    };

    // --- Actions ---

    const handleCopyLink = async (sessionId: string, batchId: string | undefined) => {
        const link = batchId ? `${origin}/enroll/${batchId}` : `${origin}/join/${sessionId}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopiedLink(sessionId);
            setTimeout(() => setCopiedLink(null), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const handleCopyQR = async (id: string) => {
        try {
            const blob = await getQRBlob(id);
            if (blob) {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                setCopiedImage(id);
                setTimeout(() => setCopiedImage(null), 2000);
            }
        } catch (err) {
            console.error('Failed to copy QR image', err);
            alert('Failed to copy image. Browser might not support this.');
        }
    };

    const handleDownloadQR = async (id: string, programName: string) => {
        const blob = await getQRBlob(id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            downloadLink.download = `${programName}-QR.png`;
            downloadLink.href = url;
            downloadLink.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            {isLoading && <LoadingScreen />}

            <main className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                {/* LEFT COLUMN */}
                <div className="w-full lg:w-1/3 space-y-8">
                    <div className="bg-white rounded-3xl shadow-air border border-slate-100 p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <HiOutlineCalendar className="text-blue-700" size={20} />
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
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span className="text-slate-500">Start Date</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="w-full lg:w-2/3 flex flex-col gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-blue-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between">
                            <HiOutlineSquares2X2 className="absolute -right-8 -bottom-8 text-white/10" size={150} />
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <HiOutlineClock size={18} /> Session Overview
                                </h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Active</p>
                                        <h3 className="text-4xl font-black">
                                            {sessions.filter(s => s.nominationBatch?.status !== 'Completed').length}
                                        </h3>
                                        <div className="mt-2 text-[10px] font-medium opacity-80">In Progress</div>
                                    </div>
                                    <div className="border-l border-blue-500/30 pl-8">
                                        <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest mb-1">Completed</p>
                                        <h3 className="text-4xl font-black text-emerald-100">
                                            {sessions.filter(s => s.nominationBatch?.status === 'Completed').length}
                                        </h3>
                                        <div className="mt-2 text-[10px] font-medium opacity-80 text-emerald-100">Finished</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-air border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-3 bg-blue-50 rounded-full text-blue-700">
                                <HiOutlinePlusCircle size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">New Training Session</h3>
                                <p className="text-xs text-slate-500 mt-1">Configure dates and assign a trainer.</p>
                            </div>
                            <CreateSessionModal trainers={initialTrainers} programs={programs} locations={locations} fixedTrainerName={currentTrainerName} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-air border border-slate-100 p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 justify-between flex-wrap">
                            <div className="flex items-center gap-2">
                                <HiOutlineCalendarDays className="text-blue-700" size={20} />
                                <h2 className="text-lg font-bold text-slate-900">
                                    {date ? `Sessions for ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Active Sessions'}
                                </h2>
                            </div>
                            <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                                {sessions.length} Found
                            </span>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium italic">No sessions scheduled for this date.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-300 hover:shadow-air-md transition-all group cursor-pointer flex flex-col md:flex-row gap-6 items-center"
                                        onClick={() => router.push(`/trainer/sessions/${session.id}/manage`)}
                                    >
                                        {/* LEFT SIDE: Main Info & Details */}
                                        <div className="flex-1 w-full space-y-4">

                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-black text-lg text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                                                            {session.programName}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 border ${session.nominationBatch?.status === 'Completed'
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                                            }`}>
                                                            {session.nominationBatch?.status === 'Completed' ? <HiOutlineCheckCircle size={10} /> : <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                                                            {session.nominationBatch?.status || 'Scheduled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 font-medium">
                                                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <HiOutlineCalendar size={14} className="text-blue-500" />
                                                    <span className="font-semibold">
                                                        {new Date(session.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        <span className="text-slate-300 mx-1.5">–</span>
                                                        {new Date(session.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="hidden md:block w-px h-5 bg-slate-200"></div>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 bg-blue-50 text-blue-600 rounded-md">
                                                        <HiOutlineUser size={14} />
                                                    </div>
                                                    <span className="text-slate-600">
                                                        Trainer: <span className="font-bold text-slate-900">{session.trainerName || 'Unassigned'}</span>
                                                    </span>
                                                </div>
                                                <div className="hidden md:block w-px h-5 bg-slate-200"></div>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md">
                                                        <HiOutlineUsers size={14} />
                                                    </div>
                                                    <span className="text-slate-600">
                                                        Participants: <span className="font-bold text-slate-900">{session.nominationBatch?.nominations.length || 0}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-2">
                                                <button className="w-full md:w-auto px-6 mt-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 group/btn">
                                                    Manage Session
                                                    <HiOutlineArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* RIGHT SIDE: QR Code + Share */}
                                        <div
                                            className="hidden md:flex flex-col items-center gap-3 shrink-0 pl-6 md:border-l md:border-slate-100"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                                <QRCode
                                                    id={`qr-${session.id}`}
                                                    value={session.nominationBatch?.id
                                                        ? `${origin}/enroll/${session.nominationBatch.id}`
                                                        : `${origin}/join/${session.id}`
                                                    }
                                                    size={80}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 w-full items-center relative">
                                                {/* Share Popover */}
                                                {activeShareId === session.id && (
                                                    <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 bg-slate-800 text-white p-1.5 rounded-lg shadow-xl flex items-center gap-1 z-20 min-w-max border border-slate-700/50 animation-fade-in-up">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyLink(session.id, session.nominationBatch?.id);
                                                            }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-700 rounded-md transition-colors text-white text-[10px] font-bold tracking-wide"
                                                            title="Copy Link"
                                                        >
                                                            {copiedLink === session.id ? <HiOutlineCheck size={14} className="text-emerald-400" /> : <HiOutlineLink size={14} />} Link
                                                        </button>
                                                        <div className="w-px h-4 bg-slate-700"></div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyQR(session.id);
                                                            }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-700 rounded-md transition-colors text-white text-[10px] font-bold tracking-wide"
                                                            title="Copy QR Image"
                                                        >
                                                            {copiedImage === session.id ? <HiOutlineCheck size={14} className="text-emerald-400" /> : <HiOutlinePhoto size={14} />} QR
                                                        </button>
                                                        <div className="w-px h-4 bg-slate-700"></div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadQR(session.id, session.programName);
                                                            }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-700 rounded-md transition-colors text-white text-[10px] font-bold tracking-wide"
                                                            title="Download QR"
                                                        >
                                                            <HiOutlineArrowDownTray size={14} /> Save
                                                        </button>

                                                        {/* Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveShareId(activeShareId === session.id ? null : session.id);
                                                    }}
                                                    className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${activeShareId === session.id ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                >
                                                    <HiOutlineShare size={12} /> Share QR
                                                </button>
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
