/*
  Warnings:

  - Added the required column `is_superuser` to the `Identity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Identity" ADD COLUMN     "is_superuser" BOOLEAN NOT NULL;
