const { Client } = require('pg');
require('dotenv').config();

async function probePgBouncer() {
    console.log('--- PgBouncer Identity Probe ---');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to port 6432 successfully.');

        // This command ONLY works in PgBouncer. 
        // Standard Postgres will throw a "syntax error".
        console.log('Checking for PgBouncer-specific commands...');
        const res = await client.query('SHOW POOLS');
        
        console.log('✅ CONFIRMED: This is a PgBouncer connection.');
        console.log('Pool status:');
        console.table(res.rows);
    } catch (err) {
        if (err.message.includes('syntax error') || err.code === '42601') {
            console.log('❌ UNPOOLED: The database responded, but it rejected the "SHOW POOLS" command.');
            console.log('This means you are likely talking to a standard Postgres instance, not PgBouncer.');
        } else {
            console.error('Connection Error:', err.message);
        }
    } finally {
        await client.end();
    }
}

probePgBouncer();
