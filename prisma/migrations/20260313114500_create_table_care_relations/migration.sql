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

CREATE UNIQUE INDEX IF NOT EXISTS "CareRelations_petId_userId_key" ON "CareRelations"("petId", "userId");
