-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "_ProgramToSection" ADD CONSTRAINT "_ProgramToSection_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProgramToSection_AB_unique";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "training_sessions" ADD COLUMN     "end_time" TEXT,
ADD COLUMN     "start_time" TEXT;
