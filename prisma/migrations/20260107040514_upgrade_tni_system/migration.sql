/*
  Warnings:

  - The `recommendation_rating` column on the `enrollments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `designation` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `employee_email` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `employee_name` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `manager_email` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `manager_name` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `mobile` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `program_name` on the `nominations` table. All the data in the column will be lost.
  - You are about to drop the column `site` on the `nominations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[program_name,start_date,end_date,trainer_name]` on the table `training_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `program_id` to the `nominations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('EXECUTIVE', 'WORKMAN');

-- CreateEnum
CREATE TYPE "TrainingCategory" AS ENUM ('FUNCTIONAL', 'BEHAVIOURAL', 'COMMON');

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "recommendation_rating",
ADD COLUMN     "recommendation_rating" BOOLEAN;

-- AlterTable
ALTER TABLE "nominations" DROP COLUMN "designation",
DROP COLUMN "employee_email",
DROP COLUMN "employee_name",
DROP COLUMN "experience",
DROP COLUMN "manager_email",
DROP COLUMN "manager_name",
DROP COLUMN "mobile",
DROP COLUMN "program_name",
DROP COLUMN "site",
ADD COLUMN     "program_id" TEXT NOT NULL,
ALTER COLUMN "justification" DROP NOT NULL;

-- AlterTable
-- ALTER TABLE "training_sessions" ADD COLUMN     "send_feedback_automatically" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "employees" (
    "emp_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "section_name" TEXT,
    "location" TEXT,
    "manager_name" TEXT,
    "manager_email" TEXT,
    "program_name" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("emp_id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TrainingCategory" NOT NULL,
    "targetGrades" "Grade"[],

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramToSection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sections_name_key" ON "sections"("name");

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_key" ON "programs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgramToSection_AB_unique" ON "_ProgramToSection"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgramToSection_B_index" ON "_ProgramToSection"("B");

-- CreateIndex
CREATE UNIQUE INDEX "training_sessions_program_name_start_date_end_date_trainer__key" ON "training_sessions"("program_name", "start_date", "end_date", "trainer_name");

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToSection" ADD CONSTRAINT "_ProgramToSection_A_fkey" FOREIGN KEY ("A") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToSection" ADD CONSTRAINT "_ProgramToSection_B_fkey" FOREIGN KEY ("B") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
