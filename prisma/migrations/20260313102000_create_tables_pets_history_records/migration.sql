DO $$ BEGIN
  CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CareRole" AS ENUM ('PRIMARY_TUTOR', 'CO_TUTOR', 'CAREGIVER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CareStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FeedingType" AS ENUM ('FEED', 'NATURAL', 'MIXED', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FileDomain" AS ENUM ('EXAM', 'VACCINATION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "StorageProvider" AS ENUM ('LOCAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SanitaryCategory" AS ENUM ('DEWORMER', 'ANTIPARASITIC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Pets" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "species" TEXT NOT NULL,
  "breed" TEXT,
  "birthDate" TIMESTAMP(3),
  "sex" "Sex",
  "notes" TEXT,
  "primaryTutorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CareRelations" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "CareRole" NOT NULL,
  "status" "CareStatus" NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareRelations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeedingRecords" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "type" "FeedingType" NOT NULL,
  "description" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedingRecords_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WeightRecords" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "weightGrams" INTEGER NOT NULL,
  "measuredAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeightRecords_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Consultations" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "clinicName" TEXT,
  "vetName" TEXT,
  "notes" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Consultations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StoredFiles" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "domain" "FileDomain" NOT NULL,
  "provider" "StorageProvider" NOT NULL DEFAULT 'LOCAL',
  "relativePath" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "checksum" TEXT,
  "uploadedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoredFiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Exams" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Exams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExamAttachments" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "storedFileId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamAttachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Vaccinations" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "vaccineName" TEXT NOT NULL,
  "appliedAt" TIMESTAMP(3) NOT NULL,
  "vetName" TEXT NOT NULL,
  "nextDoseAt" TIMESTAMP(3),
  "reminderEnabled" BOOLEAN NOT NULL,
  "nextDoseReminderAt" TIMESTAMP(3),
  "notes" TEXT,
  "fileId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vaccinations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SanitaryRecords" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "category" "SanitaryCategory" NOT NULL,
  "productName" TEXT NOT NULL,
  "appliedAt" TIMESTAMP(3) NOT NULL,
  "nextApplicationAt" TIMESTAMP(3),
  "reminderEnabled" BOOLEAN NOT NULL,
  "notes" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SanitaryRecords_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CareRelations_petId_userId_key" ON "CareRelations"("petId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExamAttachments_examId_storedFileId_key" ON "ExamAttachments"("examId", "storedFileId");

ALTER TABLE "Pets"
  ADD CONSTRAINT "Pets_primaryTutorId_fkey" FOREIGN KEY ("primaryTutorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CareRelations"
  ADD CONSTRAINT "CareRelations_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CareRelations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CareRelations_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeedingRecords"
  ADD CONSTRAINT "FeedingRecords_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WeightRecords"
  ADD CONSTRAINT "WeightRecords_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Consultations"
  ADD CONSTRAINT "Consultations_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoredFiles"
  ADD CONSTRAINT "StoredFiles_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Exams"
  ADD CONSTRAINT "Exams_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamAttachments"
  ADD CONSTRAINT "ExamAttachments_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ExamAttachments_storedFileId_fkey" FOREIGN KEY ("storedFileId") REFERENCES "StoredFiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vaccinations"
  ADD CONSTRAINT "Vaccinations_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Vaccinations_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SanitaryRecords"
  ADD CONSTRAINT "SanitaryRecords_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
