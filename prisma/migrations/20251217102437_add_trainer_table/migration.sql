/*
  Warnings:

  - You are about to drop the column `completion_date` on the `training_sessions` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `training_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `training_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "training_sessions" DROP COLUMN "completion_date",
ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "feedback_creation_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "trainers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "expertise" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trainers_name_key" ON "trainers"("name");
