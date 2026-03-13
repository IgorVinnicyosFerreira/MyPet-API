# Data Model - 001-gerenciar-historico-pets

## Modeling conventions

- Code entities use singular names (`Pet`, `Prescription`).
- Database tables use plural names (`Pets`, `Prescriptions`).
- All persisted entities include `createdAt` and `updatedAt`.
- Persistence mapping is whitelist-only (never raw `req.body`).
- Mutable clinical and prescription records use optimistic locking with `version: int` and return `409 Conflict` on version mismatch.

## Entity: User

- Table: `Users`
- Fields:
- `id: uuid` (PK)
- `name: string(3..120)`
- `email: string` (unique, normalized)
- `passwordHash: string(60..255)` (never returned in API responses)
- `createdAt: datetime`
- `updatedAt: datetime`
- Relationships:
- 1:N with `Pet` as primary tutor
- N:N with `Pet` via `CareRelation`
- Validation rules:
- credentials-based authentication requires unique email and password verification against `passwordHash`

## Entity: Pet

- Table: `Pets`
- Fields:
- `id: uuid` (PK)
- `name: string(1..120)`
- `species: string(1..60)`
- `breed: string(0..80)` optional
- `birthDate: date` optional
- `sex: enum(MALE, FEMALE, UNKNOWN)` optional
- `notes: string(0..2000)` optional
- `primaryTutorId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- Relationships:
- 1:N with `FeedingRecord`, `WeightRecord`, `Consultation`, `Exam`, `Vaccination`, `SanitaryRecord`, `Prescription`
- 1:N with `CareRelation`
- Validation rules:
- `name`, `species`, `primaryTutorId` are required.
- Only primary tutor can delete pet.

## Entity: CareRelation

- Table: `CareRelations`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `userId: uuid` (FK `Users.id`)
- `role: enum(PRIMARY_TUTOR, CO_TUTOR, CAREGIVER)`
- `status: enum(PENDING, ACTIVE, REVOKED)`
- `invitedByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `revokedAt: datetime` optional
- Relationships:
- N:1 with `Pet`
- N:1 with `User`
- Validation rules:
- unique (`petId`, `userId`)
- `CO_TUTOR` can create/edit clinical records but cannot delete pet or delete clinical records
- `CAREGIVER` can only register dose consumption and notes (no clinical record create/edit/delete)
- State transitions:
- `PENDING -> ACTIVE`
- `ACTIVE -> REVOKED`

## Entity: FeedingRecord

- Table: `FeedingRecords`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `type: enum(FEED, NATURAL, MIXED, OTHER)`
- `description: string(1..500)`
- `startsAt: datetime`
- `endsAt: datetime` optional
- `isActive: boolean`
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)
- Validation rules:
- only one active feeding record per pet at a time
- when new active record is created, previous active record must be closed (`endsAt` set)
- State transitions:
- `ACTIVE -> HISTORICAL` (when replaced or explicitly ended)

## Entity: WeightRecord

- Table: `WeightRecords`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `weightGrams: int` (> 0)
- `measuredAt: datetime`
- `note: string(0..500)` optional
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)
- Validation rules:
- `measuredAt` cannot be null
- supports chronological chart queries ordered by `measuredAt`

## Entity: Consultation

- Table: `Consultations`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `occurredAt: datetime`
- `clinicName: string(0..120)` optional
- `vetName: string(0..120)` optional
- `notes: string(0..5000)` optional
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)

## Entity: StoredFile

- Table: `StoredFiles`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `domain: enum(EXAM, VACCINATION)`
- `provider: enum(LOCAL)` (future: `S3`)
- `relativePath: string(1..255)`
- `originalName: string(1..255)`
- `mimeType: enum(application/pdf, image/jpeg, image/png)`
- `sizeBytes: int` (1..10485760)
- `checksum: string(0..128)` optional
- `uploadedByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- Validation rules:
- max file size 10MB
- only allowed MIME types

## Entity: Exam

- Table: `Exams`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `type: string(1..80)`
- `occurredAt: datetime`
- `notes: string(0..5000)` optional
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)
- Relationships:
- 1:N with `ExamAttachment`

## Entity: ExamAttachment

- Table: `ExamAttachments`
- Fields:
- `id: uuid` (PK)
- `examId: uuid` (FK `Exams.id`)
- `storedFileId: uuid` (FK `StoredFiles.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)
- Validation rules:
- each exam must reference at least one attachment
- unique (`examId`, `storedFileId`)

