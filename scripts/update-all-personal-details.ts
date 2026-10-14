import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    const args = process.argv.slice(2);
    const isRollback = args.includes('--rollback') || args.includes('--restore') || args.includes('--undo');
    const isDryRun = args.includes('--dry-run');
    const includeLegacy = args.includes('--include-legacy');

    console.log("=========================================================");
    console.log("   PERSONAL DETAILS SYNC WITH ON-DEMAND ROLLBACK SYSTEM  ");
    if (isRollback) {
        console.log("   *** MODE: ROLLBACK TO PREVIOUS SNAPSHOT ***           ");
    } else if (isDryRun) {
        console.log("   *** MODE: DRY RUN (NO CHANGES SAVED) ***              ");
    } else {
        console.log("   *** MODE: LIVE SYNC & CREATE AUTOMATIC SNAPSHOT ***   ");
    }
    console.log("=========================================================");
    const startTime = Date.now();

    // =========================================================================
    // BRANCH A: ROLLBACK / RESTORE TO PREVIOUS STATE
    // =========================================================================
    if (isRollback) {
        console.log("\n[Rollback] Checking for previous snapshots in database...");

        // Check if backup tables exist
        const tablesExist = await db.$queryRaw<any[]>`
            SELECT table_name::text as "tableName" 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name IN ('_backup_system_training_history', '_backup_training_history');
        `;

        if (tablesExist.length < 2) {
            console.error("❌ ERROR: No previous snapshot tables found! Cannot rollback.");
            process.exit(1);
        }

        const sysBackupCount = await db.$queryRaw<any[]>`
            SELECT count(*)::int as count, max(backed_up_at) as "snapshotTime" 
            FROM "_backup_system_training_history";
        `;
        const historyBackupCount = await db.$queryRaw<any[]>`
            SELECT count(*)::int as count, max(backed_up_at) as "snapshotTime" 
            FROM "_backup_training_history";
        `;

        const snapshotDate = sysBackupCount[0]?.snapshotTime || historyBackupCount[0]?.snapshotTime;
        console.log(`Found Snapshot created at: ${snapshotDate ? new Date(snapshotDate).toLocaleString() : 'Unknown'}`);
        console.log(`- Stored SystemTrainingHistory rows: ${sysBackupCount[0]?.count || 0}`);
        console.log(`- Stored TrainingHistory rows: ${historyBackupCount[0]?.count || 0}`);

        if ((sysBackupCount[0]?.count || 0) === 0 && (historyBackupCount[0]?.count || 0) === 0) {
            console.error("❌ ERROR: Snapshot tables are empty. Nothing to restore.");
            process.exit(1);
        }

        console.log("\nRestoring tables inside an atomic transaction...");
        await db.$transaction(async (tx) => {
            // Restore SystemTrainingHistory
            const restoredSys = await tx.$executeRawUnsafe(`
                UPDATE "system_training_history" sth
                SET 
                    "employee_name" = b."employee_name",
                    "designation" = b."designation",
                    "department" = b."department",
                    "department_group" = b."department_group",
                    "section" = b."section",
                    "employee_group" = b."employee_group",
                    "employee_grouup_m_nm_w" = b."employee_grouup_m_nm_w",
                    "employee_location" = b."employee_location",
                    "employee_region" = b."employee_region",
                    "organization" = b."organization",
                    "onroll_contract" = b."onroll_contract",
                    "aadhar_number" = b."aadhar_number",
                    "gender" = b."gender"
                FROM "_backup_system_training_history" b
                WHERE sth."id" = b."id";
            `);
            console.log(`✓ Restored ${restoredSys} rows in SystemTrainingHistory.`);

            // Restore TrainingHistory
            const restoredHistory = await tx.$executeRawUnsafe(`
                UPDATE "training_history" th
                SET 
                    "employee_name" = b."employee_name",
                    "designation" = b."designation",
                    "department" = b."department",
                    "department_group" = b."department_group",
                    "section" = b."section",
                    "employee_group" = b."employee_group",
                    "employee_grouup_m_nm_w" = b."employee_grouup_m_nm_w",
                    "employee_location" = b."employee_location",
                    "region" = b."region",
                    "organization" = b."organization",
                    "onroll_contract" = b."onroll_contract",
                    "aadhar_number" = b."aadhar_number",
                    "gender" = b."gender"
                FROM "_backup_training_history" b
                WHERE th."id" = b."id";
            `);
            console.log(`✓ Restored ${restoredHistory} rows in TrainingHistory.`);
        }, { timeout: 60000 });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log("\n=========================================================");
        console.log(`✓ ROLLBACK COMPLETE: All fields restored to snapshot state in ${duration}s!`);
        console.log("=========================================================");
        return;
    }

    // =========================================================================
    // BRANCH B: CREATE SNAPSHOT & RUN LIVE SYNC
    // =========================================================================
    const totalEmployees = await db.employee.count();
    const totalSysHistory = await db.systemTrainingHistory.count();
    const totalLegacyHistory = await db.trainingHistory.count();

    console.log(`Total Employees in Master: ${totalEmployees}`);
    console.log(`Total Records in SystemTrainingHistory: ${totalSysHistory}`);
    console.log(`Total Records in TrainingHistory: ${totalLegacyHistory}`);

    try {
        await db.$transaction(async (tx) => {
            // STEP 1: CREATE / REFRESH SNAPSHOT TABLES
            console.log("\n[Step 1/3] Creating automatic snapshot tables for instant rollback...");

            await tx.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "_backup_system_training_history" (
                    "id" TEXT PRIMARY KEY,
                    "emp_id" TEXT,
                    "employee_name" TEXT,
                    "designation" TEXT,
                    "department" TEXT,
                    "department_group" TEXT,
                    "section" TEXT,
                    "employee_group" TEXT,
                    "employee_grouup_m_nm_w" TEXT,
                    "employee_location" TEXT,
                    "employee_region" TEXT,
                    "organization" TEXT,
                    "onroll_contract" TEXT,
                    "aadhar_number" TEXT,
                    "gender" TEXT,
                    "backed_up_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);

            await tx.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "_backup_training_history" (
                    "id" TEXT PRIMARY KEY,
                    "emp_id" TEXT,
                    "employee_name" TEXT,
                    "designation" TEXT,
                    "department" TEXT,
                    "department_group" TEXT,
                    "section" TEXT,
                    "employee_group" TEXT,
                    "employee_grouup_m_nm_w" TEXT,
                    "employee_location" TEXT,
                    "region" TEXT,
                    "organization" TEXT,
                    "onroll_contract" TEXT,
                    "aadhar_number" TEXT,
                    "gender" TEXT,
                    "backed_up_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);

            // Clear old snapshot and capture current state
            await tx.$executeRawUnsafe(`TRUNCATE TABLE "_backup_system_training_history";`);
            const sysSnap = await tx.$executeRawUnsafe(`
                INSERT INTO "_backup_system_training_history" (
                    "id", "emp_id", "employee_name", "designation", "department", "department_group",
                    "section", "employee_group", "employee_grouup_m_nm_w", "employee_location",
                    "employee_region", "organization", "onroll_contract", "aadhar_number", "gender", "backed_up_at"
                )
                SELECT 
                    "id", "emp_id", "employee_name", "designation", "department", "department_group",
                    "section", "employee_group", "employee_grouup_m_nm_w", "employee_location",
                    "employee_region", "organization", "onroll_contract", "aadhar_number", "gender", NOW()
                FROM "system_training_history";
            `);

            await tx.$executeRawUnsafe(`TRUNCATE TABLE "_backup_training_history";`);
            const historySnap = await tx.$executeRawUnsafe(`
                INSERT INTO "_backup_training_history" (
                    "id", "emp_id", "employee_name", "designation", "department", "department_group",
                    "section", "employee_group", "employee_grouup_m_nm_w", "employee_location",
                    "region", "organization", "onroll_contract", "aadhar_number", "gender", "backed_up_at"
                )
                SELECT 
                    "id", "emp_id", "employee_name", "designation", "department", "department_group",
                    "section", "employee_group", "employee_grouup_m_nm_w", "employee_location",
                    "region", "organization", "onroll_contract", "aadhar_number", "gender", NOW()
                FROM "training_history";
            `);
            console.log(`✓ Snapshot saved: ${sysSnap} SystemTrainingHistory rows, ${historySnap} TrainingHistory rows.`);

            // STEP 2: APPLY UPDATES
            console.log("\n[Step 2/3] Applying personal details updates from Employee master...");

            const sysUpdateCount = await tx.$executeRawUnsafe(`
                UPDATE "system_training_history" sth
                SET 
                    "employee_name" = COALESCE(NULLIF(TRIM(e."name"), ''), sth."employee_name"),
                    "designation" = COALESCE(NULLIF(TRIM(e."designation"), ''), sth."designation"),
                    "department" = COALESCE(NULLIF(TRIM(e."department"), ''), sth."department"),
                    "department_group" = COALESCE(NULLIF(TRIM(e."department_group"), ''), sth."department_group"),
                    "section" = COALESCE(NULLIF(TRIM(e."section_name"), ''), sth."section"),
                    "employee_group" = COALESCE(NULLIF(TRIM(e."grade"::text), ''), sth."employee_group"),
                    "employee_grouup_m_nm_w" = COALESCE(NULLIF(TRIM(e."employee_grouup_m_nm_w"), ''), sth."employee_grouup_m_nm_w"),
                    "employee_location" = COALESCE(NULLIF(TRIM(e."location"), ''), sth."employee_location"),
                    "employee_region" = COALESCE(NULLIF(TRIM(e."region"), ''), sth."employee_region"),
                    "organization" = COALESCE(NULLIF(TRIM(e."organization"), ''), sth."organization"),
                    "onroll_contract" = COALESCE(NULLIF(TRIM(e."on_roll_contract"), ''), sth."onroll_contract"),
                    "aadhar_number" = COALESCE(NULLIF(TRIM(e."aadhar_number"), ''), sth."aadhar_number"),
                    "gender" = COALESCE(NULLIF(TRIM(e."gender"::text), ''), sth."gender")
                FROM "employees" e
                WHERE sth."emp_id" = e."emp_id";
            `);
            console.log(`✓ Updated ${sysUpdateCount} rows in SystemTrainingHistory.`);

            if (includeLegacy) {
                const historyUpdateCount = await tx.$executeRawUnsafe(`
                    UPDATE "training_history" th
                    SET 
                        "employee_name" = COALESCE(NULLIF(TRIM(e."name"), ''), th."employee_name"),
                        "designation" = COALESCE(NULLIF(TRIM(e."designation"), ''), th."designation"),
                        "department" = COALESCE(NULLIF(TRIM(e."department"), ''), th."department"),
                        "department_group" = COALESCE(NULLIF(TRIM(e."department_group"), ''), th."department_group"),
                        "section" = COALESCE(NULLIF(TRIM(e."section_name"), ''), th."section"),
                        "employee_group" = COALESCE(NULLIF(TRIM(e."grade"::text), ''), th."employee_group"),
                        "employee_grouup_m_nm_w" = COALESCE(NULLIF(TRIM(e."employee_grouup_m_nm_w"), ''), th."employee_grouup_m_nm_w"),
                        "employee_location" = COALESCE(NULLIF(TRIM(e."location"), ''), th."employee_location"),
                        "region" = COALESCE(NULLIF(TRIM(e."region"), ''), th."region"),
                        "organization" = COALESCE(NULLIF(TRIM(e."organization"), ''), th."organization"),
                        "onroll_contract" = COALESCE(NULLIF(TRIM(e."on_roll_contract"), ''), th."onroll_contract"),
                        "aadhar_number" = COALESCE(NULLIF(TRIM(e."aadhar_number"), ''), th."aadhar_number"),
                        "gender" = COALESCE(NULLIF(TRIM(e."gender"::text), ''), th."gender")
                    FROM "employees" e
                    WHERE th."emp_id" = e."emp_id";
                `);
                console.log(`✓ Updated ${historyUpdateCount} rows in TrainingHistory.`);
            } else {
                console.log(`ℹ Skipped TrainingHistory (Legacy) - run with --include-legacy if you wish to touch it.`);
            }

            // STEP 3: DRY RUN OR COMMIT
            if (isDryRun) {
                console.log("\n[Dry Run] Aborting transaction so no changes are saved...");
                throw new Error("ROLLBACK_TRIGGERED_DRY_RUN");
            }

            console.log("\n[Step 3/3] Committing transaction and snapshot...");
        }, { timeout: 60000 });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log("=========================================================");
        console.log(`✓ ALL CHANGES APPLIED & SNAPSHOT CREATED in ${duration}s!`);
        console.log(`ℹ If you ever want to revert, run:`);
        console.log(`  npx tsx scripts/update-all-personal-details.ts --rollback`);
        console.log("=========================================================");

    } catch (error: any) {
        if (error.message === "ROLLBACK_TRIGGERED_DRY_RUN") {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log("=========================================================");
            console.log(`✓ DRY RUN FINISHED: 0 changes made (${duration}s).`);
            console.log("=========================================================");
        } else {
            console.error("\n❌ SCRIPT FAILED & AUTOMATICALLY ROLLED BACK!");
            console.error("Error details:", error);
            process.exit(1);
        }
    }
}

main()
    .catch((e) => {
        console.error("FATAL SCRIPT ERROR:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
        process.exit(0);
    });
