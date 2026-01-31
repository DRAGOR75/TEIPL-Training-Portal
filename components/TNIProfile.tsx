"use client"
import { useState, useEffect } from 'react';
import { updateEmployeeProfile } from '@/app/actions/tni';
import {
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineMapPin,
    HiOutlineBriefcase,
    HiOutlineUserCircle,
    HiOutlinePencil,
    HiOutlineCheck,
    HiOutlineXMark
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import SearchableSelect from './ui/SearchableSelect';
import { getDesignations, getLocations } from '@/app/actions/master-data';

type Employee = {
    id: string;
    name: string;
    email: string;
    grade: string | null;
    sectionName: string | null;
    location: string | null;
    mobile: string | null;
    designation: string | null;
    yearsOfExperience: string | null;
    subDepartment: string | null;
    managerName: string | null;
    managerEmail: string | null;
};

type Section = {
    id: string;
    name: string;
};

export default function TNIProfile({ employee, sections }: { employee: Employee, sections: Section[] }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(!employee.name);
    const [loading, setLoading] = useState(false);

    // Options for searchable selects
    const [designationOptions, setDesignationOptions] = useState<{ label: string, value: string }[]>([]);
    const [locationOptions, setLocationOptions] = useState<{ label: string, value: string }[]>([]);

    useEffect(() => {
        if (isEditing) {
            Promise.all([getDesignations(), getLocations()]).then(([desigs, locs]) => {
                setDesignationOptions(desigs);
                setLocationOptions(locs);
            });
        }
    }, [isEditing]);

    // Form State
    const [formData, setFormData] = useState({
        name: employee.name,
        email: employee.email,
        grade: employee.grade || '',
        sectionName: employee.sectionName || '',
        location: employee.location || '',
        mobile: employee.mobile || '',
        designation: employee.designation || '',
        yearsOfExperience: employee.yearsOfExperience || '',
        subDepartment: employee.subDepartment || '',
        managerName: employee.managerName || '',
        managerEmail: employee.managerEmail || ''
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
            mobile: formData.mobile,
            designation: formData.designation,
            yearsOfExperience: formData.yearsOfExperience,
            subDepartment: formData.subDepartment,
            managerName: formData.managerName,
            managerEmail: formData.managerEmail
        });

        if (res.error) {
            alert(res.error);
        } else {
            setIsEditing(false);
            router.refresh(); // Refresh server data
        }
        setLoading(false);
    }

    if (isEditing) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 h-full">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <HiOutlinePencil size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 text-slate-500 text-sm font-medium hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <HiOutlineXMark size={16} /> Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <HiOutlineCheck size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Employee ID</label>
                        <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm">{employee.id}</div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                        <input
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                            placeholder="Your Full Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mobile Number</label>
                        <input
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                            placeholder="+91..."
                            value={formData.mobile}
                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Designation</label>
                        <div className="relative">
                            <SearchableSelect
                                options={designationOptions}
                                value={formData.designation}
                                onChange={(val) => setFormData({ ...formData, designation: typeof val === 'string' ? val : String(val) })}
                                placeholder="Select Role"
                                searchPlaceholder="Search..."
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Years of Exp.</label>
                        <input
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                            placeholder="e.g. 5 Years"
                            value={formData.yearsOfExperience}
                            onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Grade / Level</label>
                        <select
                            className={`w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all font-medium ${formData.grade ? 'text-slate-900' : 'text-slate-500'}`}
                            value={formData.grade}
                            onChange={e => setFormData({ ...formData, grade: e.target.value })}
                        >
                            <option value="">Select Grade</option>
                            <option value="EXECUTIVE">EXECUTIVE</option>
                            <option value="WORKMAN">WORKMAN</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Department</label>
                        <select
                            className={`w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all font-medium ${formData.sectionName ? 'text-slate-900' : 'text-slate-500'}`}
                            value={formData.sectionName}
                            onChange={e => setFormData({ ...formData, sectionName: e.target.value })}
                        >
                            <option value="">Select Section</option>
                            {sections.map(sec => (
                                <option key={sec.id} value={sec.name}>{sec.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sub-Department</label>
                        <input
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                            placeholder="e.g. Maintenance"
                            value={formData.subDepartment}
                            onChange={e => setFormData({ ...formData, subDepartment: e.target.value })}
                        />
                    </div> 
                    */}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email</label>
                        <input
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Location</label>
                        <div className="relative">
                            <SearchableSelect
                                options={locationOptions}
                                value={formData.location}
                                onChange={(val) => setFormData({ ...formData, location: typeof val === 'string' ? val : String(val) })}
                                placeholder="Select Site"
                                searchPlaceholder="Search locations..."
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Manager Name</label>
                        <input
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                            value={formData.managerName}
                            placeholder="Your Manager Name"
                            onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Manager Email</label>
                        <input
                            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-900 font-medium"
                            value={formData.managerEmail}
                            placeholder="Your Manager Email"
                            onChange={e => setFormData({ ...formData, managerEmail: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-tr from-slate-50 to-white">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm text-slate-400">
                        <HiOutlineUserCircle size={40} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{employee.name || 'Set Full Name'}</h2>
                        <div className="flex flex-col gap-1 mt-1">
                            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs uppercase tracking-wide text-slate-600 font-bold border border-slate-200">
                                    {employee.id}
                                </span>
                                {employee.grade && (
                                    <span className="bg-blue-50 px-2 py-0.5 rounded text-xs uppercase tracking-wide text-blue-700 font-bold border border-blue-100">
                                        {employee.grade}
                                    </span>
                                )}
                            </p>
                            {employee.designation && (
                                <p className="text-xs font-semibold text-slate-600">
                                    {employee.designation}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <HiOutlinePencil size={18} />
                </button>
            </div>

            <div className="p-6 space-y-5">

                <div className="flex items-start gap-3 group">
                    <div className="mt-0.5 text-slate-400 group-hover:text-blue-500 transition-colors"><HiOutlineBriefcase size={18} /></div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Department</label>
                        <div className="text-sm font-semibold text-slate-900">
                            {formData.sectionName || 'Not Set'}
                            {/* {formData.subDepartment && <span className="text-slate-400 font-normal"> • {formData.subDepartment}</span>} */}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3 group">
                    <div className="mt-0.5 text-slate-400 group-hover:text-amber-500 transition-colors"><HiOutlineEnvelope size={18} /></div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Email</label>
                        <div className="text-sm font-semibold text-slate-900">{formData.email}</div>
                    </div>
                </div>

                <div className="flex items-start gap-3 group">
                    <div className="mt-0.5 text-slate-400 group-hover:text-emerald-500 transition-colors"><HiOutlineMapPin size={18} /></div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Location</label>
                        <div className="text-sm font-semibold text-slate-900">{formData.location || 'Not Set'}</div>
                    </div>
                </div>

                {formData.mobile && (
                    <div className="flex items-start gap-3 group">
                        <div className="mt-0.5 text-slate-400 group-hover:text-teal-500 transition-colors"><HiOutlineUser size={18} /></div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Mobile</label>
                            <div className="text-sm font-semibold text-slate-900">{formData.mobile}</div>
                        </div>
                    </div>
                )}

                {/* Experience */}
                {formData.yearsOfExperience && (
                    <div className="flex items-start gap-3 group">
                        <div className="mt-0.5 text-slate-400 group-hover:text-orange-500 transition-colors"><HiOutlineBriefcase size={18} /></div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Experience</label>
                            <div className="text-sm font-semibold text-slate-900">{formData.yearsOfExperience}</div>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-start gap-3 group">
                        <div className="mt-0.5 text-slate-400 group-hover:text-purple-500 transition-colors"><HiOutlineUser size={18} /></div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Manager Details</label>
                            <div className="text-sm font-semibold text-slate-900">{formData.managerName || 'Not Set'}</div>
                            <div className="text-xs text-slate-500">{formData.managerEmail || ''}</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
