-- CreateTable
CREATE TABLE "nominations" (
    "id" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "employee_email" TEXT NOT NULL,
    "emp_id" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "manager_email" TEXT NOT NULL,
    "manager_name" TEXT NOT NULL,
    "program_name" TEXT NOT NULL DEFAULT 'General Nomination',
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nominations_pkey" PRIMARY KEY ("id")
);
