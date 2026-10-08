-- Apply only after the P2 Service and P3 Availability migrations.
-- Existing Service IDs remain unchanged. The composite key supports a tenant-safe FK.
CREATE UNIQUE INDEX "Service_id_entity_id_key" ON "Service"("id", "entity_id");

CREATE TABLE "Appointment" (
  "id" UUID PRIMARY KEY,
  "entity_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "professional_profile_id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  "service_name_snapshot" VARCHAR(100) NOT NULL,
  "price_snapshot" DECIMAL(10,2) NOT NULL,
  "duration_minutes_snapshot" INTEGER NOT NULL,
  "starts_at" TIMESTAMPTZ(3) NOT NULL,
  "ends_at" TIMESTAMPTZ(3) NOT NULL,
  "status" VARCHAR(12) NOT NULL,
  "notes" VARCHAR(1000),
  "cancellation_reason" VARCHAR(500),
  "cancelled_at" TIMESTAMPTZ(3),
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_customer_id_entity_id_fkey" FOREIGN KEY ("customer_id", "entity_id") REFERENCES "EntityCustomer"("customer_id", "entity_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_entity_id_professional_profile_id_fkey" FOREIGN KEY ("entity_id", "professional_profile_id") REFERENCES "EntityMembership"("entity_id", "profile_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_service_id_entity_id_fkey" FOREIGN KEY ("service_id", "entity_id") REFERENCES "Service"("id", "entity_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_time_check" CHECK ("starts_at" < "ends_at"),
  CONSTRAINT "Appointment_duration_check" CHECK ("duration_minutes_snapshot" > 0),
  CONSTRAINT "Appointment_price_check" CHECK ("price_snapshot" >= 0),
  CONSTRAINT "Appointment_status_check" CHECK ("status" IN ('agendado', 'cancelado', 'concluido'))
);
CREATE INDEX "Appointment_entity_id_starts_at_idx" ON "Appointment"("entity_id", "starts_at");
CREATE INDEX "Appointment_entity_id_professional_profile_id_starts_at_idx" ON "Appointment"("entity_id", "professional_profile_id", "starts_at");
CREATE INDEX "Appointment_entity_id_customer_id_starts_at_idx" ON "Appointment"("entity_id", "customer_id", "starts_at");
