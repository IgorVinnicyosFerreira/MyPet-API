# Tasks: API de Historico e Cuidados de Pets

**Input**: Design documents from `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/`
**Prerequisites**: `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/plan.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/spec.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/research.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/data-model.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/contracts/pets-history.openapi.yaml`
**Context**: `$ARGUMENTS`

**Tests**: Unit tests and integration tests are mandatory for each user story because CA-007 and CA-008 require business-rule and persistence/contract coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes explicit file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize module skeleton, test skeleton, and task-ready project structure.

- [X] T001 Create feature module folders and README placeholders in `src/modules/v1/auth/README.md`, `src/modules/v1/pets/README.md`, `src/modules/v1/files/README.md`, `src/modules/v1/prescriptions/README.md`, `src/modules/v1/care-relations/README.md`, `src/modules/v1/digital-wallets/README.md`
- [X] T002 Create test folder structure in `tests/unit/modules/v1/` and `tests/integration/modules/v1/` with `.gitkeep` files
- [X] T003 [P] Add Bun test bootstrap files in `tests/setup/unit.setup.ts` and `tests/setup/integration.setup.ts`
- [X] T004 [P] Add schema/type stubs in `src/modules/v1/auth/auth.schemas.ts`, `src/modules/v1/auth/auth.types.ts`, `src/modules/v1/pets/pets.schemas.ts`, `src/modules/v1/pets/pets.types.ts`, `src/modules/v1/prescriptions/prescriptions.schemas.ts`, `src/modules/v1/prescriptions/prescriptions.types.ts`, `src/modules/v1/care-relations/care-relations.schemas.ts`, `src/modules/v1/care-relations/care-relations.types.ts`, `src/modules/v1/digital-wallets/digital-wallets.schemas.ts`, `src/modules/v1/digital-wallets/digital-wallets.types.ts`
- [X] T005 [P] Add base route/controller/service/repository/factory files for each module under `src/modules/v1/*/`
- [X] T006 Configure quality gate scripts in `package.json` and ensure `make typecheck` fallback remains in `Makefile`
- [X] T007 [P] Add task references for this feature in `specs/001-gerenciar-historico-pets/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core cross-cutting infrastructure that blocks all stories.

**CRITICAL**: No user story task starts before this phase is done.

- [X] T008 Implement global error envelope mapper (`error.code`, `message`, `details`, `traceId`) in `src/lib/http/error-handler.ts`
- [X] T009 [P] Implement structured request logging (`timestamp`, `level`, `message`, `traceId`, `context`) in `src/lib/logger.ts`
- [X] T010 [P] Implement auth token utilities and password hashing helpers in `src/lib/auth/jwt.ts` and `src/lib/auth/password.ts`
- [X] T011 Implement auth guard and role permission helpers in `src/lib/http/auth-middleware.ts` and `src/lib/http/permissions.ts`
- [X] T012 [P] Implement rate-limit setup for sensitive/public endpoints in `src/lib/http/rate-limit.ts`
- [X] T013 [P] Implement storage abstraction in `src/lib/storage/storage-provider.ts`, `src/lib/storage/local-storage.provider.ts`, `src/lib/storage/storage.factory.ts`
- [X] T014 Update Prisma datasource/client settings and shared enums in `prisma/schema.prisma`
- [X] T015 Create auth baseline migration (password hash + timestamps) from `prisma/schema.prisma` into `prisma/migrations/`
- [X] T016 Register foundational plugins and handlers in `src/server.ts`
- [X] T017 Register all v1 resource routers in `src/routes/index.ts` with plural REST prefixes

**Checkpoint**: Foundation complete; stories can proceed.

---

## Phase 3: User Story 1 - Historico Clinico Completo do Pet (Priority: P1) 🎯 MVP

**Goal**: Provide full pet lifecycle history with clinical/sanitary records and attachments.

**Independent Test**: Authenticate tutor, create pet, register feeding/weight/consultation/exam/vaccination/sanitary events, then fetch consolidated history sorted by event date.

### Tests for User Story 1 (MANDATORY)

- [X] T018 [P] [US1] Add unit tests for pet ownership, feeding transition rules, and optimistic-lock update guards for clinical records in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T019 [P] [US1] Add unit tests for file validation rules (mime/size/domain) in `tests/unit/modules/v1/files/files.service.spec.ts`
- [X] T020 [P] [US1] Add integration contract tests for `/v1/pets` and `/v1/pets/{petId}/history` in `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [X] T021 [P] [US1] Add integration contract tests for `/v1/files/uploads`, `/v1/pets/{petId}/exams`, `/v1/pets/{petId}/vaccinations` in `tests/integration/modules/v1/pets/attachments.contract.spec.ts`
- [X] T022 [US1] Add repository integration tests for chronological history query in `tests/integration/modules/v1/pets/pets.repository.spec.ts`

