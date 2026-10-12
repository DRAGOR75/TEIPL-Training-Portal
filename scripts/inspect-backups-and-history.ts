import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    // 1. Check all tables matching *backup* or *history*
    const tables = await db.$queryRaw<any[]>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND (table_name LIKE '%backup%' OR table_name LIKE '%history%')
        ORDER BY table_name;
    `;
    console.log("Matching tables in DB:", tables.map(t => t.table_name));

    // 2. Check snapshot timestamp in _backup_training_history
    const snapshotInfo = await db.$queryRaw<any[]>`
        SELECT min(backed_up_at) as earliest_backup, max(backed_up_at) as latest_backup, count(*)::int as count
        FROM "_backup_training_history";
    `;
    console.log("Snapshot table info:", snapshotInfo[0]);

    // 3. Inspect training_history createdAt and source
    const historyInfo = await db.$queryRaw<any[]>`
        SELECT 
            source,
            min(created_at) as earliest_created_at,
            max(created_at) as latest_created_at,
            count(*)::int as row_count
        FROM "training_history"
        GROUP BY source;
    `;
    console.log("Training history table info by source:", historyInfo);

    // 4. Sample a few rows from _backup_training_history to see what was captured right before the run
    const sample = await db.$queryRaw<any[]>`
        SELECT id, emp_id, employee_name, designation, department, organization, backed_up_at
        FROM "_backup_training_history"
        LIMIT 3;
    `;
    console.log("Sample rows captured in snapshot:", sample);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
