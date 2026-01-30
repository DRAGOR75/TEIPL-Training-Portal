/*
  Warnings:

  - A unique constraint covering the columns `[emp_id,batch_id]` on the table `nominations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nomination_batch_id]` on the table `training_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "designation" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "sub_department" TEXT,
ADD COLUMN     "years_of_experience" TEXT,
ALTER COLUMN "grade" DROP NOT NULL;

-- AlterTable
ALTER TABLE "nominations" ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "managerApprovalStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "manager_rejection_reason" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "training_sessions" ADD COLUMN     "location" TEXT,
ADD COLUMN     "nomination_batch_id" TEXT,
ADD COLUMN     "send_feedback_automatically" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topics" TEXT;

-- CreateTable
CREATE TABLE "nomination_batches" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "program_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Forming',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nomination_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "troubleshooting_products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "view_seq" INTEGER NOT NULL DEFAULT 0,
    "user_view" INTEGER NOT NULL DEFAULT 0,
    "keywords" TEXT,
    "legacy_source_id" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "troubleshooting_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fault_library" (
    "id" TEXT NOT NULL,
    "fault_code" TEXT,
    "name" TEXT NOT NULL,
    "view_seq" INTEGER NOT NULL DEFAULT 0,
    "legacy_source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fault_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_faults" (
    "id" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "fault_id" TEXT NOT NULL,
    "view_seq" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "keywords" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_faults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cause_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "justification" TEXT,
    "action" TEXT,
    "symptoms" TEXT,
    "manual_ref" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cause_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fault_causes" (
    "id" TEXT NOT NULL,
    "product_fault_id" TEXT NOT NULL,
    "cause_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "is_likely" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "justification" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fault_causes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "troubleshooting_feedback" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "is_helpful" BOOLEAN NOT NULL,
    "comments" TEXT,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "troubleshooting_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "troubleshooting_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "troubleshooting_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "designations_name_key" ON "designations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "troubleshooting_products_name_key" ON "troubleshooting_products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "troubleshooting_products_legacy_source_id_key" ON "troubleshooting_products"("legacy_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "fault_library_fault_code_key" ON "fault_library"("fault_code");

-- CreateIndex
CREATE UNIQUE INDEX "fault_library_name_key" ON "fault_library"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fault_library_legacy_source_id_key" ON "fault_library"("legacy_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_faults_product_id_fault_id_key" ON "product_faults"("product_id", "fault_id");

-- CreateIndex
CREATE UNIQUE INDEX "cause_library_name_key" ON "cause_library"("name");

-- CreateIndex
CREATE INDEX "fault_causes_product_fault_id_seq_idx" ON "fault_causes"("product_fault_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "fault_causes_product_fault_id_cause_id_key" ON "fault_causes"("product_fault_id", "cause_id");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "nominations_emp_id_batch_id_key" ON "nominations"("emp_id", "batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_sessions_nomination_batch_id_key" ON "training_sessions"("nomination_batch_id");

-- CreateIndex
CREATE INDEX "training_sessions_start_date_idx" ON "training_sessions"("start_date");

-- CreateIndex
CREATE INDEX "training_sessions_end_date_idx" ON "training_sessions"("end_date");

-- CreateIndex
CREATE INDEX "training_sessions_feedback_creation_date_idx" ON "training_sessions"("feedback_creation_date");

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "nomination_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nomination_batches" ADD CONSTRAINT "nomination_batches_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_nomination_batch_id_fkey" FOREIGN KEY ("nomination_batch_id") REFERENCES "nomination_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_faults" ADD CONSTRAINT "product_faults_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "troubleshooting_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_faults" ADD CONSTRAINT "product_faults_fault_id_fkey" FOREIGN KEY ("fault_id") REFERENCES "fault_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_causes" ADD CONSTRAINT "fault_causes_product_fault_id_fkey" FOREIGN KEY ("product_fault_id") REFERENCES "product_faults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fault_causes" ADD CONSTRAINT "fault_causes_cause_id_fkey" FOREIGN KEY ("cause_id") REFERENCES "cause_library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
