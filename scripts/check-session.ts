
import { db } from '../lib/prisma';

async function main() {
    const id = process.argv[2];
    if (!id) {
        console.log('Please provide an ID');
        return;
    }
    const session = await db.trainingSession.findUnique({
        where: { id: id }
    });
    console.log(session ? 'Session FOUND' : 'Session NOT FOUND');
    if (session) console.log(session);
}

main();
