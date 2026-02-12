
import 'dotenv/config';
import { db } from './lib/prisma';

async function main() {
    console.log("--- DATABASE CONNECTION DIAGNOSTIC ---");

    // 1. Check Env Var Node sees
    console.log("Process ENV DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");

    try {
        // 2. Query Database Identity
        const result = await db.$queryRaw`SELECT current_database(), current_user, version(), inet_server_addr()`;
        console.log("Database Identity Query Result:", result);

        // 3. Check Data Volume (Fingerprint)
        const employeeCount = await db.employee.count();
        const userCount = await db.user.count();
        console.log(`Data Stats: ${employeeCount} Employees, ${userCount} Users`);

    } catch (error) {
        console.error("Connection Failed:", error);
    }
    console.log("--- DIAGNOSTIC COMPLETE ---");
}

main();
