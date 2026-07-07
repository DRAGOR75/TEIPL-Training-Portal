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

  const qualifications = await db.qualifications.findMany({
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

  // Basic fallback to fetch program names if we need it in the client
  // Since qualifications only stores programId, not a relation
  const qualificationsWithProgramName = qualifications.map(q => {
    const program = programs.find(p => p.id === q.programId);
    return {
      ...q,
      programName: program?.name || "Unknown Program"
    };
  });

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
        <h1 className="text-5xl md:text-4xl font-black tracking-tighter uppercase">
          <span className="text-slate-900">Tests &</span> <span className="text-blue-600">Qualifications</span>
        </h1>

      </div>

      <QualificationsClient
        programs={programs}
        employees={employees}
        initialData={qualificationsWithProgramName}
        completedSessions={completedSessions}
      />
    </div>
  );
}

