const { db } = require('./lib/prisma');

async function testPrisma() {
    try {
        await db.qualifications.createMany({
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
