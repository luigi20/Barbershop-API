/*
  Warnings:

  - You are about to drop the column `profile_id` on the `EntityCustomer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entity_id,customer_id]` on the table `EntityCustomer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_id` to the `EntityCustomer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EntityCustomer" DROP CONSTRAINT "EntityCustomer_customerId_fkey";

-- DropForeignKey
ALTER TABLE "EntityCustomer" DROP CONSTRAINT "EntityCustomer_profile_id_fkey";

-- DropIndex
DROP INDEX "EntityCustomer_entity_id_profile_id_key";

-- AlterTable
ALTER TABLE "EntityCustomer" DROP COLUMN "profile_id",
ADD COLUMN     "customer_id" UUID NOT NULL,
ADD COLUMN     "profileId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "EntityCustomer_entity_id_customer_id_key" ON "EntityCustomer"("entity_id", "customer_id");

-- AddForeignKey
ALTER TABLE "EntityCustomer" ADD CONSTRAINT "EntityCustomer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCustomer" ADD CONSTRAINT "EntityCustomer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
