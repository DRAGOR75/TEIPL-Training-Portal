'use client';

import { useState } from 'react';
import { updateEmployeeProfile } from '@/app/actions/tni';

type Employee = {
    id: string;
    name: string;
    email: string;
    grade: string | null;
    sectionName: string | null;
    location: string | null;
    manager_name: string | null;
    manager_email: string | null;
};

type Section = {
    id: string;
    name: string;
};

export default function TNIProfile({ employee, sections }: { employee: Employee, sections: Section[] }) {
    const [isEditing, setIsEditing] = useState(!employee.name);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: employee.name,
        email: employee.email,
        grade: employee.grade || '',
        sectionName: employee.sectionName || '',
        location: employee.location || '',
        manager_name: employee.manager_name || '',
        manager_email: employee.manager_email || ''
    });

    async function handleSave() {
        setLoading(true);
        // Basic validation
        if (!formData.name || !formData.email || !formData.sectionName || !formData.grade) {
            alert('Please fill all required fields');
            setLoading(false);
            return;
        }

        const res = await updateEmployeeProfile(employee.id, {
            name: formData.name,
            email: formData.email,
            grade: formData.grade as any,
            sectionName: formData.sectionName,
            location: formData.location,
            manager_name: formData.manager_name,
            manager_email: formData.manager_email
        });

        if (res.error) {
            alert(res.error);
        } else {
            setIsEditing(false);
            // Optionally update local state with returned data if server normalized it
            // For now simple binding is fine
        }
        setLoading(false);
    }

    if (isEditing) {
        return (
            <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-slate-800">Edit Profile</h2>
                    <div className="space-x-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="text-slate-500 text-sm hover:text-slate-800 px-3 py-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded hover:bg-slate-800 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Employee ID</label>
                        <div className="text-lg font-medium text-slate-400 cursor-not-allowed">{employee.id}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                        <input
                            className="w-full text-lg p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Grade / Level</label>
                        <select
                            className="w-full text-lg p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            value={formData.grade}
                            onChange={e => setFormData({ ...formData, grade: e.target.value })}
                        >
                            <option value="">Select Grade</option>
                            <option value="EXECUTIVE">EXECUTIVE</option>
                            <option value="WORKMAN">WORKMAN</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Department / Section</label>
                        <select
                            className="w-full text-lg p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            value={formData.sectionName}
                            onChange={e => setFormData({ ...formData, sectionName: e.target.value })}
                        >
                            <option value="">Select Section</option>
                            {sections.map(sec => (
                                <option key={sec.id} value={sec.name}>{sec.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                        <input
                            className="w-full text-lg p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Location</label>
                        <input
                            className="w-full text-lg p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none placeholder-slate-500"
                            value={formData.location}
                            placeholder="e.g. Joda"
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Manager Name</label>
                        <input
                            className="w-full text-lg p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none placeholder-slate-500"
                            value={formData.manager_name}
                            placeholder="e.g. John Doe"
                            onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Manager Email</label>
                        <input
                            className="w-full text-lg p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none placeholder-slate-500"
                            value={formData.manager_email}
                            placeholder="e.g. manager@thriveni.com"
                            onChange={e => setFormData({ ...formData, manager_email: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800">My Profile</h2>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 text-sm font-medium hover:underline"
                >
                    Edit Details
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Employee ID</label>
                    <div className="text-lg font-medium text-slate-900">{employee.id}</div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Full Name</label>
                    <div className="text-lg font-medium text-slate-900">{formData.name}</div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Grade / Level</label>
                    <div className="text-lg font-medium text-slate-900">{formData.grade}</div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Department / Section</label>
                    <div className="text-lg font-medium text-slate-900">{formData.sectionName || 'Not Set'}</div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Email</label>
                    <div className="text-lg font-medium text-slate-900">{formData.email}</div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Location</label>
                    <div className="text-lg font-medium text-slate-900">{formData.location || 'Not Set'}</div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Manager</label>
                    <div className="text-lg font-medium text-slate-900">{formData.manager_name || 'Not Set'}</div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Manager Email</label>
                    <div className="text-lg font-medium text-slate-900">{formData.manager_email || 'Not Set'}</div>
                </div>
            </div>
        </div>
    );
}
