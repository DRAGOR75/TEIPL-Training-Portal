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

    // Dynamically calculate column widths to perfectly fill the A4 width without wrapping issues
    const snWidth = '5%';
    const empIdWidth = '12%';
    const nameWidth = '33%';
    const siteWidth = '15%';
    const dateColWidth = `${35 / Math.max(1, dateColumns.length)}%`;

    return (
        <div className="bg-white min-h-screen font-sans text-black" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm 8mm 8mm 8mm;
                    }
                    body {
                        background: white;
                        color: black;
                        font-size: 10px;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                }
                table {
                    table-layout: fixed;
                    width: 100%;
                }
                th, td {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    white-space: normal !important;
                }
            `}} />

            <PrintClient />

            <div className="max-w-[1000px] mx-auto p-4 print:p-0">
                {/* Header Logos */}
                <div className="flex justify-between items-center mb-3">
                    <div className="relative w-36 h-10">
                        <Image src="/LLoyds_logo.svg" alt="LLoyds Metals" fill className="object-contain object-left" />
                    </div>
                    <div className="relative w-32 h-10">
                        <Image src="/thriveny_logo.svg" alt="Thriveni" fill className="object-contain object-right" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold text-[#1e3a8a] mb-3">Attendance Sheet</h1>

                {/* Info Box */}
                <div className="border border-black mb-4 text-xs">
                    <div className="border-b border-black p-2 font-bold">
                        Program Name : {session.altProgramName || session.programName}
                    </div>
                    <div className="flex border-b border-black">
                        <div className="flex-1 p-2 border-r border-black">
                            <span className="font-bold">Start Date: </span>{startStr}
                        </div>
                        <div className="flex-1 p-2 border-r border-black">
                            <span className="font-bold">End Date: </span>{endStr}
                        </div>
                        <div className="flex-1 p-2">
                            <span className="font-bold">Location: </span>{session.location || 'TRC'}
                        </div>
                    </div>
                    <div className="flex">
                        <div className="flex-1 p-2 border-r border-black">
                            <span className="font-bold">Trainer Name: </span>{session.trainerName}
                        </div>
                        <div className="flex-1 p-2">
                            <span className="font-bold">Coordinator Name: </span> {session.coordinatorName || '_____________________'}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border border-black text-[11px]">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="border border-black p-1.5 text-left font-bold" style={{ width: snWidth }}>SN</th>
                            <th className="border border-black p-1.5 text-left font-bold" style={{ width: empIdWidth }}>Emp ID</th>
                            <th className="border border-black p-1.5 text-left font-bold" style={{ width: nameWidth }}>Emp Name</th>
                            <th className="border border-black p-1.5 text-left font-bold" style={{ width: siteWidth }}>Site</th>
                            {dateColumns.map((col, idx) => (
                                <th key={idx} className="border border-black p-1.5 text-center font-bold" style={{ width: dateColWidth }}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {session.nominationBatch?.nominations.map((nom: any, idx: number) => (
                            <tr key={nom.id} className="h-8">
                                <td className="border border-black p-1 text-center">{idx + 1}</td>
                                <td className="border border-black p-1">{nom.empId}</td>
                                <td className="border border-black p-1 font-semibold">{nom.employee.name}</td>
                                <td className="border border-black p-1">{nom.employee.location}</td>
                                {dateColumns.map((_, i) => (
                                    <td key={i} className="border border-black p-1"></td>
                                ))}
                            </tr>
                        ))}

                        {/* Empty rows to fill sheet up to 20 total rows */}
                        {Array.from({ length: Math.max(0, 20 - (session.nominationBatch?.nominations.length || 0)) }).map((_, idx) => (
                            <tr key={`empty-${idx}`} className="h-8">
                                <td className="border border-black p-1 text-center">{(session.nominationBatch?.nominations.length || 0) + idx + 1}</td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                {dateColumns.map((_, i) => (
                                    <td key={`empty-col-${i}`} className="border border-black p-1"></td>
                                ))}
                            </tr>
                        ))}

                        {/* Trainer Signature Row */}
                        <tr className="h-12">
                            <td colSpan={4} className="border border-black p-2 text-left align-middle font-bold bg-slate-50/30">
                                Trainer Signature: <span className="underline decoration-dotted ml-2">{session.trainerName}</span>
                            </td>
                            {dateColumns.map((_, i) => (
                                <td key={`sig-${i}`} className="border border-black p-2 text-center align-bottom text-[8px] text-slate-400 font-medium">
                                    Sign Here
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>


            </div>
        </div>
    );
}
