'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, MapPin, Tag, AlertCircle, Clock, CheckCircle2, Edit } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/nominations" className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Search size={20} className="text-emerald-600" />
                            Track & Edit Nominations
                        </h1>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-8">
                {/* Search Box */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Find Your Nominations</h2>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-3.5 text-slate-400">
                                <Search size={20} />
                            </span>
                            <input
                                type="email"
                                placeholder="Enter your email address..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {/* Results List */}
                {searched && (
                    <div className="space-y-4">
                        {nominations.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <Search size={48} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-slate-900 font-bold text-lg">No nominations found</h3>
                                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                                    We couldn't find any records for <span className="font-medium text-slate-900">{email}</span>. Check the spelling or try another email.
                                </p>
                            </div>
                        ) : (
                            nominations.map((nom) => (
                                <div key={nom.nomination_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">

                                    {/* Info Section */}
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between md:hidden w-full">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(nom.status)}`}>
                                                {getStatusIcon(nom.status)} {nom.status}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{nom.nominee_name}</h3>
                                        <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                <MapPin size={14} className="text-slate-400" />
                                                {nom.nominee_site}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                <Tag size={14} className="text-slate-400" />
                                                {nom.category}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                <Clock size={14} className="text-slate-400" />
                                                {new Date(nom.submitted_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions & Status Desktop */}
                                    <div className="flex items-center gap-4 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
                                        <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(nom.status)}`}>
                                            {getStatusIcon(nom.status)} {nom.status}
                                        </span>

                                        <Link
                                            href={`/modify/${nom.nomination_id}`}
                                            className="inline-flex items-center gap-2 bg-white text-slate-700 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 font-bold text-sm transition shadow-sm active:scale-95"
                                        >
                                            <Edit size={16} /> Edit
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function getStatusStyles(status: string) {
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Pending Manager') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
}

function getStatusIcon(status: string) {
    if (status === 'Approved') return <CheckCircle2 size={12} />;
    if (status === 'Pending Manager') return <Clock size={12} />;
    return <AlertCircle size={12} />;
}