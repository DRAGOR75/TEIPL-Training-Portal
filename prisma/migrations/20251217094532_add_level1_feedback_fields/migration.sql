-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "action_plan" TEXT,
ADD COLUMN     "content_rating" INTEGER,
ADD COLUMN     "emp_id" TEXT,
ADD COLUMN     "manager_name" TEXT,
ADD COLUMN     "material_rating" INTEGER,
ADD COLUMN     "pre_training_rating" INTEGER,
ADD COLUMN     "recommendation_rating" INTEGER,
ADD COLUMN     "suggestions" TEXT,
ADD COLUMN     "topics_learned" TEXT,
ADD COLUMN     "trainer_rating" INTEGER,
ADD COLUMN     "training_rating" INTEGER;
