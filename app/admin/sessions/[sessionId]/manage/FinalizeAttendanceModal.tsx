'use client';

import { useState, useEffect } from 'react';
import { patchEmployeeProfile, getDesignations, getSections } from '@/app/actions/master-data';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiXMark } from 'react-icons/hi2';

interface FinalizeAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
    finalStatus: 'Completed' | 'Absent';
    onFinalize: () => Promise<void>;
}

export default function FinalizeAttendanceModal({
    isOpen,
    onClose,
    employee,
    finalStatus,
    onFinalize
}: FinalizeAttendanceModalProps) {
    const [formData, setFormData] = useState<any>({
        name: '',
        organization: '',
        grade: '',
        gender: '',
        employeeGrouupMNmw: '',
        email: '',
        mobile: '',
        department: '',
        managerName: '',
        managerId: '',
        managerEmail: '',
        managerMobile: '',
        sectionName: '',
        onRollContract: '',
        designation: '',
        region: '',
        location: '',
        aadharNumber: '',
        highestQualification: '',
        projectLocation: '',
        doj: '',
        dob: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [customOrganization, setCustomOrganization] = useState('');
    const [customDesignation, setCustomDesignation] = useState('');
    const [customSection, setCustomSection] = useState('');
    
    const [orgMode, setOrgMode] = useState<'select' | 'custom'>('select');
    const [designationMode, setDesignationMode] = useState<'select' | 'custom'>('select');
    const [sectionMode, setSectionMode] = useState<'select' | 'custom'>('select');
    
    const [designationOptions, setDesignationOptions] = useState<{ label: string, value: string }[]>([]);
    const [sectionOptions, setSectionOptions] = useState<{ label: string, value: string }[]>([]);

    useEffect(() => {
        getDesignations().then(desigs => setDesignationOptions(desigs));
        getSections().then(secs => setSectionOptions(secs));
    }, []);

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name || '',
                organization: employee.organization || '',
                grade: employee.grade || '',
                gender: employee.gender || '',
                employeeGrouupMNmw: employee.employeeGrouupMNmw || '',
                departmentGroup: employee.departmentGroup || '',
                email: employee.email || '',
                mobile: employee.mobile || '',
                department: employee.department || '',
                managerName: employee.managerName || '',
                managerId: employee.managerId || '',
                managerEmail: employee.managerEmail || '',
                managerMobile: employee.managerMobile || '',
                sectionName: employee.sectionName || '',
                onRollContract: employee.onRollContract || '',
                designation: employee.designation || '',
                region: employee.region || '',
                location: employee.location || '',
                aadharNumber: employee.aadharNumber || '',
                highestQualification: employee.highestQualification || '',
                projectLocation: employee.projectLocation || '',
                doj: employee.doj ? new Date(employee.doj).toISOString().split('T')[0] : '',
                dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
            });
            const org = employee.organization || '';
            const isStandardOrg = ['LMEL', 'TSMPL', 'MTLL', 'TEIPL', ''].includes(org);
            setCustomOrganization(isStandardOrg ? '' : org);
            
            setCustomDesignation('');
            setCustomSection('');

            setFormData(prev => ({
                ...prev,
                organization: isStandardOrg ? org : 'OTHER_CUSTOM',
                designation: employee.designation || '',
                sectionName: employee.sectionName || ''
            }));
        }
    }, [employee]);

    if (!isOpen || !employee) return null;

    const validate = () => {
        const newErrors: Record<string, boolean> = {};
        const requiredFields = [
            'name', 'email', 'grade', 'departmentGroup', 'employeeGrouupMNmw',
            'sectionName', 'onRollContract', 'region', 'location', 'organization'
        ];

        let isValid = true;
        const finalOrganization = orgMode === 'custom' ? customOrganization : formData.organization;
        const finalDesignation = designationMode === 'custom' ? customDesignation : formData.designation;
        const finalSection = sectionMode === 'custom' ? customSection : formData.sectionName;
        
        requiredFields.forEach(field => {
            if (field === 'organization') {
                if (!finalOrganization) {
                    newErrors['organization'] = true;
                    isValid = false;
                }
            } else if (field === 'designation') {
                if (!finalDesignation) {
                    newErrors['designation'] = true;
                    isValid = false;
                }
            } else if (field === 'sectionName') {
                if (!finalSection) {
                    newErrors['sectionName'] = true;
                    isValid = false;
                }
            } else if (!formData[field]) {
                newErrors[field] = true;
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (finalStatus === 'Completed' && !validate()) {
            return;
        }

        setIsSaving(true);
        try {
            // Only patch if we are completing, or if we want to save data anyway
            // Let's always save the updated data if they changed it
            const finalOrganization = orgMode === 'custom' ? customOrganization : formData.organization;
            const finalDesignation = designationMode === 'custom' ? customDesignation : formData.designation;
            const finalSection = sectionMode === 'custom' ? customSection : formData.sectionName;
            await patchEmployeeProfile(employee.id, { 
                ...formData, 
                organization: finalOrganization,
                designation: finalDesignation,
                sectionName: finalSection
            });
            
            // Call the actual finalization function
            await onFinalize();
            onClose();
        } catch (error) {
            console.error(error);
            alert("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasMissingData = finalStatus === 'Completed' && Object.keys(errors).length > 0;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Finalize Attendance: <span className={finalStatus === 'Completed' ? 'text-green-600' : 'text-red-600'}>{finalStatus}</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {employee.name} ({employee.id})
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <HiXMark className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {hasMissingData && (
                        <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 flex gap-3 items-start">
                            <HiOutlineExclamationCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm">Missing Required Fields</h4>
                                <p className="text-xs mt-1">Please fill in all highlighted fields before marking this participant as Completed. This ensures their training history is accurate.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Personal Details</h3>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Mobile</label>
                            <input
                                type="text"
                                value={formData.mobile}
                                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.mobile ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.dob ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Aadhar Number</label>
                            <input
                                type="text"
                                value={formData.aadharNumber}
                                onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border-slate-200`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.gender ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            >
                                <option value="">Select Gender...</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-2 mt-4">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Employment Details</h3>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Organization</label>
                            {orgMode === 'select' ? (
                                <select
                                    value={formData.organization}
                                    onChange={(e) => {
                                        if (e.target.value === 'OTHER_CUSTOM') {
                                            setOrgMode('custom');
                                            setCustomOrganization('');
                                        } else {
                                            setFormData({...formData, organization: e.target.value});
                                        }
                                    }}
                                    className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.organization ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                >
                                    <option value="">Select Organization</option>
                                    <option value="LMEL">LMEL</option>
                                    <option value="TSMPL">TSMPL</option>
                                    <option value="MTLL">MTLL</option>
                                    <option value="TEIPL">TEIPL</option>
                                    {formData.organization && !['LMEL', 'TSMPL', 'MTLL', 'TEIPL'].includes(formData.organization) && (
                                        <option value={formData.organization}>{formData.organization}</option>
                                    )}
                                    <option value="OTHER_CUSTOM">Other (Type Custom)</option>
                                </select>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={customOrganization}
                                        onChange={(e) => setCustomOrganization(e.target.value)}
                                        placeholder="Type custom organization..."
                                        className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.organization ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setOrgMode('select')}
                                        className="text-xs text-blue-600 hover:underline font-bold"
                                    >
                                        Back to Select
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Grade</label>
                            <select
                                value={formData.grade}
                                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.grade ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            >
                                <option value="">Select Grade...</option>
                                <option value="EXECUTIVE">Executive</option>
                                <option value="WORKMAN">Workman</option>
                                <option value="APPRENTICE">Apprentice</option>
                                <option value="TRAINEE">Trainee</option>
                                <option value="LOCAL">Local</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">M/NM/W</label>
                            <input
                                type="text"
                                value={formData.employeeGrouupMNmw}
                                onChange={(e) => setFormData({...formData, employeeGrouupMNmw: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.employeeGrouupMNmw ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Department Group</label>
                            <input
                                type="text"
                                value={formData.departmentGroup}
                                onChange={(e) => setFormData({...formData, departmentGroup: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.departmentGroup ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border-slate-200`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Section</label>
                            {sectionMode === 'select' ? (
                                <select
                                    value={formData.sectionName}
                                    onChange={(e) => {
                                        if (e.target.value === 'OTHER_CUSTOM') {
                                            setSectionMode('custom');
                                            setCustomSection('');
                                        } else {
                                            setFormData({...formData, sectionName: e.target.value});
                                        }
                                    }}
                                    className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.sectionName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                >
                                    <option value="">Select Section</option>
                                    {sectionOptions.map(sec => (
                                        <option key={sec.value} value={sec.value}>{sec.label}</option>
                                    ))}
                                    {formData.sectionName && formData.sectionName !== 'OTHER_CUSTOM' && !sectionOptions.find(o => o.value === formData.sectionName) && (
                                        <option value={formData.sectionName}>{formData.sectionName}</option>
                                    )}
                                    <option value="OTHER_CUSTOM">Other (Type Custom)</option>
                                </select>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={customSection}
                                        onChange={(e) => setCustomSection(e.target.value)}
                                        placeholder="Type custom section..."
                                        className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.sectionName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSectionMode('select')}
                                        className="text-xs text-blue-600 hover:underline font-bold"
                                    >
                                        Back to Select
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">On Roll Contract</label>
                            <input
                                type="text"
                                value={formData.onRollContract}
                                onChange={(e) => setFormData({...formData, onRollContract: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.onRollContract ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Designation</label>
                            {designationMode === 'select' ? (
                                <select
                                    value={formData.designation}
                                    onChange={(e) => {
                                        if (e.target.value === 'OTHER_CUSTOM') {
                                            setDesignationMode('custom');
                                            setCustomDesignation('');
                                        } else {
                                            setFormData({...formData, designation: e.target.value});
                                        }
                                    }}
                                    className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.designation ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                >
                                    <option value="">Select Designation</option>
                                    {designationOptions.map(desig => (
                                        <option key={desig.value} value={desig.value}>{desig.label}</option>
                                    ))}
                                    {formData.designation && formData.designation !== 'OTHER_CUSTOM' && !designationOptions.find(o => o.value === formData.designation) && (
                                        <option value={formData.designation}>{formData.designation}</option>
                                    )}
                                    <option value="OTHER_CUSTOM">Other (Type Custom)</option>
                                </select>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={customDesignation}
                                        onChange={(e) => setCustomDesignation(e.target.value)}
                                        placeholder="Type custom designation..."
                                        className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.designation ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setDesignationMode('select')}
                                        className="text-xs text-blue-600 hover:underline font-bold"
                                    >
                                        Back to Select
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Highest Qualification</label>
                            <input
                                type="text"
                                value={formData.highestQualification}
                                onChange={(e) => setFormData({...formData, highestQualification: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border-slate-200`}
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Date of Joining</label>
                            <input
                                type="date"
                                value={formData.doj}
                                onChange={(e) => setFormData({...formData, doj: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border-slate-200`}
                            />
                        </div>
                        
                        <div className="col-span-1 md:col-span-2 mt-4">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Manager Details</h3>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Manager Name</label>
                            <input
                                type="text"
                                value={formData.managerName}
                                onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.managerName ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Manager ID</label>
                            <input
                                type="text"
                                value={formData.managerId}
                                onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.managerId ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Manager Email</label>
                            <input
                                type="email"
                                value={formData.managerEmail}
                                onChange={(e) => setFormData({...formData, managerEmail: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border-slate-200`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Manager Mobile</label>
                            <input
                                type="text"
                                value={formData.managerMobile}
                                onChange={(e) => setFormData({...formData, managerMobile: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border-slate-200`}
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 mt-4">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Location Details</h3>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Employee Region</label>
                            <input
                                type="text"
                                value={formData.region}
                                onChange={(e) => setFormData({...formData, region: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.region ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Employee Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${errors.location ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500">Project Location</label>
                            <input
                                type="text"
                                value={formData.projectLocation}
                                onChange={(e) => setFormData({...formData, projectLocation: e.target.value})}
                                className={`w-full text-sm p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border-slate-200`}
                            />
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className={`px-8 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 ${finalStatus === 'Completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <HiOutlineCheckCircle className="w-5 h-5" />
                                Confirm {finalStatus}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
