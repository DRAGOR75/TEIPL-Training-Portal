import 'dotenv/config';
import { db } from '../lib/prisma';

async function check() {
    const employee = await db.employee.findMany({
        where: {
            id: { contains: 'ael', mode: 'insensitive' }
        },
        select: { id: true, name: true, grade: true, sectionName: true, status: true }
    });
    console.log("Found Employee:");
    console.log(JSON.stringify(employee, null, 2));
}

check().catch(console.error).finally(() => db.$disconnect());
