import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Connection string from environment variables
const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
    if (typeof window === 'undefined') { // Only log on server
        console.warn("DATABASE_URL is missing in lib/prisma.ts. Check your .env file or deployment variables.");
    }
}

// Explicitly pass connectionString to pg Pool
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const db =
    globalForPrisma.prisma ||
    tryCreatePrismaClient()

function tryCreatePrismaClient() {
    return new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
    })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
