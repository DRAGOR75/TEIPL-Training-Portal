const { db } = require('./lib/prisma');

async function check() {
    const records = await db.qualifications.findMany({
        where: { empID: '10011850' },
        orderBy: { id: 'desc' },
        take: 5
    });
    console.log("Records for 10011850:");
    console.log(records);
    
    // Also check just the last 2 records overall
    const latest = await db.qualifications.findMany({
        orderBy: { id: 'desc' },
        take: 2
    });
    console.log("Latest records in DB:");
    console.log(latest);
}

check().catch(console.error);
