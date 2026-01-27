'use client';

import { useState } from 'react';
import { createSession } from '@/app/actions/sessions';
import { Loader2 } from 'lucide-react';

export default function SessionForm({ programs }: { programs: { id: string, name: string }[] }) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        setError(null);

        const res = await createSession(formData);

        if (res.error) {
            setError(res.error);
            setIsPending(false);
        } else {
            // Redirect happens in server action, but just in case
            window.location.href = `/admin/sessions/${res.sessionId}/manage`;
        }
    }

    return (
        <form action={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Session Details</h2>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Program</label>
                <select
                    name="programName"
                    required
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                    <option value="">Select a Program</option>
                    {programs.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500">The session will be linked to this program's batch.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        required
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        required
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Trainer Name</label>
                <input
                    type="text"
                    name="trainerName"
                    placeholder="e.g. Dr. Smith"
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isPending ? 'Creating...' : 'Create Session'}
                </button>
            </div>
        </form>
    );
}
