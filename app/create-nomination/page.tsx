'use client';

import { useState, ChangeEvent, FormEvent } from 'react';

// Define the shape of our form data
interface FormData {
    nominatorName: string;
    nominatorEmail: string;
    empId: string;
    nomineeName: string;
    site: string;
    designation: string;
    managerName: string;
    managerEmail: string;
    nomineeEmail: string;
    mobile: string;
    experience: string;
    justification: string;
}

export default function Home() {
    const [formData, setFormData] = useState<FormData>({
        nominatorName: '',
        nominatorEmail: '',
        empId: '',
        nomineeName: '',
        site: '',
        designation: '',
        managerName: '',
        managerEmail: '',
        nomineeEmail: '',
        mobile: '',
        experience: '',
        justification: ''
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // Typed change handler
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Typed submit handler
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus('success');
                // Optional: Reset form
                // setFormData({ ...initialState }); 
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <main className="min-h-screen bg-gray-100 py-10 px-4 flex items-center justify-center">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* Header */}
                <div className="bg-blue-600 p-8 text-white text-center">
                    <h1 className="text-3xl font-bold">Nomination Form</h1>
                    <p className="mt-2 text-blue-100">Recognize excellence. Submissions require manager approval.</p>
                </div>

                <div className="p-8">
                    {/* Status Messages */}
                    {status === 'success' && (
                        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-200 text-center">
                            ✅ <strong>Success!</strong> The nomination has been submitted and the approval email has been sent.
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-200 text-center">
                            ❌ <strong>Error.</strong> Something went wrong. Please check your connection and try again.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: Nominator */}
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <h2 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">1. Nominator Details (You)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                                    <input required name="nominatorName" value={formData.nominatorName} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Email</label>
                                    <input required name="nominatorEmail" value={formData.nominatorEmail} type="email" onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Nominee */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">2. Nominee Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sn / Emp ID</label>
                                    <input required name="empId" value={formData.empId} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-black" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name of Nominee</label>
                                    <input required name="nomineeName" value={formData.nomineeName} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-black" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Site</label>
                                    <input required name="site" value={formData.site} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-black" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                                    <input required name="designation" value={formData.designation} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-black" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nominee E-Mail ID</label>
                                    <input required name="nomineeEmail" value={formData.nomineeEmail} type="email" onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-black" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mob Number</label>
                                    <input required name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-black" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Year of Experience</label>
                                    <input required name="experience" value={formData.experience} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-black" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Manager */}
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                            <h2 className="text-lg font-bold text-yellow-800 mb-4 border-b border-yellow-300 pb-2">3. Reporting Manager (For Approval)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Name</label>
                                    <input required name="managerName" value={formData.managerName} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Email</label>
                                    <input required name="managerEmail" value={formData.managerEmail} type="email" onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-black" />
                                </div>
                            </div>
                        </div>

                        {/* Justification */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Justification / Reason</label>
                            <textarea required name="justification" value={formData.justification} rows={4} placeholder="Why does this person deserve the award?" onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"></textarea>
                        </div>

                        <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg">
                            {status === 'loading' ? 'Processing...' : 'Submit Nomination'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}