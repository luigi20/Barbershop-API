/*
  Warnings:

  - The primary key for the `EntityCustomer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `EntityCustomer` table. All the data in the column will be lost.
  - The primary key for the `EntityMembership` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `EntityMembership` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EntityCustomer" DROP CONSTRAINT "EntityCustomer_pkey",
DROP COLUMN "id";

-- AlterTable
ALTER TABLE "EntityMembership" DROP CONSTRAINT "EntityMembership_pkey",
DROP COLUMN "id";

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "identity_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "revoked_at" BOOLEAN NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefreshToken_identity_id_idx" ON "RefreshToken"("identity_id");

-- CreateIndex
CREATE INDEX "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