### Implementation for User Story 1

- [X] T023 [P] [US1] Model US1 entities (`Pet`, `FeedingRecord`, `WeightRecord`, `Consultation`, `StoredFile`, `Exam`, `ExamAttachment`, `Vaccination`, `SanitaryRecord`) in `prisma/schema.prisma`
- [X] T024 [US1] Generate descriptive migration `create_tables_pets_history_records` under `prisma/migrations/` from `prisma/schema.prisma`
- [X] T025 [P] [US1] Implement repository interfaces in `src/modules/v1/pets/repositories/pets-interfaces.repository.ts` and `src/modules/v1/files/repositories/files-interfaces.repository.ts`
- [X] T026 [P] [US1] Implement Prisma repositories in `src/modules/v1/pets/repositories/prisma-pets.repository.ts` and `src/modules/v1/files/repositories/prisma-files.repository.ts`
- [X] T027 [P] [US1] Implement Zod contracts for pet and history endpoints in `src/modules/v1/pets/pets.schemas.ts`
- [X] T028 [P] [US1] Implement Zod contracts for upload and attachment binding in `src/modules/v1/files/files.schemas.ts`
- [X] T029 [US1] Implement pets domain service (ownership, feeding history closure, timeline ordering, and versioned clinical updates with optimistic locking) in `src/modules/v1/pets/pets.service.ts`
- [X] T030 [US1] Implement files domain service (whitelist persistence, mime/size checks, storage metadata) in `src/modules/v1/files/files.service.ts`
- [X] T031 [P] [US1] Implement HTTP controllers in `src/modules/v1/pets/pets.controller.ts` and `src/modules/v1/files/files.controller.ts`
- [X] T032 [P] [US1] Implement routes `/v1/pets`, `/v1/pets/{petId}/feedings`, `/v1/pets/{petId}/weights`, `/v1/pets/{petId}/consultations`, `/v1/pets/{petId}/exams`, `/v1/pets/{petId}/vaccinations`, `/v1/pets/{petId}/sanitary-records`, `/v1/pets/{petId}/history`, `/v1/pets/{petId}/history/{recordType}/{recordId}` in `src/modules/v1/pets/pets.routes.ts`
- [X] T033 [P] [US1] Implement route `/v1/files/uploads` in `src/modules/v1/files/files.routes.ts`
- [X] T034 [US1] Wire dependencies in `src/modules/v1/pets/pets.factory.ts` and `src/modules/v1/files/files.factory.ts`
- [X] T035 [US1] Register `pets` and `files` route modules in `src/routes/index.ts` and align generated docs in `src/server.ts`

**Checkpoint**: US1 can be developed, tested, and demonstrated independently.

---

## Phase 4: User Story 2 - Rotina de Medicacao e Lembretes (Priority: P2)

**Goal**: Allow prescription management, dose intake registration, and medication agenda retrieval.

**Independent Test**: Create a prescription with dosage/frequency, mark dose as taken, verify automatic `nextDoseAt` recalculation for non-retroactive doses, preserve schedule for retroactive doses, and validate agenda endpoint ordering.

### Tests for User Story 2 (MANDATORY)

- [X] T036 [P] [US2] Add unit tests for dosage/frequency validation and `OTHER` dosage rule in `tests/unit/modules/v1/prescriptions/prescriptions.service.spec.ts`
- [X] T037 [P] [US2] Add unit tests for dose status (`TAKEN`, `LATE`), retroactive handling, and next schedule calculation rules in `tests/unit/modules/v1/prescriptions/dose-calculation.service.spec.ts`
- [X] T038 [P] [US2] Add integration contract tests for `/v1/prescriptions`, `/v1/prescriptions/{prescriptionId}`, and `/v1/prescriptions/{prescriptionId}/dose-records`, including `409` conflict on stale version in `tests/integration/modules/v1/prescriptions/prescriptions.contract.spec.ts`
- [X] T039 [US2] Add integration tests for `/v1/pets/{petId}/medication-agenda` ordering and filtering in `tests/integration/modules/v1/prescriptions/agenda.contract.spec.ts`

### Implementation for User Story 2

