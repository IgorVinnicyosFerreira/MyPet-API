# Tasks: Atualizacao de Dados de Pet por ID

**Input**: Design documents from `/Volumes/SSD Externo/Projects/MyPet/specs/004-update-pet-by-id/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/patch-update-pet-by-id.md`, `quickstart.md`

**Tests**: Unit tests are mandatory for service business rules. Integration tests are mandatory for PATCH contract, auth, and optimistic concurrency behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Preparation)

**Purpose**: Prepare shared contracts and test anchors before feature behavior implementation.

- [X] T001 Add update input types (`UpdatePetByIdInput`, `PetPatchPersistenceInput`) in `src/modules/v1/pets/pets.types.ts`
- [X] T002 Add PATCH schema placeholders and exports for update-by-id in `src/modules/v1/pets/pets.schemas.ts`
- [X] T003 [P] Add PATCH suite skeletons in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T004 [P] Add PATCH endpoint suite skeletons in `tests/integration/modules/v1/pets/pets.contract.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared plumbing required before any user story behavior can be completed.

**CRITICAL**: Complete this phase before implementing user story-specific behavior.

- [X] T005 Add repository contract method `updatePetByIdOptimistic` in `src/modules/v1/pets/repositories/pets-interfaces.repository.ts`
- [X] T006 [P] Implement optimistic compare-and-swap update by `updatedAt` in `src/modules/v1/pets/repositories/prisma-pets.repository.ts`
- [X] T007 [P] Add request/response typing for controller PATCH handler in `src/modules/v1/pets/pets.controller.ts`
- [X] T008 Register `PATCH /:petId` route shell with auth preHandler in `src/modules/v1/pets/pets.routes.ts`
- [X] T009 Wire new update method through module composition in `src/modules/v1/pets/pets.factory.ts`
- [X] T010 Add shared service helper for PATCH whitelist normalization (`observations -> notes`) in `src/modules/v1/pets/pets.service.ts`

**Checkpoint**: Foundation ready for independent story implementation.

---

## Phase 3: User Story 1 - Atualizar cadastro do pet (Priority: P1) 🎯 MVP

**Goal**: Allow authorized tutors to partially update allowed pet profile fields and receive updated data.

**Independent Test**: Send `PATCH /v1/pets/:id` as authorized user with valid `expectedUpdatedAt`; confirm `200` with updated fields and unchanged omitted fields.

### Tests for User Story 1

- [X] T011 [P] [US1] Add unit tests for successful partial update and `observations` mapping in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T012 [P] [US1] Add unit test for stale `expectedUpdatedAt` returning `409` in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T013 [P] [US1] Add integration tests for PATCH success and partial-update field preservation in `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [X] T014 [P] [US1] Add integration test for optimistic concurrency conflict (`409`) in `tests/integration/modules/v1/pets/pets.contract.spec.ts`

### Implementation for User Story 1

- [X] T015 [US1] Implement Zod `petUpdateParamSchema` and strict `petUpdateBodySchema` with allowed fields in `src/modules/v1/pets/pets.schemas.ts`
- [X] T016 [US1] Implement service method `updatePetById` with payload validation and optimistic conflict mapping in `src/modules/v1/pets/pets.service.ts`
- [X] T017 [US1] Implement controller handler `updatePetById` with typed params/body extraction in `src/modules/v1/pets/pets.controller.ts`
- [X] T018 [US1] Finalize repository field-by-field persistence mapping for PATCH update in `src/modules/v1/pets/repositories/prisma-pets.repository.ts`
- [X] T019 [US1] Finalize route schema responses (`200`, `400`, `409`) and controller binding in `src/modules/v1/pets/pets.routes.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Proteger atualizacao indevida (Priority: P2)

**Goal**: Block updates from users without pet relationship and return stable not-found behavior for missing pets.

**Independent Test**: Send `PATCH /v1/pets/:id` with unauthorized user and with nonexistent `petId`; confirm `403` and `404` respectively with no data mutation.

### Tests for User Story 2

- [X] T020 [P] [US2] Add unit tests for `403` (no permission) and `404` (pet not found) in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T021 [P] [US2] Add integration tests for unauthorized PATCH rejection and unchanged persisted data in `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [X] T022 [P] [US2] Add integration test for PATCH on nonexistent pet returning `404` envelope in `tests/integration/modules/v1/pets/pets.contract.spec.ts`

