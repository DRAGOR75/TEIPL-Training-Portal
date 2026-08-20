import { db as prisma } from './lib/prisma';

async function run() {
  try {
    await prisma.qualifications.createMany({
      data: [
        {
          empID: "10018532",
          subjectId: null,
          altSubjectName: null,
          qualificationType: "LMS Participants",
          facilitator: null,
          enrollmentDate: new Date("2025-03-23T18:30:00.000Z"),
          testDate: new Date("2025-03-23T18:30:00.000Z"),
          duration: null,
          maxMarks: null,
          obtainedMarks: null,
          qualified: true,
          referenceRemarks: null,
          empLocation: "TRC",
          subjectName: "PPE",
          empName: "Payal Pradhan",
          designation: "Officer",
          empGroup: null,
          gender: "FEMALE",
          shortProgReference: null,
          month: "Mar",
          year: "24-25"
        }
      ]
    });
    console.log("Success!");
  } catch (err: any) {
    console.error("PRISMA ERROR MESSAGE:");
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