- [X] T040 [P] [US2] Model `Medication`, `Prescription`, and `DoseRecord` entities in `prisma/schema.prisma` with hybrid medication catalog (global + tutor custom) and optimistic-lock `version` fields
- [X] T041 [US2] Generate descriptive migration `create_tables_medications_prescriptions_dose_records` under `prisma/migrations/` from `prisma/schema.prisma`
- [X] T042 [P] [US2] Implement repository interface and Prisma repository in `src/modules/v1/prescriptions/repositories/prescriptions-interfaces.repository.ts` and `src/modules/v1/prescriptions/repositories/prisma-prescriptions.repository.ts`
- [X] T043 [P] [US2] Implement Zod schemas for prescription/dose/agenda endpoints in `src/modules/v1/prescriptions/prescriptions.schemas.ts`, including versioned update contracts
- [X] T044 [US2] Implement service rules for medication upsert-link on hybrid catalog, dosage validation, retroactive-dose no-recalculation, and optimistic locking with `409` mapping in `src/modules/v1/prescriptions/prescriptions.service.ts`
- [X] T045 [P] [US2] Implement controller methods in `src/modules/v1/prescriptions/prescriptions.controller.ts`
- [X] T046 [P] [US2] Implement routes `/v1/prescriptions`, `/v1/prescriptions/{prescriptionId}`, `/v1/prescriptions/{prescriptionId}/dose-records`, `/v1/pets/{petId}/medication-agenda` in `src/modules/v1/prescriptions/prescriptions.routes.ts`
- [X] T047 [US2] Wire dependencies in `src/modules/v1/prescriptions/prescriptions.factory.ts`
- [X] T048 [US2] Register prescriptions routes and OpenAPI tags in `src/routes/index.ts` and `src/server.ts`

**Checkpoint**: US2 works independently with valid agenda output.

---

## Phase 5: User Story 3 - Compartilhamento de Cuidado e Carteira Digital (Priority: P3)

**Goal**: Support role-based care sharing and digital wallet generation with sanitary history.

**Independent Test**: Invite co-tutor/caregiver, enforce role permissions, and generate digital wallet with vaccination + sanitary records for a selected period.

### Tests for User Story 3 (MANDATORY)

- [X] T049 [P] [US3] Add unit tests for role permissions matrix (`CO_TUTOR` create/edit without delete; `CAREGIVER` only dose/notes) in `tests/unit/modules/v1/care-relations/care-relations.service.spec.ts`
- [X] T050 [P] [US3] Add unit tests for wallet filtering/sorting rules and JSON-only output contract in `tests/unit/modules/v1/digital-wallets/digital-wallets.service.spec.ts`
- [X] T051 [US3] Add integration contract tests for `/v1/pets/{petId}/care-relations` and `/v1/pets/{petId}/digital-wallet` validating role restrictions and JSON response in `tests/integration/modules/v1/care-relations/care-relations-wallet.contract.spec.ts`

### Implementation for User Story 3

- [X] T052 [P] [US3] Model `CareRelation` entity and relation constraints in `prisma/schema.prisma`
- [X] T053 [US3] Generate descriptive migration `create_table_care_relations` under `prisma/migrations/` from `prisma/schema.prisma`
- [X] T054 [P] [US3] Implement repositories in `src/modules/v1/care-relations/repositories/care-relations-interfaces.repository.ts`, `src/modules/v1/care-relations/repositories/prisma-care-relations.repository.ts`, `src/modules/v1/digital-wallets/repositories/digital-wallets-interfaces.repository.ts`, `src/modules/v1/digital-wallets/repositories/prisma-digital-wallets.repository.ts`
- [X] T055 [P] [US3] Implement Zod schemas for sharing and wallet endpoints in `src/modules/v1/care-relations/care-relations.schemas.ts` and `src/modules/v1/digital-wallets/digital-wallets.schemas.ts`
- [X] T056 [US3] Implement services for invitation/permission checks (with clarified role matrix) and wallet aggregation returning structured JSON in `src/modules/v1/care-relations/care-relations.service.ts` and `src/modules/v1/digital-wallets/digital-wallets.service.ts`
- [X] T057 [P] [US3] Implement controllers/routes in `src/modules/v1/care-relations/care-relations.controller.ts`, `src/modules/v1/care-relations/care-relations.routes.ts`, `src/modules/v1/digital-wallets/digital-wallets.controller.ts`, `src/modules/v1/digital-wallets/digital-wallets.routes.ts`
- [X] T058 [US3] Wire factories and register routes in `src/modules/v1/care-relations/care-relations.factory.ts`, `src/modules/v1/digital-wallets/digital-wallets.factory.ts`, and `src/routes/index.ts`

**Checkpoint**: US3 permission and wallet flows are independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality hardening across stories.

