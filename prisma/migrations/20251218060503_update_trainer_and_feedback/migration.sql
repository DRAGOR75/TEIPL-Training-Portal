/*
  Warnings:

  - You are about to drop the column `expertise` on the `trainers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `trainers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "post_training_rating" INTEGER;

-- AlterTable
ALTER TABLE "trainers" DROP COLUMN "expertise",
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trainers_email_key" ON "trainers"("email");
