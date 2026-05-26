import { db } from './lib/prisma';
async function run() {
    const d = await db.designation.findMany({ where: { name: { contains: 'Specialist' } } });
    console.log('Designations:', JSON.stringify(d, null, 2));
}
run();
