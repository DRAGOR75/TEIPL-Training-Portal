const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
    try {
        await prisma.qualifications.createMany({
            data: [
                {
                    empID: "test1",
                    subjectId: "test1",
                }
            ]
        });
        console.log("Insert successful!");
    } catch (e) {
        console.error(e.message);
    }
}

testPrisma().catch(console.error);
