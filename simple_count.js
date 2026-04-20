require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    return;
  }
  const pool = new Pool({ connectionString });
  try {
    const empRes = await pool.query('SELECT count(DISTINCT emp_id) as count FROM employees');
    const tniRes = await pool.query('SELECT count(*) as count FROM nominations');
    console.log('--- Database Count ---');
    console.log('Unique Employees:', empRes.rows[0].count);
    console.log('Total TNI Records:', tniRes.rows[0].count);
    console.log('----------------------');
  } catch (err) {
    console.error('Query Failed:', err.message);
  } finally {
    await pool.end();
  }
}

main();