### Implementation for User Story 2

- [X] T023 [US2] Enforce authorization rule (`primaryTutorId` or ACTIVE `CareRelation`) before update in `src/modules/v1/pets/pets.service.ts`
- [X] T024 [US2] Enforce pet existence check with stable `RESOURCE_NOT_FOUND` mapping in `src/modules/v1/pets/pets.service.ts`
- [X] T025 [US2] Finalize route error contract for `403` and `404` in `src/modules/v1/pets/pets.routes.ts`
- [X] T026 [US2] Add structured logs for denied/not-found PATCH attempts with trace context in `src/modules/v1/pets/pets.service.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Consolidate quality, docs, and non-functional requirements across stories.

- [X] T027 [P] Add/update PATCH endpoint usage examples and scenarios in `specs/004-update-pet-by-id/quickstart.md`
- [X] T028 [P] Align final API contract examples and error envelopes in `specs/004-update-pet-by-id/contracts/patch-update-pet-by-id.md`
- [X] T029 [P] Expand contract assertions for `error.code` and `traceId` consistency in `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [X] T030 Run quality gates from `/Volumes/SSD Externo/Projects/MyPet` and record completion notes in `specs/004-update-pet-by-id/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies.
- Phase 2 (Foundational): depends on Phase 1 and blocks all user stories.
- Phase 3 (US1): depends on Phase 2.
- Phase 4 (US2): depends on Phase 2 and can proceed after US1 route baseline exists.
- Phase 5 (Polish): depends on completed stories.

### User Story Dependencies

- US1 (P1): starts after Foundational completion.
- US2 (P2): starts after Foundational completion; shares endpoint/service files with US1, so merge sequencing should be coordinated.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Preserve architecture chain: `routes -> controller -> service -> repository -> factory`.
- Keep route contracts explicit with Zod schemas for params/body/response.
- Maintain whitelist persistence and stable error envelope.

---

## Parallel Opportunities

- Phase 1: T003 and T004 in parallel.
- Phase 2: T006 and T007 in parallel.
- US1: T011, T012, T013, T014 in parallel; T017 and T018 can run in parallel after T016 starts.
- US2: T020, T021, T022 in parallel; T025 can run in parallel with T026 after T023/T024 baseline.
- Polish: T027, T028, T029 in parallel.

---

## Parallel Example: User Story 1

```bash
# Parallel test work
Task T011: tests/unit/modules/v1/pets/pets.service.spec.ts
Task T013: tests/integration/modules/v1/pets/pets.contract.spec.ts

# Parallel implementation work after service baseline
Task T017: src/modules/v1/pets/pets.controller.ts
Task T018: src/modules/v1/pets/repositories/prisma-pets.repository.ts
```

## Parallel Example: User Story 2

```bash
# Parallel test work
Task T020: tests/unit/modules/v1/pets/pets.service.spec.ts
Task T021: tests/integration/modules/v1/pets/pets.contract.spec.ts

# Parallel hardening after auth/existence rule baseline
Task T025: src/modules/v1/pets/pets.routes.ts
Task T026: src/modules/v1/pets/pets.service.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3 (US1).
4. Validate with unit + integration tests for US1 before expanding scope.

### Incremental Delivery

1. Deliver US1 (core PATCH update path) first.
2. Deliver US2 (authorization and not-found hardening).
3. Finish polish tasks and run all quality gates.

### Suggested MVP Scope

- Phase 1 + Phase 2 + Phase 3 (User Story 1 only).

---

## Completion Notes (T030)

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `make test` ✅
- `make test-integration` ✅
- `make test-coverage` ✅
- `make test-coverage-all` ✅ (`All files`: `% Funcs 92.05` / `% Lines 91.27`)
