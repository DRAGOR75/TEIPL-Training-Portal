const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    
    const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'qualifications';
    `);
    
    console.log("Columns in qualifications table:");
    res.rows.forEach(row => console.log(row.column_name));
    
    await client.end();
}

checkSchema().catch(console.error);
