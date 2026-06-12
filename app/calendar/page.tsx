import { getCalendarEvents } from '@/app/actions/calendar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import EmployeeCalendarClient from '@/components/user/EmployeeCalendarClient';

export default async function EmployeeCalendarPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/api/auth/signin');
    }

    // Pass forUser = true to only get 'Forming' (open) batches
    const events = await getCalendarEvents(true);

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Training Calendar</h1>
                    <p className="text-slate-500 font-medium mt-2">Browse pre-scheduled training programs and nominate yourself.</p>
                </div>
                
                {/* Need to pass down empId? Wait, the employee record needs to be linked to user email. */}
                <EmployeeCalendarClient events={events} userEmail={session.user.email} />
            </div>
        </main>
    );
}
