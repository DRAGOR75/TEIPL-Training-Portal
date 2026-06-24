import { auth } from '@/auth';
import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import PrintClient from './PrintClient';

export default async function PrintAttendancePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const sessionUser = await auth();
    if (!sessionUser) {
        redirect('/api/auth/signin');
    }

    const session = await db.trainingSession.findUnique({
        where: { id: sessionId },
        include: {
            nominationBatch: {
                include: {
                    nominations: {
                        include: { employee: true },
                        orderBy: { employee: { name: 'asc' } }
                    }
                }
            }
        }
    });

    if (!session) {
        return <div className="p-10 text-center">Session not found</div>;
    }

    // Determine the columns for dates
    let dateColumns: string[] = [];
    if (session.classDates && session.classDates.length > 0) {
        dateColumns = session.classDates.map((d: any) => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        });
    } else {
        // Provide 5 blank columns if no specific dates are logged
        dateColumns = ['', '', '', '', ''];
    }

    const startStr = new Date(session.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const endStr = new Date(session.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="bg-white min-h-screen font-sans text-black" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <PrintClient />
            
            <div className="max-w-[1000px] mx-auto p-8 print:p-0">
                {/* Header Logos */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-48 h-12">
                        <Image src="/LLoyds_logo.svg" alt="LLoyds Metals" fill className="object-contain object-left" />
                    </div>
                    <div className="relative w-40 h-12">
                        <Image src="/thriveny_logo.svg" alt="Thriveni" fill className="object-contain object-right" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-[#1e3a8a] mb-6">Attendance Sheet</h1>

                {/* Info Box */}
                <div className="border-2 border-black mb-6">
                    <div className="border-b-2 border-black p-3 font-bold text-sm">
                        Program Name : {session.programName}
                    </div>
                    <div className="flex border-b-2 border-black text-sm">
                        <div className="flex-1 p-3 border-r-2 border-black">
                            <span className="font-bold">Start Date : </span>{startStr}
                        </div>
                        <div className="flex-1 p-3 border-r-2 border-black">
                            <span className="font-bold">End Date : </span>{endStr}
                        </div>
                        <div className="flex-1 p-3">
                            <span className="font-bold">Location : </span>{session.location || 'TRC'}
                        </div>
                    </div>
                    <div className="flex text-sm">
                        <div className="flex-1 p-3 border-r-2 border-black">
                            <span className="font-bold">Trainer Name : </span>{session.trainerName}
                        </div>
                        <div className="flex-1 p-3">
                            <span className="font-bold">Coordinator Name: </span> _____________________
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border-2 border-black text-sm">
                    <thead>
                        <tr>
                            <th className="border-2 border-black p-2 text-left font-bold w-12">SN</th>
                            <th className="border-2 border-black p-2 text-left font-bold w-24">Emp ID</th>
                            <th className="border-2 border-black p-2 text-left font-bold">Emp Name</th>
                            <th className="border-2 border-black p-2 text-left font-bold w-32">Site</th>
                            {dateColumns.map((col, idx) => (
                                <th key={idx} className="border-2 border-black p-2 text-left font-bold w-28">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {session.nominationBatch?.nominations.map((nom: any, idx: number) => (
                            <tr key={nom.id}>
                                <td className="border-2 border-black p-2 text-center">{idx + 1}</td>
                                <td className="border-2 border-black p-2">{nom.empId}</td>
                                <td className="border-2 border-black p-2">{nom.employee.name}</td>
                                <td className="border-2 border-black p-2">{nom.employee.location}</td>
                                {dateColumns.map((_, i) => (
                                    <td key={i} className="border-2 border-black p-2"></td>
                                ))}
                            </tr>
                        ))}
                        
                        {/* Empty rows to fill sheet if less than 14 employees */}
                        {Array.from({ length: Math.max(0, 14 - (session.nominationBatch?.nominations.length || 0)) }).map((_, idx) => (
                            <tr key={`empty-${idx}`}>
                                <td className="border-2 border-black p-2 text-center h-10">{(session.nominationBatch?.nominations.length || 0) + idx + 1}</td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                <td className="border-2 border-black p-2"></td>
                                {dateColumns.map((_, i) => (
                                    <td key={`empty-col-${i}`} className="border-2 border-black p-2"></td>
                                ))}
                            </tr>
                        ))}

                        {/* Trainer Signature Row */}
                        <tr>
                            <td colSpan={4} className="border-2 border-black p-3 text-left h-16 align-middle">
                                <span className="font-bold">Trainer Signature : </span>
                                <span className="font-bold">{session.trainerName}</span>
                            </td>
                            {dateColumns.map((_, i) => (
                                <td key={`sig-${i}`} className="border-2 border-black p-3 h-16"></td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
