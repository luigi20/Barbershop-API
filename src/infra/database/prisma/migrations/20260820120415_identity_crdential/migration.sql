/*
  Warnings:

  - You are about to drop the column `password_hash` on the `Identity` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Identity` table. All the data in the column will be lost.
  - You are about to drop the column `provider_id` on the `Identity` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Identity_provider_provider_id_key";

-- AlterTable
ALTER TABLE "Identity" DROP COLUMN "password_hash",
DROP COLUMN "provider",
DROP COLUMN "provider_id";

-- CreateTable
CREATE TABLE "IdentityCredential" (
    "id" UUID NOT NULL,
    "identity_id" UUID NOT NULL,
    "provider" VARCHAR NOT NULL,
    "provider_id" VARCHAR,
    "password_hash" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityCredential_provider_provider_id_key" ON "IdentityCredential"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityCredential_identity_id_provider_key" ON "IdentityCredential"("identity_id", "provider");

-- AddForeignKey
ALTER TABLE "IdentityCredential" ADD CONSTRAINT "IdentityCredential_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
