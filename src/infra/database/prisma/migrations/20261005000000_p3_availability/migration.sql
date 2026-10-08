-- Existing Entities require an explicit IANA timezone chosen by their administrator.
ALTER TABLE "Entity" ADD COLUMN "timezone" VARCHAR(100);

CREATE TABLE "EntityBusinessHour" (
  "id" UUID PRIMARY KEY, "entity_id" UUID NOT NULL, "weekday" INTEGER NOT NULL,
  "start_minute" INTEGER NOT NULL, "end_minute" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EntityBusinessHour_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EntityBusinessHour_period_check" CHECK ("weekday" BETWEEN 0 AND 6 AND "start_minute" >= 0 AND "start_minute" < "end_minute" AND "end_minute" <= 1440)
);
CREATE UNIQUE INDEX "EntityBusinessHour_unique_period" ON "EntityBusinessHour"("entity_id", "weekday", "start_minute", "end_minute");
CREATE INDEX "EntityBusinessHour_entity_id_weekday_idx" ON "EntityBusinessHour"("entity_id", "weekday");

CREATE TABLE "ProfessionalWorkingHour" (
  "id" UUID PRIMARY KEY, "entity_id" UUID NOT NULL, "profile_id" UUID NOT NULL,
  "weekday" INTEGER NOT NULL, "start_minute" INTEGER NOT NULL, "end_minute" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfessionalWorkingHour_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessionalWorkingHour_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessionalWorkingHour_membership_fkey" FOREIGN KEY ("entity_id", "profile_id") REFERENCES "EntityMembership"("entity_id", "profile_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessionalWorkingHour_period_check" CHECK ("weekday" BETWEEN 0 AND 6 AND "start_minute" >= 0 AND "start_minute" < "end_minute" AND "end_minute" <= 1440)
);
CREATE UNIQUE INDEX "ProfessionalWorkingHour_unique_period" ON "ProfessionalWorkingHour"("entity_id", "profile_id", "weekday", "start_minute", "end_minute");
CREATE INDEX "ProfessionalWorkingHour_entity_id_profile_id_weekday_idx" ON "ProfessionalWorkingHour"("entity_id", "profile_id", "weekday");

CREATE TABLE "ProfessionalTimeBlock" (
  "id" UUID PRIMARY KEY, "entity_id" UUID NOT NULL, "profile_id" UUID NOT NULL,
  "starts_at" TIMESTAMPTZ(3) NOT NULL, "ends_at" TIMESTAMPTZ(3) NOT NULL,
  "reason" VARCHAR(500), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfessionalTimeBlock_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessionalTimeBlock_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessionalTimeBlock_membership_fkey" FOREIGN KEY ("entity_id", "profile_id") REFERENCES "EntityMembership"("entity_id", "profile_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfessionalTimeBlock_period_check" CHECK ("starts_at" < "ends_at")
);
CREATE INDEX "ProfessionalTimeBlock_entity_id_profile_id_starts_at_idx" ON "ProfessionalTimeBlock"("entity_id", "profile_id", "starts_at");
