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
        // throw new Error("DATABASE_URL is missing from environment variables");
        console.error("CRITICAL ERROR: DATABASE_URL is missing. DB functionality will fail.");
        return new PrismaClient(); // Fallback to avoid crash on import
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
    })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
