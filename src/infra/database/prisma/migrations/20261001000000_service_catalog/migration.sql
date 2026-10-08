-- Existing Service rows have no Entity owner. Stop rather than assign a tenant arbitrarily.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Service" LIMIT 1) THEN
    RAISE EXCEPTION 'Service contains legacy global rows; prepare an explicit tenant data migration before applying this schema migration';
  END IF;
END $$;

ALTER TABLE "Service"
  ADD COLUMN "entity_id" UUID NOT NULL,
  ADD COLUMN "description" VARCHAR(500),
  ADD COLUMN "price" DECIMAL(10,2) NOT NULL,
  ADD COLUMN "duration_minutes" INTEGER NOT NULL,
  ADD COLUMN "status" VARCHAR(10) NOT NULL,
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL;

CREATE INDEX "Service_entity_id_idx" ON "Service"("entity_id");
ALTER TABLE "Service" ADD CONSTRAINT "Service_entity_id_fkey"
  FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_price_nonnegative" CHECK ("price" >= 0);
ALTER TABLE "Service" ADD CONSTRAINT "Service_duration_positive" CHECK ("duration_minutes" > 0);
ALTER TABLE "Service" ADD CONSTRAINT "Service_status_valid" CHECK ("status" IN ('ativo', 'inativo'));
