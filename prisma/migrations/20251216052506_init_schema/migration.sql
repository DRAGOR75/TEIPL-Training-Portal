-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "program_name" TEXT NOT NULL,
    "trainer_name" TEXT,
    "completion_date" TIMESTAMP(3) NOT NULL,
    "template_type" TEXT NOT NULL DEFAULT 'Technical',
    "emails_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "employee_email" TEXT NOT NULL,
    "manager_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "q1_relevance" INTEGER,
    "q2_application" INTEGER,
    "q3_performance" INTEGER,
    "q4_influence" INTEGER,
    "q5_efficiency" INTEGER,
    "average_rating" DOUBLE PRECISION,
    "manager_agrees" TEXT,
    "manager_comment" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrollments_session_id_idx" ON "enrollments"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_session_id_employee_email_key" ON "enrollments"("session_id", "employee_email");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
