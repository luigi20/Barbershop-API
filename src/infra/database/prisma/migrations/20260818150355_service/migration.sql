/*
  Warnings:

  - You are about to alter the column `status` on the `Subscription` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(30)`.

*/
-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);
