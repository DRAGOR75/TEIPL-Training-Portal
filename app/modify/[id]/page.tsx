'use client';

import { useState, useEffect, ChangeEvent, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';

// In Next.js 15+, params is a Promise. We use the 'use' hook or await it (if async component).
// Since this is a client component ('use client'), we simply treat params as a Promise.

export default function EditNomination({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    // 1. Unwrap the params using the React 'use' hook (Standard for Next.js 15)
    // If you are on Next.js 14, you can usually just access params.id directly,
    // but let's make it robust for both.
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [formData, setFormData] = useState({
        empId: '', nomineeName: '', site: '', designation: '',
        nomineeEmail: '', mobile: '', experience: '',
        justification: ''
    });
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/nomination/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        empId: data.nominee_emp_id || '',
                        nomineeName: data.nominee_name || '',
                        site: data.nominee_site || '',
                        designation: data.nominee_designation || '',
                        nomineeEmail: data.nominee_email || '',
                        mobile: data.nominee_mobile || '',
                        experience: data.nominee_experience || '',
                        justification: data.justification || ''
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchData();
    }, [id]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('saving');

        const res = await fetch(`/api/nomination/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            setStatus('success');
            setTimeout(() => router.push('/my-nominations'), 1500);
        } else {
            setStatus('error');
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-blue-600">Loading nomination...</div>;

    return (
        <main className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Nomination</h1>

                {status === 'success' && (
                    <div className="bg-green-100 text-green-800 p-4 rounded mb-4 border border-green-200">
                        ✅ Updated successfully! Redirecting...
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Emp ID</label>
                            <input required name="empId" value={formData.empId} onChange={handleChange} className="w-full border p-3 rounded text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nominee Name</label>
                            <input required name="nomineeName" value={formData.nomineeName} onChange={handleChange} className="w-full border p-3 rounded text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Site</label>
                            <input required name="site" value={formData.site} onChange={handleChange} className="w-full border p-3 rounded text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Designation</label>
                            <input required name="designation" value={formData.designation} onChange={handleChange} className="w-full border p-3 rounded text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nominee Email</label>
                            <input required name="nomineeEmail" value={formData.nomineeEmail} onChange={handleChange} className="w-full border p-3 rounded text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Mobile</label>
                            <input required name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border p-3 rounded text-black" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Experience</label>
                            <input required name="experience" value={formData.experience} onChange={handleChange} className="w-full border p-3 rounded text-black" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Justification</label>
                        <textarea required name="justification" value={formData.justification} rows={6} onChange={handleChange} className="w-full border p-3 rounded text-black"></textarea>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition font-semibold">Cancel</button>
                        <button type="submit" disabled={status === 'saving'} className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition font-bold shadow-md">
                            {status === 'saving' ? 'Saving...' : 'Update Nomination'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}