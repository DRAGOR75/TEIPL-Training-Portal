import 'dotenv/config';
import { db } from '../lib/prisma';

async function check() {
    const columns = await db.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = 'training_sessions'`);
    console.log("Columns in training_sessions table:", columns);
}

check().catch(console.error).finally(() => db.$disconnect());
