import 'dotenv/config';
import { db } from './lib/db';

async function main() {
    try {
        const session = await db.trainingSession.findFirst();
        if (session) {
            console.log(`\nTEST_LINK: http://localhost:3000/join/${session.id}\n`);
        } else {
            console.log("\nNo training sessions found. Please create one in the dashboard first.\n");
        }
    } catch (e) {
        console.error(e);
    }
}
main();
