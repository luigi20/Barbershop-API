/*
  Warnings:

  - Changed the type of `used_at` on the `MfaCode` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "MfaCode" DROP COLUMN "used_at",
ADD COLUMN     "used_at" BOOLEAN NOT NULL;
