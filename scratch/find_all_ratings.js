const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function run() {
    console.log('--- 1. Check enrollments table total rows and rated rows ---');
    const enr = await pool.query(`
        SELECT 
            COUNT(*) as total_rows,
            COUNT(average_rating) as has_avg_rating,
            COUNT(trainer_rating) as has_trainer_rating,
            COUNT(training_rating) as has_training_rating,
            COUNT(content_rating) as has_content_rating,
            COUNT(material_rating) as has_material_rating
        FROM enrollments
    `);
    console.log('Enrollments totals:', enr.rows[0]);

    console.log('--- 2. If enrollments has rows, sample 5 of them ---');
    const enrSample = await pool.query(`
        SELECT id, session_id, employee_name, emp_id, average_rating, trainer_rating, training_rating, content_rating, material_rating
        FROM enrollments
        LIMIT 5
    `);
    console.log('Enrollments sample:', enrSample.rows);

    console.log('--- 3. Check training_history table total rows and rated rows ---');
    const th = await pool.query(`
        SELECT 
            COUNT(*) as total_rows,
            COUNT(average_rating) as has_avg_rating,
            COUNT(attendance_percentage) as has_attendance
        FROM training_history
    `);
    console.log('Training history totals:', th.rows[0]);

    console.log('--- 4. Check system_training_history total rows ---');
    const sth = await pool.query(`SELECT COUNT(*) as total_rows FROM system_training_history`);
    console.log('System training history totals:', sth.rows[0]);

    console.log('--- 5. Check test_records or qualifications or troubleshooting_feedback ---');
    const tr = await pool.query(`SELECT COUNT(*) as count, COUNT(obtained_marks) as marks FROM test_records`);
    console.log('Test records:', tr.rows[0]);

    const qual = await pool.query(`SELECT COUNT(*) as count, COUNT(obtained_marks) as marks FROM qualifications`);
    console.log('Qualifications:', qual.rows[0]);

    await pool.end();
}

run().catch(console.error);
