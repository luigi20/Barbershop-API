-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "entity_id" UUID NOT NULL,
    "zip_code" VARCHAR NOT NULL,
    "street" VARCHAR NOT NULL,
    "number" VARCHAR NOT NULL,
    "complement" VARCHAR,
    "neighborhood" VARCHAR NOT NULL,
    "city" VARCHAR NOT NULL,
    "state" VARCHAR NOT NULL,
    "country" VARCHAR NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Address_entity_id_key" ON "Address"("entity_id");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
