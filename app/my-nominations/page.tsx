'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

// Define what a Nomination looks like
interface Nomination {
    nomination_id: number;
    nominee_name: string;
    category: string;
    nominee_site: string;
    status: string;
    submitted_at: string;
}

export default function MyNominations() {
    const [email, setEmail] = useState('');
    const [nominations, setNominations] = useState<Nomination[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/my-nominations?email=${email}`);
            const data = await res.json();
            setNominations(data.nominations || []);
            setSearched(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8 flex justify-center">
            <div className="max-w-4xl w-full">
                {/* Navigation / Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Nominations</h1>
                    <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
                </div>

                {/* Search Box */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <input
                            type="email"
                            placeholder="Enter your email to view your submissions..."
                            className="flex-1 border border-gray-300 p-3 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Find Nominations'}
                        </button>
                    </form>
                </div>

                {/* Results List */}
                {searched && (
                    <div className="space-y-4">
                        {nominations.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                                <p className="text-gray-500 text-lg">No nominations found for this email.</p>
                                <p className="text-gray-400 text-sm mt-1">Make sure you are using the exact email you submitted with.</p>
                            </div>
                        ) : (
                            nominations.map((nom) => (
                                <div key={nom.nomination_id} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex flex-col md:flex-row justify-between items-center gap-4">

                                    {/* Info Section */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{nom.nominee_name}</h3>
                                        <div className="text-gray-600 text-sm mt-1 space-x-3">
                                            <span>📍 {nom.nominee_site}</span>
                                            <span>🏷️ {nom.category}</span>
                                        </div>
                                        <div className="mt-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${nom.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                nom.status === 'Pending Manager' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                Status: {nom.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Edit Button - UPDATED TO 'MODIFY' */}
                                    <Link
                                        href={`/modify/${nom.nomination_id}`}
                                        className="bg-white text-blue-600 px-6 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 font-semibold transition shadow-sm whitespace-nowrap"
                                    >
                                        Edit ✏️
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}