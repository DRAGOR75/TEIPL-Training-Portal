-- CreateTable
CREATE TABLE IF NOT EXISTS "registration_requests" (
    "id" TEXT NOT NULL,
    "emp_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "gender" "Gender",
    "grade" "Grade" DEFAULT 'EXECUTIVE',
    "department_group" TEXT,
    "department" TEXT,
    "section_name" TEXT,
    "designation" TEXT,
    "location" TEXT,
    "region" TEXT,
    "project_location" TEXT,
    "organization" TEXT,
    "employee_grouup_m_nm_w" TEXT,
    "on_roll_contract" TEXT,
    "highest_qualification" TEXT,
    "manager_id" TEXT,
    "manager_name" TEXT,
    "manager_email" TEXT,
    "manager_mobile" TEXT,
    "batch_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "registration_requests_emp_id_idx" ON "registration_requests"("emp_id");
CREATE INDEX IF NOT EXISTS "registration_requests_status_idx" ON "registration_requests"("status");
CREATE INDEX IF NOT EXISTS "registration_requests_batch_id_idx" ON "registration_requests"("batch_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registration_requests_batch_id_fkey'
    ) THEN
        ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "nomination_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

