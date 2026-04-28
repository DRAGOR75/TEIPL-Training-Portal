import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function checkConnection() {
  console.log('--- Database Connection Doctor ---');
  try {
    // 1. Check basic connectivity
    console.log('Testing connectivity...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('Connected to:', (result as any)[0].version);

    // 2. Check for PgBouncer
    console.log('\nChecking for PgBouncer...');
    try {
      const pools = await prisma.$queryRawUnsafe('SHOW POOLS');
      console.log('✅ PgBouncer is ACTIVE.');
      console.table(pools);
    } catch (e) {
      console.log('❌ PgBouncer is NOT detected (Direct connection).');
      console.log('Note: This is expected if you are not using a connection pooler URL.');
    }

  } catch (error) {
    console.error('Final Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
