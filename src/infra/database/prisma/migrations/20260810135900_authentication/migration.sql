-- CreateTable
CREATE TABLE "Entity" (
    "id" UUID NOT NULL,
    "type" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "document" VARCHAR,
    "email" VARCHAR,
    "phone" VARCHAR,
    "photo" VARCHAR,
    "status" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "password_hash" VARCHAR,
    "mfa_required" BOOLEAN NOT NULL,
    "provider" VARCHAR NOT NULL,
    "provider_id" UUID,
    "status" VARCHAR NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "identity_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "phone" VARCHAR NOT NULL,
    "photo" VARCHAR,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaCode" (
    "id" UUID NOT NULL,
    "identity_id" UUID NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "identity_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMembership" (
    "id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "role" VARCHAR NOT NULL,
    "status" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityCustomer" (
    "id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "status" VARCHAR NOT NULL,
    "notes" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "price" DECIMAL(10,2) NOT NULL,
    "max_members" INTEGER,
    "max_customers" INTEGER,
    "max_appointments" INTEGER,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Identity_email_key" ON "Identity"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_provider_provider_id_key" ON "Identity"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_identity_id_key" ON "Profile"("identity_id");

-- CreateIndex
CREATE INDEX "MfaCode_identity_id_idx" ON "MfaCode"("identity_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_identity_id_idx" ON "PasswordResetToken"("identity_id");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMembership_entity_id_profile_id_key" ON "EntityMembership"("entity_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "EntityCustomer_entity_id_profile_id_key" ON "EntityCustomer"("entity_id", "profile_id");

-- CreateIndex
CREATE INDEX "Subscription_entity_id_idx" ON "Subscription"("entity_id");

-- CreateIndex
CREATE INDEX "Subscription_plan_id_idx" ON "Subscription"("plan_id");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaCode" ADD CONSTRAINT "MfaCode_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMembership" ADD CONSTRAINT "EntityMembership_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMembership" ADD CONSTRAINT "EntityMembership_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCustomer" ADD CONSTRAINT "EntityCustomer_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityCustomer" ADD CONSTRAINT "EntityCustomer_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
