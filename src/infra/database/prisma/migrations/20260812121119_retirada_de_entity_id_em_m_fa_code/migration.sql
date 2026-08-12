/*
  Warnings:

  - You are about to drop the column `entity_id` on the `MfaCode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MfaCode" DROP CONSTRAINT "MfaCode_entity_id_fkey";

-- AlterTable
ALTER TABLE "MfaCode" DROP COLUMN "entity_id",
ADD COLUMN     "entityId" UUID;

-- AddForeignKey
ALTER TABLE "MfaCode" ADD CONSTRAINT "MfaCode_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
