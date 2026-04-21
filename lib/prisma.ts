// import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db =
    globalForPrisma.prisma ||
    createPrismaClient()

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        console.error("CRITICAL ERROR: DATABASE_URL is missing.");
        return new PrismaClient();
    }
    console.log(`[Prisma] Initializing with URL: ${connectionString.substring(0, 25)}...`);
    const pool = new Pool({ connectionString })
    
    pool.on('error', (err) => {
        console.error('[Postgres Pool Error]', err);
    });

    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
    })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
