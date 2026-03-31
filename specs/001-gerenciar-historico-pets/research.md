# Phase 0 Research - 001-gerenciar-historico-pets

## Scope

This document resolves all `NEEDS CLARIFICATION` items from the implementation plan and captures dependency/integration decisions for this feature.

## 1) API latency and throughput targets

- Decision: Adopt p95 <= 250ms for read endpoints and p95 <= 350ms for write endpoints (excluding file transfer time), with agenda endpoint supporting up to 200 active prescriptions per pet/day.
- Rationale: Targets are strict enough for mobile/web UX and still realistic for Fastify + Prisma + PostgreSQL in Docker-based environments.
- Alternatives considered: No explicit SLA in v1 (rejected because it blocks performance validation and load-test acceptance criteria).

## 2) Initial scale and data volume assumptions

- Decision: Design for 10k active users/month, 100k pets, and up to 2M historical records with pagination-first reads.
- Rationale: Covers projected early-stage adoption while preventing under-designed indexing and query strategies.
- Alternatives considered: Unlimited scale assumptions from day one (rejected due to over-engineering risk and complexity increase).

## 3) Authentication and authorization dependency

- Decision: Implement credentials auth (email + password) with password stored as hash in `Users.passwordHash`, expose login endpoint for bearer token issuance, and enforce role checks in service layer.
- Rationale: Satisfies the new mandatory auth requirement while keeping authorization logic centralized and testable.
- Alternatives considered: Anonymous access to v1 endpoints (rejected for security); auth checks only in controllers (rejected due to rule duplication).

## 4) Storage for exam/vaccine attachments

- Decision: Introduce `StorageProvider` interface and `LocalStorageProvider` implementation writing files under `/Volumes/SSD Externo/Projects/MyPet/storage`, with metadata persisted in DB.
- Rationale: Enables easy migration to S3-like backend later by replacing only provider implementation/factory wiring.
- Alternatives considered: Direct filesystem writes in services (rejected due to high coupling and hard future migration).

## 5) Storage path strategy

- Decision: Use deterministic relative paths by domain and pet, e.g. `pets/{petId}/exams/{uuid}.{ext}` and `pets/{petId}/vaccinations/{uuid}.{ext}`.
- Rationale: Improves traceability, simplifies cleanup/backup, and allows provider-agnostic metadata records.
- Alternatives considered: Flat directory with random names (rejected for maintainability and support operations).

## 6) File format and upload constraints

- Decision: Accept only `application/pdf`, `image/jpeg`, `image/png`, with max size 10MB; persist MIME and size in metadata.
- Rationale: Matches functional requirements and reduces risk of unsupported/unsafe uploads.
- Alternatives considered: Generic file acceptance (rejected due to security and compliance risks).

## 7) Medication schedule calculation strategy

- Decision: Store normalized frequency as `{value, unit}` where unit is `HOURS|DAYS|WEEKS`; compute `nextDoseAt` from `takenAt` for non-retroactive doses and keep current `nextDoseAt` unchanged for retroactive records (`takenAt < latestTakenAt`), using UTC timestamps and user timezone for presentation.
- Rationale: Keeps recurrence math consistent and avoids timezone drift in persistence.
- Alternatives considered: Persist local timezone timestamps only (rejected because DST and timezone changes can corrupt recurrence logic).

## 8) Widget agenda integration pattern

- Decision: Provide a dedicated read endpoint `/v1/pets/{petId}/medication-agenda?date=YYYY-MM-DD` returning chronologically ordered upcoming doses.
- Rationale: Gives mobile/web a stable, lightweight contract for home widgets without needing client-side orchestration.
- Alternatives considered: Frontend composing agenda from multiple endpoints (rejected due to higher client complexity and inconsistency risk).

## 9) Automated tests with Bun

- Decision: Use Bun as the test runner (`make test-coverage`) for unit/integration test suites while keeping runtime on Node.js.
- Rationale: Meets explicit user requirement and keeps implementation simple (single runner, native TS support).
- Alternatives considered: Vitest/Jest adoption (rejected because requirement asks Bun and goal is minimal libraries).

## 10) API docs generation

- Decision: Keep automatic contract docs via `@fastify/swagger` + `@scalar/fastify-api-reference`, published in `/docs`.
- Rationale: Already aligned with current codebase and ensures Zod-defined contracts stay discoverable.
- Alternatives considered: Manual OpenAPI file only (rejected because it drifts from runtime contracts).

## 11) Ownership of dosage and frequency fields

- Decision: Keep dosage and frequency exclusively in `Prescription`; `Medication` remains a reusable catalog item without therapeutic schedule fields.
- Rationale: Prevents duplicated regimen state and supports multiple prescriptions for the same medication.
- Alternatives considered: Persist dosage/frequency directly in `Medication` (rejected because it mixes catalog data with patient-specific treatment plan).

## 12) Vaccination reminders

- Decision: Add reminder fields to vaccination records (`reminderEnabled`, `nextDoseReminderAt`) in addition to `nextDoseAt`.
- Rationale: Vaccines also require proactive reminders, not only dewormer/antiparasitic records.
- Alternatives considered: Derive reminder only from `nextDoseAt` without explicit toggle (rejected because users need reminder opt-in/opt-out control).

## 13) Multiple files per exam

- Decision: Model exam attachments as 1:N (`Exam` -> `ExamAttachment` -> `StoredFile`) and accept `fileIds[]` in exam creation contract.
- Rationale: Supports exam records containing several files while preserving storage abstraction and metadata control.
- Alternatives considered: Single `fileId` on `Exam` (rejected because it cannot represent multi-file exam evidence).

## 14) Digital wallet output format

- Decision: Return digital wallet as structured JSON only in v1 (no PDF/binary contract).
- Rationale: Keeps client integration stable for web/mobile and avoids document-rendering coupling in backend contracts.
- Alternatives considered: PDF-only response (rejected due to lower reusability in client flows).

## 15) Hybrid medication catalog

- Decision: Use hybrid medication catalog with global base items plus tutor-owned custom items.
- Rationale: Allows personalization while preserving reusable canonical items.
- Alternatives considered: Global-only catalog (rejected due to low flexibility) and tenant-only catalog (rejected due to loss of reuse).

## 16) Concurrency policy

- Decision: Use optimistic locking on mutable clinical and prescription records with `409 Conflict` on stale version.
- Rationale: Prevents silent overwrite with low coordination overhead for concurrent mobile/web usage.
- Alternatives considered: Last-write-wins (rejected due to data-loss risk) and pessimistic locks (rejected due to operational complexity).

## Clarification status

All items previously marked as `NEEDS CLARIFICATION` in `plan.md` are resolved.
