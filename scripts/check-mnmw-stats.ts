import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    const stats = await db.$queryRaw<any[]>`
        SELECT 
            COUNT(*)::int as total_employees,
            COUNT(CASE WHEN employee_grouup_m_nm_w IS NOT NULL AND TRIM(employee_grouup_m_nm_w) != '' THEN 1 END)::int as has_mnmw,
            COUNT(CASE WHEN employee_grouup_m_nm_w IS NULL OR TRIM(employee_grouup_m_nm_w) = '' THEN 1 END)::int as missing_mnmw
        FROM "employees";
    `;
    console.log("Employee Master M/NM/W stats:", stats[0]);

    const sysStats = await db.$queryRaw<any[]>`
        SELECT 
            COUNT(*)::int as total_sys_records,
            COUNT(CASE WHEN employee_grouup_m_nm_w IS NOT NULL AND TRIM(employee_grouup_m_nm_w) != '' THEN 1 END)::int as has_mnmw,
            COUNT(CASE WHEN employee_grouup_m_nm_w IS NULL OR TRIM(employee_grouup_m_nm_w) = '' THEN 1 END)::int as missing_mnmw
        FROM "system_training_history";
    `;
    console.log("System Training History M/NM/W stats:", sysStats[0]);

    // Check if these 26 employees have M/NM/W in legacy training history
    const legacyValues = await db.$queryRaw<any[]>`
        SELECT emp_id, employee_name, employee_grouup_m_nm_w, employee_group
        FROM "training_history"
        WHERE emp_id IN (
            '71007159', '90003918', '90003920', '90003817', '90003449', '90003700',
            '90003919', '10022635', '2517027', '71007490', '71007915', '71004707',
            '2000223', '10022665', '71003306', '71001011', '10022667', '90003702',
            '90003704', '90003699', '40000646', '90003447', '71008081', '40000424',
            '10022666', '10022569'
        ) AND employee_grouup_m_nm_w IS NOT NULL
        LIMIT 10;
    `;
    console.log("Legacy training history sample for these employees:", legacyValues);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
