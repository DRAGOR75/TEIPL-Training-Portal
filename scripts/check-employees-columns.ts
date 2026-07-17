import 'dotenv/config';
import { db } from '../lib/prisma';

async function check() {
    const columns = await db.$queryRawUnsafe(`SELECT column_name::text as name FROM information_schema.columns WHERE table_name = 'employees'`);
    console.log("Columns in employees table:", JSON.stringify(columns, null, 2));
}

check().catch(console.error).finally(() => process.exit(0));
