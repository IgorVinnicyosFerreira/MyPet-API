DO $$ BEGIN
  CREATE TYPE "CatalogScope" AS ENUM ('GLOBAL', 'TUTOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DosageUnit" AS ENUM ('TABLET_FRACTION', 'DROPS', 'ML', 'UNIT', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FrequencyUnit" AS ENUM ('HOURS', 'DAYS', 'WEEKS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DoseStatus" AS ENUM ('TAKEN', 'LATE', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Medications" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "catalogScope" "CatalogScope" NOT NULL,
  "ownerUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Medications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Prescriptions" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "dosageValue" DECIMAL(10,2) NOT NULL,
  "dosageUnit" "DosageUnit" NOT NULL,
  "dosageOtherDescription" TEXT,
  "frequencyValue" INTEGER NOT NULL,
  "frequencyUnit" "FrequencyUnit" NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "nextDoseAt" TIMESTAMP(3) NOT NULL,
  "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DoseRecords" (
  "id" TEXT NOT NULL,
  "prescriptionId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "takenAt" TIMESTAMP(3) NOT NULL,
  "status" "DoseStatus" NOT NULL,
  "isRetroactive" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DoseRecords_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Medications_name_catalogScope_ownerUserId_key" ON "Medications"("name", "catalogScope", "ownerUserId");

ALTER TABLE "Prescriptions"
  ADD CONSTRAINT "Prescriptions_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Prescriptions_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DoseRecords"
  ADD CONSTRAINT "DoseRecords_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DoseRecords_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
