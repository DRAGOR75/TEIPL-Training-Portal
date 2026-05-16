/*
  Warnings:

  - You are about to drop the column `sub_department` on the `employees` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "cause_library_name_key";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "sub_department",
ADD COLUMN     "project_location" TEXT;

-- AlterTable
ALTER TABLE "product_faults" ADD COLUMN     "symptoms" TEXT;

-- AlterTable
ALTER TABLE "training_sessions" ADD COLUMN     "allow_walk_ins" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "assessment_date" TIMESTAMP(3),
ADD COLUMN     "feedback_emails_sent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "manual_subjects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "view_seq" INTEGER NOT NULL DEFAULT 0,
    "user_view" INTEGER NOT NULL DEFAULT 0,
    "keywords" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_modules" (
    "id" TEXT NOT NULL,
    "module_code" TEXT,
    "name" TEXT NOT NULL,
    "pdf_url" TEXT,
    "view_seq" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_modules" (
    "id" TEXT NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "module_id" TEXT NOT NULL,
    "view_seq" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_topics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT,
    "pdf_url" TEXT,
    "image_url" TEXT,
    "manual_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_topics" (
    "id" TEXT NOT NULL,
    "subject_module_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_subjects" (
    "id" TEXT NOT NULL,
    "learning_path_id" TEXT NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_modules" (
    "id" TEXT NOT NULL,
    "learning_path_subject_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manual_subjects_name_key" ON "manual_subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "manual_modules_module_code_key" ON "manual_modules"("module_code");

-- CreateIndex
CREATE UNIQUE INDEX "manual_modules_name_key" ON "manual_modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_modules_subject_id_module_id_key" ON "subject_modules"("subject_id", "module_id");

-- CreateIndex
CREATE INDEX "module_topics_subject_module_id_seq_idx" ON "module_topics"("subject_module_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "module_topics_subject_module_id_topic_id_key" ON "module_topics"("subject_module_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_name_key" ON "learning_paths"("name");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_subjects_learning_path_id_subject_id_key" ON "learning_path_subjects"("learning_path_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_modules_learning_path_subject_id_module_id_key" ON "learning_path_modules"("learning_path_subject_id", "module_id");

-- CreateIndex
CREATE INDEX "email_logs_session_id_idx" ON "email_logs"("session_id");

-- CreateIndex
CREATE INDEX "email_logs_recipient_email_idx" ON "email_logs"("recipient_email");

-- AddForeignKey
ALTER TABLE "subject_modules" ADD CONSTRAINT "subject_modules_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "manual_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_modules" ADD CONSTRAINT "subject_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "manual_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_topics" ADD CONSTRAINT "module_topics_subject_module_id_fkey" FOREIGN KEY ("subject_module_id") REFERENCES "subject_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_topics" ADD CONSTRAINT "module_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "manual_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_subjects" ADD CONSTRAINT "learning_path_subjects_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_subjects" ADD CONSTRAINT "learning_path_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "manual_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_modules" ADD CONSTRAINT "learning_path_modules_learning_path_subject_id_fkey" FOREIGN KEY ("learning_path_subject_id") REFERENCES "learning_path_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_modules" ADD CONSTRAINT "learning_path_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "manual_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
