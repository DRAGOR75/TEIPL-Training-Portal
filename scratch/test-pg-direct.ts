
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    console.log(`Testing connection to: ${connectionString?.substring(0, 30)}...`);
    const pool = new Pool({ 
        connectionString,
        connectionTimeoutMillis: 5000, // 5 seconds timeout
    });

    try {
        const client = await pool.connect();
        console.log("Successfully connected to the pool!");
        const res = await client.query('SELECT NOW()');
        console.log("Query result:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("Connection error:", err.message);
    } finally {
        await pool.end();
    }
}

testConnection();
