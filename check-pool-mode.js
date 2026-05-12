import { Client } from 'pg';

const checkPoolMode = async () => {
  const client = new Client({
    connectionString: "postgresql://thriveni_user:ThriveniRestore2026Secure@35.207.245.106:6432/pgbouncer?sslmode=disable"
  });

  try {
    await client.connect();
    const res = await client.query('SHOW DATABASES;');
    console.table(res.rows);
  } catch (err) {
    console.error('Error connecting to pgbouncer admin database:', err.message);
    console.log('\nYou likely need the pgbouncer admin user credentials to run this query.');
  } finally {
    await client.end();
  }
};

checkPoolMode();
