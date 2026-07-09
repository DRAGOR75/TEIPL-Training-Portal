"use client"
import { useState, useEffect } from 'react';
import { updateEmployeeProfile } from '@/app/actions/tni';
import {
    HiOutlinePencil,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineBriefcase,
    HiOutlineBuildingOffice2,
    HiOutlineIdentification,
    HiOutlineEnvelope,
    HiOutlinePhone,
    HiOutlineCalendar,
    HiOutlineShieldCheck,
    HiOutlineMapPin,
    HiOutlineMap,
    HiOutlineUsers,
    HiOutlineUserCircle,
    HiOutlineChevronDown,
    HiOutlineChevronUp
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
    doj: Date | null;
    dob: Date | null;
    projectLocation: string | null;
    gender: string | null;
    managerName: string | null;
    managerEmail: string | null;
    managerMobile: string | null;
    status: string | null;
    departmentGroup: string | null;
};

type Section = {
    id: string;
    name: string;
};

export default function TNIProfile({ employee, sections, employeeView = false }: { employee: Employee, sections: Section[], employeeView?: boolean }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(!employee.name);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const initials = employee.name
        ? employee.name
            .trim()
            .split(/\s+/)
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : 'EMP';

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
        id: employee.id,
        name: employee.name,
        email: employee.email,
        grade: employee.grade || '',
        sectionName: employee.sectionName || '',
        location: employee.location || '',
        gender: employee.gender || '',
        mobile: employee.mobile || '',
        designation: employee.designation || '',
        doj: employee.doj ? new Date(employee.doj).toISOString().split('T')[0] : '',
        dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
        projectLocation: employee.projectLocation || '',
        managerName: employee.managerName || '',
        managerEmail: employee.managerEmail || '',
        managerMobile: employee.managerMobile || '',
        status: employee.status || 'Active',
        departmentGroup: employee.departmentGroup || ''
    });

    async function handleSave() {
        setLoading(true);
        if (!formData.name || !formData.email || !formData.sectionName || !formData.grade) {
            alert('Please fill all required fields (Name, Email, Grade, and Section)');
            setLoading(false);
            return;
        }

        const res = await updateEmployeeProfile(employee.id, {
            newId: formData.id,
            name: formData.name,
            email: formData.email,
            grade: formData.grade as any,
            sectionName: formData.sectionName,
            location: formData.location,
            gender: formData.gender,
            mobile: formData.mobile,
            designation: formData.designation,
            doj: formData.doj ? new Date(formData.doj) : null,
            dob: formData.dob ? new Date(formData.dob) : null,
            projectLocation: formData.projectLocation,
            managerName: formData.managerName,
            managerEmail: formData.managerEmail,
            managerMobile: formData.managerMobile,
            status: formData.status
        });

        if (res.error) {
            alert(res.error);
        } else {
            setIsEditing(false);
            if (res.employee?.id && res.employee.id !== employee.id) {
                // If ID changed, and we are on a page that uses the ID in URL, we should redirect.
                const currentPath = window.location.pathname;
                if (currentPath.includes(`/tni/${employee.id}`)) {
                    router.push(`/tni/${res.employee.id}`);
                } else if (window.location.search.includes(`q=${employee.id}`)) {
                    router.push(`${currentPath}?q=${res.employee.id}`);
                } else {
                    router.refresh();
                }
            } else {
                router.refresh();
            }
        }
        setLoading(false);
    }

    if (isEditing) {
        return (
            <div className="w-full bg-white p-6 border border-slate-200 rounded-3xl shadow-sm transition-all duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Edit Profile Details</h2>
                        <p className="text-xs text-slate-500 font-medium">Provide updated information below</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[75vh] md:max-h-[60vh] overflow-y-auto pr-1 pb-4" style={{ scrollbarWidth: 'thin' }}>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Employee ID *</label>
                        <input
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            placeholder="Employee ID"
                            value={formData.id}
                            onChange={e => setFormData({ ...formData, id: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Name *</label>
                        <input
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address *</label>
                        <input
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mobile Number</label>
                        <input
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            placeholder="Mobile"
                            value={formData.mobile}
                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Gender</label>
                        <SearchableSelect
                            options={[
                                { label: 'Male', value: 'MALE' },
                                { label: 'Female', value: 'FEMALE' },
                                { label: 'Other', value: 'OTHER' }
                            ]}
                            value={formData.gender}
                            onChange={(val) => setFormData({ ...formData, gender: val })}
                            placeholder="Select Gender"
                            className="w-full text-base sm:text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Designation</label>
                        <SearchableSelect
                            options={designationOptions}
                            value={formData.designation}
                            onChange={(val) => setFormData({ ...formData, designation: typeof val === 'string' ? val : String(val) })}
                            placeholder="Select Designation"
                            searchPlaceholder="Search Designations..."
                            className="w-full text-base sm:text-xs font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date of Joining</label>
                        <input
                            type="date"
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            value={formData.doj}
                            onChange={e => setFormData({ ...formData, doj: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</label>
                        <input
                            type="date"
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            value={formData.dob}
                            onChange={e => setFormData({ ...formData, dob: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Grade / Level *</label>
                        <SearchableSelect
                            options={[
                                { label: 'EXECUTIVE', value: 'EXECUTIVE' },
                                { label: 'WORKMAN', value: 'WORKMAN' }
                            ]}
                            value={formData.grade}
                            onChange={(val) => setFormData({ ...formData, grade: val })}
                            placeholder="Select Grade"
                            className="w-full text-base sm:text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Section *</label>
                        <SearchableSelect
                            options={sections.map(sec => ({ label: sec.name, value: sec.name }))}
                            value={formData.sectionName}
                            onChange={(val) => setFormData({ ...formData, sectionName: val })}
                            placeholder="Select Section"
                            className="w-full text-base sm:text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Department Group</label>
                        <SearchableSelect
                            options={[
                                { label: 'ESCC', value: 'ESCC' },
                                { label: 'Operators', value: 'Operators' },

                                { label: 'Others', value: 'Others' }
                            ]}
                            value={formData.departmentGroup}
                            onChange={(val) => setFormData({ ...formData, departmentGroup: val })}
                            placeholder="Select Dept Group"
                            className="w-full text-base sm:text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Employment Status</label>
                        <SearchableSelect
                            options={[
                                { label: 'Active', value: 'Active' },
                                { label: 'Inactive', value: 'Inactive' }
                            ]}
                            value={formData.status}
                            onChange={(val) => setFormData({ ...formData, status: val })}
                            placeholder="Select Status"
                            className="w-full text-base sm:text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Region</label>
                        <SearchableSelect
                            options={locationOptions}
                            value={formData.location}
                            onChange={(val) => setFormData({ ...formData, location: typeof val === 'string' ? val : String(val) })}
                            placeholder="Select Location"
                            searchPlaceholder="Search location..."
                            className="w-full text-base sm:text-xs"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Name</label>
                        <input
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            value={formData.managerName}
                            placeholder="Manager Name"
                            onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Email</label>
                        <input
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            value={formData.managerEmail}
                            placeholder="Manager Email"
                            onChange={e => setFormData({ ...formData, managerEmail: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Manager Mobile</label>
                        <input
                            className="w-full text-base sm:text-xs px-4 py-3.5 sm:py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-slate-800"
                            value={formData.managerMobile}
                            placeholder="Manager Mobile"
                            onChange={e => setFormData({ ...formData, managerMobile: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition text-xs cursor-pointer shadow-sm"
                    >
                        <HiOutlineXMark size={14} /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-xs cursor-pointer shadow-lg shadow-blue-200"
                    >
                        <HiOutlineCheck size={14} /> {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div >
        );
    }

    return (
        <div className="w-full bg-white p-6 border border-slate-200 rounded-3xl shadow-sm flex flex-col gap-5">
            {/* Header Row */}
            <div
                className="flex justify-between items-center border-b border-slate-200 pb-3 cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        <HiOutlineIdentification size={20} className="text-thriveni-blue shrink-0" />
                        Employee Profile
                    </h2>
                    <div className="text-slate-400 group-hover:text-blue-600 transition-colors ml-2">
                        {isExpanded ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                    </div>
                </div>
                {!employeeView && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition text-xs cursor-pointer shadow-sm shadow-slate-100"
                    >
                        <HiOutlinePencil size={12} className="text-slate-500" />
                        <span>Edit Profile</span>
                    </button>
                )}
            </div>

            {employeeView && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-2.5 font-bold">
                    Note:*This information is  only used  for  training purposes .
                    <br />
                    *If you find any discrepancies in your profile please mail <span className="font-bold text-slate-900">cyn@thriveni.com,bvg@thriveni.com</span>,from your official mail id to update your details
                </div>
            )}

            {isExpanded && (
                <>
                    {/* Beautiful Profile Summary Card */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                        {/* Initials Avatar */}
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 font-black rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm border border-blue-100">
                            {initials}
                        </div>

                        {/* Name & Primary organizational info */}
                        <div className="flex-1 text-center sm:text-left min-w-0">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight block truncate">
                                {employee.name || 'Not Set'}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                                <span className="flex items-center justify-center sm:justify-start gap-1 text-blue-600 font-bold">
                                    <HiOutlineIdentification className="shrink-0" size={14} />
                                    {employee.id}
                                </span>
                                <span className="hidden sm:inline text-slate-300">•</span>
                                <span className="flex items-center justify-center sm:justify-start gap-1">
                                    <HiOutlineEnvelope className="shrink-0" size={14} />
                                    {employee.email || 'Email Not Set'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Profile Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Designation */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineBriefcase className="text-blue-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Designation</span>
                                <span className="text-xs font-bold text-slate-900 block truncate" title={employee.designation || 'Not Set'}>{employee.designation || 'Not Set'}</span>
                            </div>
                        </div>

                        {/* Section / Department */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineBuildingOffice2 className="text-emerald-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Section</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.sectionName || 'Not Set'}>{employee.sectionName || 'Not Set'}</span>
                            </div>
                        </div>

                        {/* Department Group */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineUsers className="text-blue-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department Group</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.departmentGroup || 'Not Set'}>{employee.departmentGroup || 'Not Set'}</span>
                            </div>
                        </div>

                        {/* Mobile Number */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-emerald-600 rounded-xl shrink-0">
                                <HiOutlinePhone className="text-amber-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.mobile || 'Not Set'}>{employee.mobile || 'Not Set'}</span>
                            </div>
                        </div>

                        {/* Date of Joining */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineCalendar className="text-red-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Joining / Exp</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.doj ? new Date(employee.doj).toLocaleDateString() : 'Not Set'}>
                                    {(() => {
                                        if (!employee.doj) return 'Not Set';
                                        const doj = new Date(employee.doj);
                                        const now = new Date();
                                        let years = now.getFullYear() - doj.getFullYear();
                                        let months = now.getMonth() - doj.getMonth();
                                        if (months < 0) {
                                            years--;
                                            months += 12;
                                        }
                                        return `${doj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (${years} Years, ${months} Months)`;
                                    })()}
                                </span>
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineCalendar className="text-purple-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.dob ? new Date(employee.dob).toLocaleDateString() : 'Not Set'}>
                                    {employee.dob ? new Date(employee.dob).toLocaleDateString() : 'Not Set'}
                                </span>
                            </div>
                        </div>

                        {/* Grade / Level */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineShieldCheck className="text-yellow-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grade / Level</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.grade || 'Not Set'}>{employee.grade || 'Not Set'}</span>
                            </div>
                        </div>

                        {/* Base Office Location */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineMapPin className="text-blue-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee Region</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.location || 'Not Set'}>{employee.location || 'Not Set'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className={`p-2 rounded-xl shrink-0 ${employee.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                <HiOutlineCheck size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employment Status</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.status || 'Active'}>
                                    {employee.status || 'Active'}
                                </span>
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineUsers className="text-cyan-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.gender ? employee.gender.charAt(0) + employee.gender.slice(1).toLowerCase() : 'Not Set'}>
                                    {employee.gender ? employee.gender.charAt(0) + employee.gender.slice(1).toLowerCase() : 'Not Set'}
                                </span>
                            </div>
                        </div>

                        {/* Reporting Manager */}
                        <div className="flex items-center gap-3.5 bg-slate-50/30 p-3.5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 hover:border-slate-200 transition duration-200">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <HiOutlineUserCircle className="text-green-600" size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Manager</span>
                                <span className="text-xs font-bold text-slate-800 block truncate" title={employee.managerName ? `${employee.managerName} ${employee.managerEmail ? `(${employee.managerEmail})` : ''}` : 'Not Set'}>
                                    {employee.managerName || 'Not Set'}
                                </span>
                                {employee.managerEmail && (
                                    <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5" title={employee.managerEmail}>
                                        {employee.managerEmail}
                                    </span>
                                )}
                                {employee.managerMobile && (
                                    <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5" title={employee.managerMobile}>
                                        {employee.managerMobile}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
