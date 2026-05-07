import EventCalendar, { CalendarEvent } from '@/components/ui/EventCalendar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = {
    title: 'Training Schedule',
};

// Mock events for demonstration
const sampleEvents: CalendarEvent[] = [
    {
        id: 1,
        title: 'Safety Training L1',
        date: new Date().toISOString(), // Today
        time: '09:00 AM',
        color: 'emerald',
    },
    {
        id: 2,
        title: 'Leadership Workshop',
        date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
        time: '01:00 PM',
        color: 'blue',
    },
    {
        id: 3,
        title: 'Emergency Drill',
        date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
        time: '10:30 AM',
        color: 'rose',
    },
    {
        id: 4,
        title: 'New Hire Orientation',
        date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        color: 'violet',
    },
    {
        id: 5,
        title: 'Equipment Maintenance',
        date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
        time: '04:00 PM',
        color: 'amber',
    }
];

export default function CalendarPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <AdminHeader />
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Schedule</h1>
                    <p className="text-slate-500 font-medium mt-1">Overview of all upcoming training sessions and events.</p>
                </div>
                
                <EventCalendar events={sampleEvents} />
            </main>
        </div>
    );
}
