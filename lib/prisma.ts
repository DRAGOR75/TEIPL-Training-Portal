// import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool as PgPool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Set up WebSocket constructor for Node.js environment
neonConfig.webSocketConstructor = ws

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
    
    // Check if the database is Neon (local/preview) or GCP (production)
    const isNeon = connectionString.includes('neon.tech')

    if (isNeon) {
        console.log('[Prisma] Using Neon Serverless Adapter');
        const adapter = new PrismaNeon({ connectionString })
        return new PrismaClient({ adapter, log: ['query', 'error', 'warn'] })
    } else {
        console.log('[Prisma] Using standard pg pool with keepAlive for GCP');
        const pool = new PgPool({ 
            connectionString,
            max: process.env.NODE_ENV === 'production' ? 10 : 100,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 15000, 
            keepAlive: true, // Prevents GCP/Firewalls from dropping idle TCP connections
            ssl: (connectionString.includes('sslmode=require') || 
                  connectionString.includes('sslmode=verify-full') || 
                  connectionString.includes('sslmode=verify-ca')) 
                ? { rejectUnauthorized: connectionString.includes('sslmode=verify-full') } 
                : false
        })
        
        pool.on('error', (err) => {
            console.error('[Postgres Pool Error]', err);
        });

        const adapter = new PrismaPg(pool)
        return new PrismaClient({ adapter, log: ['query', 'error', 'warn'] })
    }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

