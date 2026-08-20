const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    // Total count of qualifications
    const totalCount = await prisma.qualifications.count();
    
    // Count where maxMarks is null
    const emptyMaxMarks = await prisma.qualifications.count({
        where: {
            maxMarks: null
        }
    });

    // Count where obtainedMarks is null
    const emptyObtainedMarks = await prisma.qualifications.count({
        where: {
            obtainedMarks: null
        }
    });
    
    // Count where testDate is null
    const emptyDates = await prisma.qualifications.count({
        where: {
            testDate: null
        }
    });

    console.log(`Total Records: ${totalCount}`);
    console.log(`Records missing Max Marks: ${emptyMaxMarks}`);
    console.log(`Records missing Obtained Marks: ${emptyObtainedMarks}`);
    console.log(`Records missing Test Date: ${emptyDates}`);
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
