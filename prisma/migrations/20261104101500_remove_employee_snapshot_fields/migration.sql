-- AlterTable
ALTER TABLE "test_records" DROP COLUMN IF EXISTS "emp_location",
DROP COLUMN IF EXISTS "designation",
DROP COLUMN IF EXISTS "emp_group",
DROP COLUMN IF EXISTS "gender";

-- AlterTable
ALTER TABLE "lms_records" DROP COLUMN IF EXISTS "emp_location",
DROP COLUMN IF EXISTS "designation",
DROP COLUMN IF EXISTS "emp_group",
DROP COLUMN IF EXISTS "gender";

