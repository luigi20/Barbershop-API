-- AlterTable
ALTER TABLE "MfaCode" ADD COLUMN     "entity_id" UUID;

-- AddForeignKey
ALTER TABLE "MfaCode" ADD CONSTRAINT "MfaCode_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
