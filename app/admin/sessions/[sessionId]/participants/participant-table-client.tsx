'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { HiOutlineDocumentArrowDown } from 'react-icons/hi2';

interface ParticipantTableClientProps {
    participants: any[];
    sessionName: string;
}

export default function ParticipantTableClient({ participants, sessionName }: ParticipantTableClientProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredParticipants = participants.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.sectionName && p.sectionName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleExport = () => {
        const exportData = filteredParticipants.map(p => ({
            'Employee ID': p.id,
            'Name': p.name,
            'Email': p.email,
            'Mobile': p.mobile || '-',
            'Gender': p.gender || '-',
            'Grade': p.grade || '-',
            'Designation': p.designation || '-',
            'Section / Department': p.sectionName || '-',
            'Project Site': p.subDepartment || '-',
            'Location': p.location || '-',
            'Years of Experience': p.yearsOfExperience || '-',
            'Manager Name': p.managerName || '-',
            'Manager Email': p.managerEmail || '-',
            'Nomination Status': p.nominationStatus,
            'Approval Status': p.managerApprovalStatus
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

        // Format column widths roughly
        const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `${sessionName.replace(/\s+/g, '_')}_Participants.xlsx`);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[70vh]">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white sticky top-0 z-10">
                <div className="flex-1 w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Search participants by name, ID, email, or department..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500 font-medium">
                        Showing {filteredParticipants.length} of {participants.length}
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={filteredParticipants.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-100 active:scale-95"
                    >
                        <HiOutlineDocumentArrowDown className="w-5 h-5" />
                        Export to Excel
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto">
                {filteredParticipants.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">
                        No participants found matching your criteria.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 px-6">ID & Name</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Role details</th>
                                <th className="p-4">Department & Loc</th>
                                <th className="p-4">Experience</th>
                                <th className="p-4">Manager</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredParticipants.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 px-6">
                                        <div className="font-bold text-slate-900">{p.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{p.id} • {p.gender || 'N/A'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-700">{p.email}</div>
                                        <div className="text-xs text-slate-500">{p.mobile || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800">{p.designation || '-'}</div>
                                        <div className="text-xs text-slate-500">Grade: {p.grade || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800">{p.sectionName || '-'}</div>
                                        <div className="text-xs text-slate-500">{p.subDepartment || '-'} • {p.location || '-'}</div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {p.yearsOfExperience ? `${p.yearsOfExperience} years` : '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-800">{p.managerName || '-'}</div>
                                        <div className="text-xs text-slate-500">{p.managerEmail || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {p.nominationStatus}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                p.managerApprovalStatus === 'Approved' ? 'bg-green-50 text-green-700 border-green-100'
                                                : p.managerApprovalStatus === 'BULK_UPLOADED' ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : p.managerApprovalStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                }`}>
                                                {p.managerApprovalStatus.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
