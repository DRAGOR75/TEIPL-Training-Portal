'use client';

import { useState, useEffect } from 'react';
import { joinBatch, getBatchBasicDetails, getEmployeeForConfirmation } from '@/app/actions/sessions';
import { submitRegistrationRequest } from '@/app/actions/registration-requests';
import { getSections, getDesignations, getLocations } from '@/app/actions/master-data';
import { getManagerDetails } from '@/app/actions/tni';
import {
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineUserPlus,
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineBriefcase,
    HiOutlineMapPin,
    HiOutlinePhone,
    HiOutlineClock,
    HiOutlineBuildingOffice2,
    HiOutlineArrowLeft
} from 'react-icons/hi2';
import { useParams } from 'next/navigation';
import SearchableSelect from '@/components/ui/SearchableSelect';

export default function JoinPage() {
    const params = useParams();
    const batchId = params.batchId as string;

    const [empId, setEmpId] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'unregistered' | 'request_submitted' | 'enrolled' | 'error'>('idle');
    const [result, setResult] = useState<{ employeeName?: string, programName?: string, altProgramName?: string, error?: string, message?: string } | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState<{ name: string, designation: string, sectionName: string, location: string, empId: string, managerName: string, managerEmail: string, managerId: string, managerMobile: string } | null>(null);

    // Options State
    const [sectionOptions, setSectionOptions] = useState<{ label: string, value: string }[]>([]);
    const [designationOptions, setDesignationOptions] = useState<{ label: string, value: string }[]>([]);
    const [locationOptions, setLocationOptions] = useState<{ label: string, value: string }[]>([]);

    // Batch Details State
    const [batchDetails, setBatchDetails] = useState<{ programName?: string, altProgramName?: string, startDate?: Date, endDate?: Date, location?: string, requireManagerApproval?: boolean } | null>(null);

    // Manager auto-fetch status in registration
    const [isFetchingManager, setIsFetchingManager] = useState(false);

    useEffect(() => {
        async function fetchBatchDetails() {
            if (batchId) {
                const res = await getBatchBasicDetails(batchId);
                if (res.success) {
                    setBatchDetails({
                        programName: res.programName,
                        startDate: res.startDate,
                        endDate: res.endDate,
                        location: res.location ?? undefined,
                        requireManagerApproval: res.requireManagerApproval
                    });
                }
            }
        }
        fetchBatchDetails();
    }, [batchId]);

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

    // Registration Form State (Omitting internal departmentGroup & employeeGrouupMNmw as per instructions)
    const [regData, setRegData] = useState({
        name: '',
        email: '',
        mobile: '',
        gender: 'MALE',
        grade: 'EXECUTIVE',
        location: '',
        sectionName: '',
        designation: '',
        projectLocation: '',
        organization: 'LMEL',
        onRollContract: 'On-Roll',
        highestQualification: '',
        managerId: '',
        managerName: '',
        managerEmail: '',
        managerMobile: ''
    });

    const toTitleCase = (str: string) => {
        return str.toLowerCase().split(' ').map(function (word) {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    };

    const handleNameBlur = () => {
        setRegData(prev => ({ ...prev, name: toTitleCase(prev.name) }));
    };

    async function handleManagerIdBlur() {
        if (regData.managerId && regData.managerId.trim() !== '') {
            setIsFetchingManager(true);
            try {
                const manager = await getManagerDetails(regData.managerId.trim().toUpperCase());
                if (manager) {
                    setRegData(prev => ({
                        ...prev,
                        managerName: manager.name || prev.managerName,
                        managerEmail: manager.email || prev.managerEmail,
                        managerMobile: manager.mobile || prev.managerMobile
                    }));
                }
            } catch (err) {
                console.error('Error fetching manager details:', err);
            } finally {
                setIsFetchingManager(false);
            }
        }
    }

    async function handleJoinSubmit(e: React.FormEvent) {
        e.preventDefault();
        const cleanEmpId = empId.trim().toUpperCase();
        if (!cleanEmpId) return;

        setStatus('loading');
        setResult(null);

        const res = await getEmployeeForConfirmation(cleanEmpId);

        if (res.success && res.employee) {
            setEmployeeDetails({
                name: res.employee.name,
                designation: res.employee.designation || 'N/A',
                sectionName: res.employee.sectionName || 'N/A',
                location: res.employee.location || 'N/A',
                empId: res.employee.id || cleanEmpId,
                managerName: res.employee.managerName || '',
                managerEmail: res.employee.managerEmail || '',
                managerId: res.employee.managerId || '',
                managerMobile: res.employee.managerMobile || '',
            });
            setStatus('idle');
            setIsConfirming(true);
        } else if (res.error === 'EMPLOYEE_NOT_FOUND') {
            setStatus('unregistered');
            setResult(null);
        } else {
            setStatus('error');
            setResult({ error: res.error });
        }
    }

    async function handleConfirmJoin() {
        if (batchDetails?.requireManagerApproval && !employeeDetails?.managerEmail) {
            setStatus('error');
            setResult({ error: 'Reporting Manager email is required. Please fill it in.' });
            return;
        }

        setStatus('loading');
        setResult(null);

        const joinArgs = batchDetails?.requireManagerApproval
            ? {
                managerName: employeeDetails?.managerName || '',
                managerEmail: employeeDetails?.managerEmail || '',
                managerId: employeeDetails?.managerId || '',
                managerMobile: employeeDetails?.managerMobile || ''
            }
            : undefined;

        const cleanEmpId = empId.trim().toUpperCase();
        const res = await joinBatch(batchId, cleanEmpId, joinArgs);

        if (res.success) {
            setStatus('enrolled');
            setResult({ employeeName: res.employeeName, programName: res.programName });
            setIsConfirming(false);
        } else {
            setStatus('error');
            setResult({ error: res.error });
        }
    }

    async function handleRegisterSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!regData.name.trim()) {
            setStatus('error');
            setResult({ error: "Please enter your Full Name." });
            return;
        }
        if (!regData.email.trim()) {
            setStatus('error');
            setResult({ error: "Please enter your Official Email Address." });
            return;
        }
        if (!regData.mobile.trim() || regData.mobile.length !== 10) {
            setStatus('error');
            setResult({ error: "Please enter a valid 10-digit Mobile Number." });
            return;
        }
        if (!regData.location || !regData.sectionName || !regData.designation) {
            setStatus('error');
            setResult({ error: "Please select your Location (Region), Section, and Designation." });
            return;
        }
        if (!regData.managerName.trim() || !regData.managerEmail.trim()) {
            setStatus('error');
            setResult({ error: "Reporting Manager Name and Manager Email are required." });
            return;
        }

        setStatus('loading');
        setResult(null);

        const cleanEmpId = empId.trim().toUpperCase();
        const payload = {
            ...regData,
            empId: cleanEmpId,
            grade: regData.grade as any,
            gender: regData.gender as any,
            batchId
        };

        const res = await submitRegistrationRequest(payload);

        if (res.success) {
            setStatus('request_submitted');
            setResult({
                employeeName: res.employeeName,
                programName: res.programName,
                message: res.message
            });
            setIsRegistering(false);
        } else {
            setStatus('error');
            setResult({ error: res.error });
        }
    }

    // --- VIEW 1: ENROLLED DIRECTLY (EXISTING EMPLOYEE SUCCESS) ---
    if (status === 'enrolled') {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                        <HiOutlineCheckCircle className="w-10 h-10" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        Enrollment Confirmed
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">You're Enrolled!</h1>
                    <p className="text-slate-600 text-sm">
                        Welcome, <span className="font-bold text-slate-900">{result?.employeeName}</span>.
                        <br />
                        You have been registered and enrolled in:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-bold text-blue-700 text-sm break-words shadow-inner">
                        {result?.altProgramName || result?.programName || batchDetails?.altProgramName || batchDetails?.programName}
                    </div>
                    <p className="text-xs text-slate-400 pt-4">You can safely close this browser window now.</p>
                </div>
            </div>
        );
    }

    // --- VIEW 2: REGISTRATION REQUEST SUBMITTED (AWAITING ADMIN APPROVAL) ---
    if (status === 'request_submitted') {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                        <HiOutlineClock className="w-10 h-10" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        Request Submitted to Admin
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Request Received!</h1>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Thank you, <span className="font-bold text-slate-900">{result?.employeeName || regData.name}</span> <span className="font-mono text-xs text-slate-500">({empId.toUpperCase()})</span>.
                        <br />
                        Your registration and enrollment request for:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-bold text-blue-700 text-sm break-words shadow-inner">
                        {result?.altProgramName || result?.programName || batchDetails?.altProgramName || batchDetails?.programName}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 text-left space-y-1.5">
                        <p className="font-bold flex items-center gap-1.5 text-amber-800">
                            <HiOutlineExclamationCircle className="w-4 h-4 shrink-0 text-amber-600" />
                            Next Step: Admin Confirmation
                        </p>
                        <p className="text-amber-700 leading-normal">
                            Since you are a new participant, your profile details have been sent to the Admin team. Once confirmed, you will be enrolled into this training session automatically.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setStatus('idle');
                            setIsRegistering(false);
                            setEmpId('');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    // --- VIEW 3: CONFIRMATION VIEW (EXISTING REGISTERED EMPLOYEE) ---
    if (isConfirming && employeeDetails) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-1">
                        <HiOutlineUser className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Confirm Your Identity</h2>
                        <p className="text-slate-500 text-xs mt-1">Please verify your details before joining this batch.</p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee</p>
                            <p className="font-bold text-slate-900 text-base">
                                {employeeDetails.name} <span className="font-mono text-slate-500 text-xs font-semibold">({employeeDetails.empId})</span>
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</p>
                            <p className="font-semibold text-slate-700 text-sm">{employeeDetails.designation}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                                <p className="font-medium text-slate-700 text-xs">{employeeDetails.sectionName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Region</p>
                                <p className="font-medium text-slate-700 text-xs">{employeeDetails.location}</p>
                            </div>
                        </div>

                        {batchDetails?.requireManagerApproval && (
                            <>
                                <hr className="border-slate-200 my-2" />
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Reporting Manager</p>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Manager Name</label>
                                        <input
                                            required
                                            placeholder="Manager's Full Name"
                                            value={employeeDetails.managerName}
                                            onChange={e => setEmployeeDetails({ ...employeeDetails, managerName: e.target.value })}
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium text-sm bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Manager Email <span className='text-red-500'>*</span></label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="manager@thriveni.com"
                                            value={employeeDetails.managerEmail}
                                            onChange={e => setEmployeeDetails({ ...employeeDetails, managerEmail: e.target.value })}
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium text-sm bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Manager ID <span className='text-red-500'>*</span></label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Manager's ID"
                                            value={employeeDetails.managerId}
                                            onChange={e => setEmployeeDetails({ ...employeeDetails, managerId: e.target.value })}
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium text-sm bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Manager Mobile <span className='text-red-500'>*</span></label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Manager's Mobile Number"
                                            value={employeeDetails.managerMobile}
                                            onChange={e => setEmployeeDetails({ ...employeeDetails, managerMobile: e.target.value })}
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal font-medium text-sm bg-white"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {status === 'error' && (
                        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2 text-left">
                            <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                            <span>{result?.error || 'Something went wrong.'}</span>
                        </div>
                    )}

                    <div className="space-y-2.5 pt-2">
                        <button
                            onClick={handleConfirmJoin}
                            disabled={status === 'loading'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                        >
                            {status === 'loading' ? (
                                <><HiOutlineArrowPath className="w-5 h-5 animate-spin" /> Enrolling...</>
                            ) : (
                                'Yes, Enroll Me'
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setIsConfirming(false);
                                setEmpId('');
                                setStatus('idle');
                            }}
                            disabled={status === 'loading'}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 4: PARTICIPANT REGISTRATION FORM ---
    if (isRegistering) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 py-12">
                <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-xl w-full space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(false);
                                setStatus('idle');
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                            Registration & Enrollment
                        </span>
                    </div>

                    <div className="text-center space-y-1">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-2">
                            <HiOutlineUserPlus className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Participant Registration</h1>
                        <p className="text-slate-500 text-xs">
                            Submit your profile details to register and request enrollment.
                        </p>
                        {batchDetails?.programName && (
                            <div className="inline-block mt-2 px-3 py-1 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                                Target Batch: <span className="text-blue-700 font-bold">{batchDetails.altProgramName || batchDetails.programName}</span>
                            </div>
                        )}
                    </div>

                    {status === 'error' && (
                        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2">
                            <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                            <span>{result?.error || 'Registration failed.'}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-6">

                        {/* Section 1: Basic & Personal Information */}
                        <div className="space-y-3.5">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Basic & Personal Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Employee ID *</label>
                                    <input
                                        value={empId.toUpperCase()}
                                        onChange={e => setEmpId(e.target.value.toUpperCase())}
                                        required
                                        placeholder="E.g. E00123"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Grade *</label>
                                    <SearchableSelect
                                        name="grade"
                                        options={[
                                            { label: 'Executive', value: 'EXECUTIVE' },
                                            { label: 'Workman', value: 'WORKMAN' },
                                            { label: 'Apprentice', value: 'APPRENTICE' },
                                            { label: 'Trainee', value: 'TRAINEE' },
                                            { label: 'Local', value: 'LOCAL' }
                                        ]}
                                        value={regData.grade}
                                        onChange={(val) => setRegData({ ...regData, grade: String(val) })}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Full Name *</label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                    <input
                                        required
                                        placeholder="e.g. John Doe"
                                        value={regData.name}
                                        onChange={e => setRegData({ ...regData, name: e.target.value })}
                                        onBlur={handleNameBlur}
                                        className="w-full pl-10 p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Email Address *</label>
                                    <div className="relative">
                                        <HiOutlineEnvelope className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                        <input
                                            required
                                            type="email"
                                            placeholder="john@thriveni.com"
                                            value={regData.email}
                                            onChange={e => setRegData({ ...regData, email: e.target.value })}
                                            className="w-full pl-10 p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Mobile Number *</label>
                                    <div className="relative">
                                        <HiOutlinePhone className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                        <input
                                            required
                                            type="tel"
                                            pattern="[0-9]{10}"
                                            placeholder="10-digit mobile"
                                            value={regData.mobile}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setRegData({ ...regData, mobile: val });
                                            }}
                                            className="w-full pl-10 p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gender *</label>
                                <SearchableSelect
                                    name="gender"
                                    options={[
                                        { label: 'Male', value: 'MALE' },
                                        { label: 'Female', value: 'FEMALE' },
                                        { label: 'Other', value: 'OTHER' }
                                    ]}
                                    value={regData.gender}
                                    onChange={(val) => setRegData({ ...regData, gender: String(val) })}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Section 2: Department & Work Details (Notice: No departmentGroup or employeeGrouupMNmw) */}
                        <div className="space-y-3.5 pt-2">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Department & Job Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Region *</label>
                                    <SearchableSelect
                                        options={locationOptions}
                                        value={regData.location}
                                        onChange={(val) => setRegData({ ...regData, location: typeof val === 'string' ? val : String(val) })}
                                        placeholder="Select Region"
                                        searchPlaceholder="Search regions..."
                                        icon={<HiOutlineMapPin className="w-4 h-4" />}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Section *</label>
                                    <SearchableSelect
                                        options={sectionOptions}
                                        value={regData.sectionName}
                                        onChange={(val) => setRegData({ ...regData, sectionName: typeof val === 'string' ? val : String(val) })}
                                        placeholder="Select Section"
                                        searchPlaceholder="Search sections..."
                                        icon={<HiOutlineBriefcase className="w-4 h-4" />}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Designation *</label>
                                    <SearchableSelect
                                        options={designationOptions}
                                        value={regData.designation}
                                        onChange={(val) => setRegData({ ...regData, designation: typeof val === 'string' ? val : String(val) })}
                                        placeholder="Select Designation"
                                        searchPlaceholder="Search roles..."
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Project Location</label>
                                    <input
                                        placeholder="e.g. Pakri Barwadih"
                                        value={regData.projectLocation}
                                        onChange={e => setRegData({ ...regData, projectLocation: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Organization</label>
                                    <SearchableSelect
                                        options={[
                                            { label: 'LMEL', value: 'LMEL' },
                                            { label: 'TSMPL', value: 'TSMPL' },
                                            { label: 'MTLL', value: 'MTLL' },
                                            { label: 'TEIPL', value: 'TEIPL' }
                                        ]}
                                        value={regData.organization}
                                        onChange={(val) => setRegData({ ...regData, organization: String(val) })}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">On Roll / Contract</label>
                                    <SearchableSelect
                                        options={[
                                            { label: 'On-Roll', value: 'On-Roll' },
                                            { label: 'Contract', value: 'Contract' }
                                        ]}
                                        value={regData.onRollContract}
                                        onChange={(val) => setRegData({ ...regData, onRollContract: String(val) })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Reporting Manager Details */}
                        <div className="space-y-3.5 pt-2">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Reporting Manager Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Manager ID</label>
                                        {isFetchingManager && <span className="text-[10px] text-blue-600 font-semibold animate-pulse">Fetching...</span>}
                                    </div>
                                    <input
                                        placeholder="e.g. MGR001 (auto-fills)"
                                        value={regData.managerId}
                                        onChange={e => setRegData({ ...regData, managerId: e.target.value })}
                                        onBlur={handleManagerIdBlur}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Manager Name *</label>
                                    <input
                                        required
                                        placeholder="Manager's Full Name"
                                        value={regData.managerName}
                                        onChange={e => setRegData({ ...regData, managerName: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Manager Email *</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="manager@thriveni.com"
                                        value={regData.managerEmail}
                                        onChange={e => setRegData({ ...regData, managerEmail: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Manager Mobile</label>
                                    <input
                                        type="tel"
                                        placeholder="Manager's Mobile"
                                        value={regData.managerMobile}
                                        onChange={e => setRegData({ ...regData, managerMobile: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                            >
                                {status === 'loading' ? (
                                    <><HiOutlineArrowPath className="w-5 h-5 animate-spin" /> Submitting Request...</>
                                ) : (
                                    'Submit Registration & Enrollment Request'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- VIEW 5: UNREGISTERED NOTIFICATION WITH REGISTRATION OPTION ---
    if (status === 'unregistered') {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 mb-1">
                        <HiOutlineUserPlus className="w-9 h-9" />
                    </div>

                    <div className="space-y-1.5">
                        <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
                            Employee Not Registered
                        </span>
                        <h2 className="text-2xl font-black text-slate-900">ID Not Found</h2>
                        <p className="text-slate-600 text-sm">
                            Employee ID <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">"{empId.toUpperCase()}"</span> is not registered in our records.
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 text-left space-y-2">
                        <p className="font-bold flex items-center gap-1.5 text-blue-800">
                            <HiOutlineBuildingOffice2 className="w-4 h-4 shrink-0" />
                            Would you like to register now?
                        </p>
                        <p className="text-blue-700 leading-relaxed">
                            You can submit your registration details right here. Your request will be sent to the Admin team for confirmation, and you will be enrolled once confirmed.
                        </p>
                    </div>

                    <div className="space-y-2.5 pt-1">
                        <button
                            onClick={() => {
                                setIsRegistering(true);
                                setStatus('idle');
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 text-sm"
                        >
                            <HiOutlineUserPlus className="w-5 h-5" />
                            Register & Request Enrollment
                        </button>
                        <button
                            onClick={() => {
                                setStatus('idle');
                                setEmpId('');
                            }}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all text-sm"
                        >
                            Try Another Employee ID
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 6: DEFAULT QUICK JOIN VIEW ---
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        Session Enrollment
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quick Join</h1>

                    {batchDetails?.programName ? (
                        <div className="bg-slate-50 text-slate-800 p-4 rounded-2xl border border-slate-200 my-4 text-center">
                            <p className="font-bold text-sm text-blue-700">
                                {batchDetails.altProgramName || batchDetails.programName}
                            </p>
                            {batchDetails.startDate && (
                                <p className="text-xs font-medium text-slate-500 mt-1">
                                    {new Date(batchDetails.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    {batchDetails.endDate && ` - ${new Date(batchDetails.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                </p>
                            )}
                            {batchDetails.location && (
                                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-slate-600">
                                    <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{batchDetails.location}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-xs">Enter your Employee ID to join this training batch.</p>
                    )}
                </div>

                {status === 'error' && (
                    <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2">
                        <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                        <span>{result?.error || 'Something went wrong.'}</span>
                    </div>
                )}

                <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Employee ID</label>
                        <input
                            type="text"
                            required
                            value={empId}
                            onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                            placeholder="e.g. E00123"
                            className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-mono font-bold uppercase placeholder:font-sans placeholder:font-normal placeholder:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                    >
                        {status === 'loading' ? (
                            <>
                                <HiOutlineArrowPath className="w-5 h-5 animate-spin" />
                                Verifying Employee...
                            </>
                        ) : (
                            'Continue to Join'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
