/*
  Warnings:

  - Added the required column `used_at` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PasswordResetToken" DROP COLUMN "used_at",
ADD COLUMN     "used_at" BOOLEAN NOT NULL;