## Entity: Vaccination

- Table: `Vaccinations`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `vaccineName: string(1..120)`
- `appliedAt: datetime`
- `vetName: string(1..120)`
- `nextDoseAt: datetime` optional
- `reminderEnabled: boolean`
- `nextDoseReminderAt: datetime` optional
- `notes: string(0..5000)` optional
- `fileId: uuid` (FK `StoredFiles.id`) optional
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)
- Validation rules:
- if `reminderEnabled=true`, `nextDoseAt` or `nextDoseReminderAt` must be provided

## Entity: SanitaryRecord

- Table: `SanitaryRecords`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `category: enum(DEWORMER, ANTIPARASITIC)`
- `productName: string(1..120)`
- `appliedAt: datetime`
- `nextApplicationAt: datetime` optional
- `reminderEnabled: boolean`
- `notes: string(0..1000)` optional
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)

## Entity: Medication

- Table: `Medications`
- Fields:
- `id: uuid` (PK)
- `name: string(1..120)`
- `description: string(0..500)` optional
- `catalogScope: enum(GLOBAL, TUTOR)`
- `ownerUserId: uuid` (FK `Users.id`) optional
- `createdAt: datetime`
- `updatedAt: datetime`
- Relationships:
- N:1 (optional) with `User` when `catalogScope=TUTOR`
- Validation rules:
- dosage and frequency are not persisted in `Medication`; both belong to `Prescription`
- if `catalogScope=GLOBAL`, `ownerUserId` must be null
- if `catalogScope=TUTOR`, `ownerUserId` is required
- unique (`name`, `catalogScope`, `ownerUserId`) to support hybrid catalog (base global + tutor custom)

## Entity: Prescription

- Table: `Prescriptions`
- Fields:
- `id: uuid` (PK)
- `petId: uuid` (FK `Pets.id`)
- `medicationId: uuid` (FK `Medications.id`)
- `dosageValue: decimal(10,2)` (> 0)
- `dosageUnit: enum(TABLET_FRACTION, DROPS, ML, UNIT, OTHER)`
- `dosageOtherDescription: string(1..120)` optional
- `frequencyValue: int` (> 0)
- `frequencyUnit: enum(HOURS, DAYS, WEEKS)`
- `startsAt: datetime`
- `nextDoseAt: datetime`
- `reminderEnabled: boolean`
- `status: enum(ACTIVE, PAUSED, COMPLETED, CANCELED)`
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- `version: int` (default 1)
- Validation rules:
- `dosageOtherDescription` required if `dosageUnit=OTHER`
- `nextDoseAt` must be recalculated after each taken dose except retroactive dose records
- State transitions:
- `ACTIVE <-> PAUSED`
- `ACTIVE -> COMPLETED`
- `ACTIVE|PAUSED -> CANCELED`

## Entity: DoseRecord

- Table: `DoseRecords`
- Fields:
- `id: uuid` (PK)
- `prescriptionId: uuid` (FK `Prescriptions.id`)
- `petId: uuid` (FK `Pets.id`)
- `scheduledFor: datetime`
- `takenAt: datetime`
- `status: enum(TAKEN, LATE, SKIPPED)`
- `isRetroactive: boolean`
- `notes: string(0..1000)` optional
- `createdByUserId: uuid` (FK `Users.id`)
- `createdAt: datetime`
- `updatedAt: datetime`
- Validation rules:
- permit out-of-order records and mark `isRetroactive=true` when `takenAt < latestTakenAt`
- out-of-order records must be marked as `LATE`
- on `TAKEN` and `isRetroactive=false`, update parent `Prescription.nextDoseAt`
- on `TAKEN` and `isRetroactive=true`, do not recalculate parent `Prescription.nextDoseAt`

## Read model: DigitalWallet

- Type: computed view, not a separate write table in v1
- Output contract: structured JSON response only (no PDF/binary output in v1)
- Composition:
- pet identity data
- vaccination records
- sanitary records (`DEWORMER`, `ANTIPARASITIC`)
- period filters (`from`, `to`) and generated timestamp
- Validation rules:
- only authorized roles can request wallet
- records sorted by event date
