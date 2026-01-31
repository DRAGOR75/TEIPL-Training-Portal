'use client';


import { useState, useEffect } from 'react';
import { joinBatch, registerAndJoinBatch } from '@/app/actions/sessions'; // Import both
import { getSections, getDesignations, getLocations } from '@/app/actions/master-data';
import {
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineUserPlus,
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineBriefcase,
    HiOutlineMapPin,
    HiOutlinePhone
} from 'react-icons/hi2';
import { useParams } from 'next/navigation';
import SearchableSelect from '@/components/ui/SearchableSelect';

// Using client component for interaction
export default function JoinPage() {
    const params = useParams();
    const batchId = params.batchId as string;

    const [empId, setEmpId] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<{ employeeName?: string, programName?: string, error?: string } | null>(null);
    const [isRegistering, setIsRegistering] = useState(false); // New state for JIT mode

    // Options State
    const [sectionOptions, setSectionOptions] = useState<{ label: string, value: string }[]>([]);
    const [designationOptions, setDesignationOptions] = useState<{ label: string, value: string }[]>([]);
    const [locationOptions, setLocationOptions] = useState<{ label: string, value: string }[]>([]);


    useEffect(() => {
        async function fetchOptions() {
            const [sections, designations, locations] = await Promise.all([
                getSections(),
                getDesignations(),
                getLocations()
            ]);
            setSectionOptions(sections);
            setDesignationOptions(designations);
            setLocationOptions(locations);
        }
        if (isRegistering) {
            fetchOptions();
        }
    }, [isRegistering]);

    // Registration Form State
    const [regData, setRegData] = useState({
        name: '',
        email: '',
        sectionName: '',
        designation: '',
        mobile: '',
        grade: 'EXECUTIVE',
        location: '',
        yearsOfExperience: '',
        subDepartment: '',
        managerName: '',
        managerEmail: ''
    });



    // Better Title Case function
    const toTitleCase = (str: string) => {
        return str.toLowerCase().split(' ').map(function (word) {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }

    const handleNameBlur = () => {
        setRegData(prev => ({ ...prev, name: toTitleCase(prev.name) }));
    };

    async function handleJoinSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus('loading');
        setResult(null);

        const res = await joinBatch(batchId, empId);

        if (res.success) {
            setStatus('success');
            setResult({ employeeName: res.employeeName, programName: res.programName });
        } else if (res.error === 'EMPLOYEE_NOT_FOUND') {
            setStatus('idle');
            setIsRegistering(true); // Switch to registration mode
        } else {
            setStatus('error');
            setResult({ error: res.error });
        }
    }

    async function handleRegisterSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Validation for SearchableSelect fields (Location, Department, Designation)
        if (!regData.location || !regData.sectionName || !regData.designation) {
            setStatus('error');
            setResult({ error: "Please select a valid Location, Department, and Designation." });
            return;
        }

        setStatus('loading');

        // Cast grade to literal type safely
        const payload = {
            ...regData,
            empId,
            grade: regData.grade as 'EXECUTIVE' | 'WORKMAN'
        };

        const res = await registerAndJoinBatch(batchId, payload);

        if (res.success) {
            setStatus('success');
            setResult({ employeeName: res.employeeName, programName: res.programName });
        } else {
            setStatus('error');
            setResult({ error: res.error });
        }
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
                        <HiOutlineCheckCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Registration Confirmed!</h1>
                    <p className="text-slate-600">
                        Welcome, <span className="font-bold text-slate-800">{result?.employeeName}</span>.
                        <br />
                        You have been added to:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl font-medium text-blue-700 break-words">
                        {result?.programName}
                    </div>
                    <p className="text-xs text-slate-400 mt-8">You can close this window now.</p>
                </div>
            </div>
        );
    }

    // --- REGISTRATION VIEW ---
    if (isRegistering) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 py-12">
                <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                            <HiOutlineUserPlus className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">New Registration</h1>
                        <p className="text-slate-500 text-sm">Please provide your details to update our records.</p>
                    </div>

                    {status === 'error' && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-2">
                            <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                            <span>{result?.error || 'Registration failed.'}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-4">

                        {/* 1. Basic Info */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Employee ID</label>
                            <input
                                value={empId}
                                disabled
                                className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Full Name <span className='text-red-500'>*</span></label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                <input
                                    required
                                    placeholder="e.g. John Doe"
                                    value={regData.name}
                                    onChange={e => setRegData({ ...regData, name: e.target.value })}
                                    onBlur={handleNameBlur}
                                    className="w-full pl-10 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Official Email <span className='text-red-500'>*</span></label>
                            <div className="relative">
                                <HiOutlineEnvelope className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                <input
                                    required
                                    type="email"
                                    placeholder="e.g. john@thriveni.com"
                                    value={regData.email}
                                    onChange={e => setRegData({ ...regData, email: e.target.value })}
                                    className="w-full pl-10 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Mobile Number <span className='text-red-500'>*</span></label>
                            <div className="relative">
                                <HiOutlinePhone className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                                <input
                                    required
                                    type="tel"
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit mobile number"
                                    placeholder="e.g. 9876543210"
                                    value={regData.mobile}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setRegData({ ...regData, mobile: val });
                                    }}
                                    className="w-full pl-10 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 my-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Work Details</p>

                        {/* 2. Employment Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Grade <span className='text-red-500'>*</span></label>
                                <select
                                    required
                                    value={regData.grade}
                                    onChange={e => setRegData({ ...regData, grade: e.target.value })}
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                                >
                                    <option value="EXECUTIVE">Executive</option>
                                    <option value="WORKMAN">Workman</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Location <span className='text-red-500'>*</span></label>
                                <div className="relative">
                                    <SearchableSelect
                                        options={locationOptions}
                                        value={regData.location}
                                        onChange={(val) => setRegData({ ...regData, location: typeof val === 'string' ? val : String(val) })}
                                        placeholder="Select Site"
                                        searchPlaceholder="Search locations..."
                                        icon={<HiOutlineMapPin className="w-5 h-5" />}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Department <span className='text-red-500'>*</span></label>
                                <div className="relative">
                                    <SearchableSelect
                                        options={sectionOptions}
                                        value={regData.sectionName}
                                        onChange={(val) => setRegData({ ...regData, sectionName: typeof val === 'string' ? val : String(val) })}
                                        placeholder="Select Dept"
                                        searchPlaceholder="Search departments..."
                                        icon={<HiOutlineBriefcase className="w-5 h-5" />}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            {/* <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Sub-Dept</label>
                                <input
                                    placeholder="e.g. Mines"
                                    value={regData.subDepartment}
                                    onChange={e => setRegData({ ...regData, subDepartment: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div> */}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Designation <span className='text-red-500'>*</span></label>
                                <div className="relative">
                                    <SearchableSelect
                                        options={designationOptions}
                                        value={regData.designation}
                                        onChange={(val) => setRegData({ ...regData, designation: typeof val === 'string' ? val : String(val) })}
                                        placeholder="Select Role"
                                        searchPlaceholder="Search..."
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 uppercase">Exp (Yrs) <span className='text-red-500'>*</span></label>
                                <input
                                    required
                                    type="number"
                                    placeholder="0"
                                    value={regData.yearsOfExperience}
                                    onChange={e => setRegData({ ...regData, yearsOfExperience: e.target.value })}
                                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 my-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Reporting Manager</p>

                        {/* 3. Manager Details */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Manager Name <span className='text-red-500'>*</span></label>
                            <input
                                required
                                placeholder="Manager's Full Name"
                                value={regData.managerName}
                                onChange={e => setRegData({ ...regData, managerName: e.target.value })}
                                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase">Manager Email <span className='text-red-500'>*</span></label>
                            <input
                                required
                                type="email"
                                placeholder="manager@thriveni.com"
                                value={regData.managerEmail}
                                onChange={e => setRegData({ ...regData, managerEmail: e.target.value })}
                                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium"
                            />
                        </div>


                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-blue-200"
                        >
                            {status === 'loading' ? (
                                <><HiOutlineArrowPath className="w-5 h-5 animate-spin" /> saving...</>
                            ) : (
                                'Complete Registration'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- DEFAULT JOIN VIEW ---
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-100 max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quick Join</h1>
                    <p className="text-slate-500">Enter your Employee ID to join the session.</p>
                </div>

                {status === 'error' && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-2">
                        <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                        <span>{result?.error || 'Something went wrong.'}</span>
                    </div>
                )}

                <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Employee ID</label>
                        <input
                            type="text"
                            required
                            value={empId}
                            onChange={(e) => setEmpId(e.target.value)}
                            placeholder="e.g. EMP123"
                            className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-mono placeholder:font-sans"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? (
                            <>
                                <HiOutlineArrowPath className="w-5 h-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Confirm Attendance'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
