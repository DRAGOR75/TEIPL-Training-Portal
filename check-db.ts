import { db } from './lib/prisma';
async function run() {
    const p = await db.program.findMany({ where: { name: { contains: 'Stress', mode: 'insensitive' } } });
    console.log('Programs:', JSON.stringify(p, null, 2));
}
run();
