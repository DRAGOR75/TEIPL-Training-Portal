import 'dotenv/config';
import { db } from '../lib/prisma';

const ids = [
    '10012524', '10011613', '10012228', '10001407', '10000122',
    '10001517', '10010831', '10014789', '10019366', '10008057'
];

async function main() {
    const emps = await db.employee.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, location: true, region: true }
    });
    console.log(`Found ${emps.length} of ${ids.length} employees.`);
    emps.forEach(e => console.log(`${e.id}: ${e.name} | loc: "${e.location}" | reg: "${e.region}"`));
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
