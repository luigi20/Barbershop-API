/*
  Warnings:

  - Made the column `password_hash` on table `Identity` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Identity" ALTER COLUMN "password_hash" SET NOT NULL;
