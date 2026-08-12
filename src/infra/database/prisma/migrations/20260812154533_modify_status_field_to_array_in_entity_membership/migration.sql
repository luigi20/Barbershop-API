/*
  Warnings:

  - You are about to drop the column `role` on the `EntityMembership` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EntityMembership" DROP COLUMN "role",
ADD COLUMN     "roles" VARCHAR[];
