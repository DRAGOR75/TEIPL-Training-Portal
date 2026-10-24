import { db } from "@/lib/prisma";
import QualificationsClient from "./QualificationsClient";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default async function TestsPage() {
  const programs = await db.program.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  const employees = await db.employee.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  // Fetch Test Records from the separate test_records table
  const testRecords = await db.testRecord.findMany({
    include: {
      employee: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { id: "desc" }
  });

  // Fetch LMS Records from the separate lms_records table
  const lmsRecords = await db.lmsRecord.findMany({
    include: {
      employee: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { id: "desc" }
  });

  // Fallback to fetch program names for tests
  const testRecordsWithProgramName = testRecords.map(t => {
    const program = programs.find(p => p.id === t.subjectId);
    return {
      ...t,
      programId: t.subjectId,
      programName: program?.name || t.subjectName || "Unknown Program"
    };
  });

  // Format LMS records for client view
  const formattedLmsRecords = lmsRecords.map(l => ({
    ...l,
    programId: l.courseId,
    programName: l.courseName || "Unknown Module",
    testDate: l.completionDate || l.enrollmentDate
  }));

  // Fetch completed training sessions to group tests program-wise
  const completedSessions = await db.trainingSession.findMany({
    where: { status: "Completed" },
    include: {
      enrollments: {
        select: { empId: true, employeeName: true }
      },
      nominationBatch: {
        select: { programId: true }
      }
    },
    orderBy: { endDate: "desc" }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-10">
        <Link href="/admin" className="flex w-fit items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-wider transition-colors mb-2">
          <FiArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-5xl md:text-4xl font-black tracking-tighter uppercase">
            <span className="text-slate-900">Tests &</span> <span className="text-blue-600">LMS Ledgers</span>
          </h1>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full">
            Separate Tables: {testRecords.length} Tests | {lmsRecords.length} LMS
          </span>
        </div>
      </div>

      <QualificationsClient
        programs={programs}
        employees={employees}
        initialData={testRecordsWithProgramName}
        lmsData={formattedLmsRecords}
        completedSessions={completedSessions}
      />
    </div>
  );
}
