-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_programs" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "session_id" TEXT,

    CONSTRAINT "cohort_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_members" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "certificate_id" TEXT,

    CONSTRAINT "cohort_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_feedbacks" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "emp_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "manager_cc" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cohort_programs_session_id_key" ON "cohort_programs"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_programs_cohort_id_program_id_key" ON "cohort_programs"("cohort_id", "program_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_members_cohort_id_employee_id_key" ON "cohort_members"("cohort_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_feedbacks_cohort_id_emp_id_key" ON "cohort_feedbacks"("cohort_id", "emp_id");

-- AddForeignKey
ALTER TABLE "cohort_programs" ADD CONSTRAINT "cohort_programs_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_programs" ADD CONSTRAINT "cohort_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_programs" ADD CONSTRAINT "cohort_programs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_feedbacks" ADD CONSTRAINT "cohort_feedbacks_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_feedbacks" ADD CONSTRAINT "cohort_feedbacks_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE CASCADE ON UPDATE CASCADE;
