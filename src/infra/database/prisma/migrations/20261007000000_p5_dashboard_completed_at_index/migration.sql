-- Supports operational revenue by completion instant within one tenant.
CREATE INDEX "Appointment_entity_id_completed_at_idx" ON "Appointment"("entity_id", "completed_at");
