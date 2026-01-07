
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for stuck connections...');

    try {
        // detailed info on active connections
        const activity = await prisma.$queryRaw`
      SELECT pid, state, application_name, query_start 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid();
    `;
        console.log('Active connections found:', activity);

        // Terminate all other connections to this database to release locks
        const result = await prisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid()
    `);

        console.log(`Terminated connections command executed. Return: ${result}`);
        console.log('Locks should be released.');
    } catch (e) {
        console.error('Error terminating connections:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
