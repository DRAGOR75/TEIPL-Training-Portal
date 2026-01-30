
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const designationData = [
    { name: "Board Director (Executive)", grade: "B2 - Executive" }, // Mapped from "B-Level B2 Executive"
    { name: "Board Director (Non-Executive)", grade: "B1 - Executive" },
    { name: "Senior Director", grade: "D2 - Executive" },
    { name: "Director", grade: "D1 - Executive" },
    { name: "Senior Vice President", grade: "V3 - Executive" },
    { name: "Vice President", grade: "V2 - Executive" },
    { name: "Asst Vice President", grade: "V1 - Executive" },
    { name: "Senior General Manager", grade: "G4 - Executive" },
    { name: "General Manager", grade: "G3 - Executive" },
    { name: "Deputy General Manager", grade: "G2 - Executive" },
    { name: "Assistant General Manager", grade: "G1 - Executive" },
    { name: "Senior Manager", grade: "M4 - Executive" },
    { name: "Manager", grade: "M3 - Executive" },
    { name: "Deputy Manager", grade: "M2 - Executive" },
    { name: "Assistant manager", grade: "M1 - Executive" },
    { name: "Senior Engineer", grade: "I3 - Executive" },
    { name: "Engineer", grade: "I2 - Executive" },
    { name: "Deputy Engineer", grade: "I1 - Executive" },
    { name: "Asst Engineer", grade: "J2 - Executive" },
    { name: "Junior Engineer", grade: "J1 - Executive" },
    { name: "Senior Officer", grade: "I3 - Executive" },
    { name: "Officer", grade: "I2 - Executive" },
    { name: "Deputy Officer", grade: "I1 - Executive" },
    { name: "Asst Officer", grade: "J2 - Executive" },
    { name: "Junior Officer", grade: "J1 - Executive" },
    { name: "MT", grade: "T3 - Executive" },
    { name: "GET", grade: "T2 - Executive" },
    { name: "DET", grade: "T1 - Executive" },
    { name: "JET", grade: "T0 - Executive" },
    { name: "Asst Mechanic", grade: "Workman" },
    { name: "Mechanic", grade: "Workman" },
    { name: "Technician", grade: "Workman" },
    { name: "Senior Technician", grade: "Workman" },
    { name: "Senior Mechanic", grade: "Workman" },
    { name: "Technical Asst", grade: "Workman" },
    { name: "Junior Trade Engineer", grade: "Executive" },
    { name: "Trade Engineer", grade: "Executive" },
    { name: "Senior Trade Engineer", grade: "Executive" },
    { name: "GEA", grade: "Executive" },
    { name: "DEA", grade: "Executive" },
];

async function main() {
    console.log('Start seeding designations...');

    for (const d of designationData) {
        await prisma.designation.upsert({
            where: { name: d.name },
            update: { grade: d.grade },
            create: {
                name: d.name,
                grade: d.grade
            },
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
