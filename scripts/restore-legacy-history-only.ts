import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    console.log("Restoring TrainingHistory from snapshot (_backup_training_history)...");
    
    const count = await db.$executeRawUnsafe(`
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

    console.log(`✓ Restored exactly ${count} rows in TrainingHistory back to original state!`);
    console.log(`SystemTrainingHistory remains updated as desired.`);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
