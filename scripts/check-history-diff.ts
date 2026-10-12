import 'dotenv/config';
import { db } from '../lib/prisma';

async function main() {
    // 1. Check if there are any differences now between training_history and _backup_training_history
    const diffCheck = await db.$queryRaw<any[]>`
        SELECT count(*)::int as diff_count
        FROM "training_history" th
        JOIN "_backup_training_history" b ON th."id" = b."id"
        WHERE 
            COALESCE(th."employee_name", '') != COALESCE(b."employee_name", '') OR
            COALESCE(th."designation", '') != COALESCE(b."designation", '') OR
            COALESCE(th."department", '') != COALESCE(b."department", '') OR
            COALESCE(th."department_group", '') != COALESCE(b."department_group", '') OR
            COALESCE(th."section", '') != COALESCE(b."section", '') OR
            COALESCE(th."employee_group", '') != COALESCE(b."employee_group", '') OR
            COALESCE(th."employee_grouup_m_nm_w", '') != COALESCE(b."employee_grouup_m_nm_w", '') OR
            COALESCE(th."employee_location", '') != COALESCE(b."employee_location", '') OR
            COALESCE(th."region", '') != COALESCE(b."region", '') OR
            COALESCE(th."organization", '') != COALESCE(b."organization", '') OR
            COALESCE(th."onroll_contract", '') != COALESCE(b."onroll_contract", '') OR
            COALESCE(th."aadhar_number", '') != COALESCE(b."aadhar_number", '') OR
            COALESCE(th."gender", '') != COALESCE(b."gender", '');
    `;

    console.log("Current differences between training_history and backup snapshot:", diffCheck[0]?.diff_count);

    // 2. Sample how many employees in training_history had fields that differed from Employee master
    const diffsWithMaster = await db.$queryRaw<any[]>`
        SELECT 
            COUNT(CASE WHEN NULLIF(TRIM(e."designation"), '') IS NOT NULL AND COALESCE(th."designation", '') != TRIM(e."designation") THEN 1 END)::int as designation_diffs,
            COUNT(CASE WHEN NULLIF(TRIM(e."department"), '') IS NOT NULL AND COALESCE(th."department", '') != TRIM(e."department") THEN 1 END)::int as department_diffs,
            COUNT(CASE WHEN NULLIF(TRIM(e."organization"), '') IS NOT NULL AND COALESCE(th."organization", '') != TRIM(e."organization") THEN 1 END)::int as organization_diffs,
            COUNT(CASE WHEN NULLIF(TRIM(e."section_name"), '') IS NOT NULL AND COALESCE(th."section", '') != TRIM(e."section_name") THEN 1 END)::int as section_diffs,
            COUNT(CASE WHEN NULLIF(TRIM(e."aadhar_number"), '') IS NOT NULL AND COALESCE(th."aadhar_number", '') != TRIM(e."aadhar_number") THEN 1 END)::int as aadhar_diffs,
            COUNT(CASE WHEN NULLIF(TRIM(e."gender"::text), '') IS NOT NULL AND COALESCE(th."gender", '') != TRIM(e."gender"::text) THEN 1 END)::int as gender_diffs
        FROM "training_history" th
        JOIN "employees" e ON th."emp_id" = e."emp_id";
    `;

    console.log("Sample of differences with employee master:", diffsWithMaster[0]);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