- [X] T059 [P] Update and reconcile feature contract in `specs/001-gerenciar-historico-pets/contracts/pets-history.openapi.yaml` with implemented endpoints, including hybrid medication input, retroactive dose semantics, JSON-only digital wallet, and `409 Conflict` concurrency responses
- [X] T060 [P] Add API usage examples and expected error payloads in `specs/001-gerenciar-historico-pets/quickstart.md`
- [X] T061 Run schema generation and formatting (`prisma generate`) and validate generated client under `generated/prisma/`
- [X] T062 Expand test fixtures and shared helpers for coverage >= 80% in `tests/support/factories/` and `tests/support/http-client.ts`
- [X] T063 Execute and fix type/lint/test gates via `make typecheck`, `pnpm biome check .`, and `make test-coverage` from repo root
- [X] T064 Audit sensitive response fields and structured logs in `src/modules/v1/**` and `src/lib/**` to ensure no `passwordHash`, token secrets, or stack leak in production responses
- [X] T065 [P] Add integration tests for optimistic-lock conflicts (`409`) on clinical and prescription update endpoints in `tests/integration/modules/v1/**`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies
- Foundational (Phase 2): depends on Setup; blocks all user stories
- US1 (Phase 3): depends on Foundational
- US2 (Phase 4): depends on Foundational and reuses pet/auth foundation from US1
- US3 (Phase 5): depends on Foundational and reuses US1 sanitary history resources
- Polish (Phase 6): depends on completed stories in release scope

### User Story Dependencies

- US1 (P1): first functional increment and MVP baseline
- US2 (P2): can start after Foundational, but production flow expects US1 pet lifecycle data
- US3 (P3): can start after Foundational, but wallet and permissions rely on US1 data and role model

### Within Each User Story

- Tests first: unit and integration tasks are listed before implementation
- Layering must remain `routes -> controller -> service -> repository -> factory`
- Zod contracts must cover `querystring`, `params`, `body`, and `response`
- Services use repository interfaces; repositories stay Prisma-only
- Each story must pass its own tests before moving to next phase

## Parallel Opportunities

- Phase 1: T003, T004, T005, T007 in parallel
- Phase 2: T009, T010, T012, T013, T014 in parallel after T008 starts
- US1: T018-T021 in parallel; T025/T026/T027/T028 in parallel; T031/T032/T033 in parallel
- US2: T036/T037/T038 in parallel; T042/T043 in parallel; T045/T046 in parallel
- US3: T049/T050 in parallel; T054/T055 in parallel; T057 can run in parallel once T056 starts stabilizing

---

## Parallel Example: User Story 1

```bash
Task T018 - tests/unit/modules/v1/pets/pets.service.spec.ts
Task T019 - tests/unit/modules/v1/files/files.service.spec.ts
Task T020 - tests/integration/modules/v1/pets/pets.contract.spec.ts
Task T021 - tests/integration/modules/v1/pets/attachments.contract.spec.ts
```

```bash
Task T031 - src/modules/v1/pets/pets.controller.ts
Task T032 - src/modules/v1/pets/pets.routes.ts
Task T033 - src/modules/v1/files/files.routes.ts
```

## Parallel Example: User Story 2

```bash
Task T036 - tests/unit/modules/v1/prescriptions/prescriptions.service.spec.ts
Task T037 - tests/unit/modules/v1/prescriptions/dose-calculation.service.spec.ts
Task T038 - tests/integration/modules/v1/prescriptions/prescriptions.contract.spec.ts
```

```bash
Task T042 - src/modules/v1/prescriptions/repositories/prisma-prescriptions.repository.ts
Task T043 - src/modules/v1/prescriptions/prescriptions.schemas.ts
Task T045 - src/modules/v1/prescriptions/prescriptions.controller.ts
```

## Parallel Example: User Story 3

```bash
Task T049 - tests/unit/modules/v1/care-relations/care-relations.service.spec.ts
Task T050 - tests/unit/modules/v1/digital-wallets/digital-wallets.service.spec.ts
Task T051 - tests/integration/modules/v1/care-relations/care-relations-wallet.contract.spec.ts
```

```bash
Task T054 - src/modules/v1/care-relations/repositories/prisma-care-relations.repository.ts
Task T055 - src/modules/v1/care-relations/care-relations.schemas.ts
Task T057 - src/modules/v1/care-relations/care-relations.routes.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) end-to-end.
3. Run quality gates for US1 scope before adding new stories.

### Incremental Delivery

1. Ship US1 (core history).
2. Add US2 (medication routine and agenda).
3. Add US3 (care sharing and digital wallet).
4. Run final polish and full regression gates.

### Parallel Team Strategy

1. Team aligns on Setup + Foundational.
2. After Foundational:
   - Dev A leads US1
   - Dev B leads US2
   - Dev C leads US3
3. Integrate only after each story passes its own tests.

## Notes

- Checklist format is strict and preserved for all tasks.
- `[P]` only marks tasks with separable files/dependencies.
- Story labels are only used in story phases.
