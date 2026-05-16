-- This migration has been manually cleaned up to perform ONLY the rename and preserve data.

-- Rename the column in the employees table
ALTER TABLE "employees" RENAME COLUMN "sub_department" TO "project_location";
