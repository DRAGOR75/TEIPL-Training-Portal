-- AlterTable
ALTER TABLE "test_records" ADD COLUMN IF NOT EXISTS "training_mode" TEXT;

-- AlterTable
ALTER TABLE "lms_records" ADD COLUMN IF NOT EXISTS "training_mode" TEXT;

