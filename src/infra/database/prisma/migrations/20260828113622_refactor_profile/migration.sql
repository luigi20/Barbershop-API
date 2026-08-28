/*
  Warnings:

  - You are about to drop the column `profileId` on the `EntityCustomer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "EntityCustomer" DROP CONSTRAINT "EntityCustomer_profileId_fkey";

-- AlterTable
ALTER TABLE "EntityCustomer" DROP COLUMN "profileId";
