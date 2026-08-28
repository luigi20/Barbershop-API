/*
  Warnings:

  - You are about to drop the column `customerId` on the `EntityCustomer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customer_id,entity_id]` on the table `EntityCustomer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "EntityCustomer" DROP CONSTRAINT "EntityCustomer_entity_id_fkey";

-- AlterTable
ALTER TABLE "EntityCustomer" DROP COLUMN "customerId",
ALTER COLUMN "notes" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "EntityCustomer_entity_id_idx" ON "EntityCustomer"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "EntityCustomer_customer_id_entity_id_key" ON "EntityCustomer"("customer_id", "entity_id");

-- AddForeignKey
ALTER TABLE "EntityCustomer" ADD CONSTRAINT "EntityCustomer_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
