const { Client } = require('pg');
require('dotenv').config();

async function testPort(port, name) {
    const url = process.env.DATABASE_URL.replace(':6432', `:${port}`).replace(':5432', `:${port}`);
    const client = new Client({ connectionString: url });
    
    try {
        console.log(`Checking ${name} (Port ${port})...`);
        await client.connect();
        console.log(`✅ ${name} is OPEN and responding.`);
        
        try {
            // Only PgBouncer understands "SHOW VERSION" or "SHOW POOLS"
            const res = await client.query('SHOW POOLS');
            console.log(`   - PgBouncer stats identified!`);
        } catch (e) {
            console.log(`   - Postgres identity confirmed (No pooler commands accepted).`);
        }
        
    } catch (err) {
        console.log(`❌ ${name} is CLOSED (${err.message}).`);
    } finally {
        await client.end();
    }
}

async function comparativeProbe() {
    console.log('--- Comparative Database Probe ---');
    await testPort(5432, 'Standard Postgres');
    console.log('');
    await testPort(6432, 'PgBouncer Pooler');
}

comparativeProbe();
