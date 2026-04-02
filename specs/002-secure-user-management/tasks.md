# Tasks: Secure User Management

**Input**: Design documents from `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/`
**Prerequisites**: `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/plan.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/spec.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/research.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/data-model.md`, `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/contracts/users-management.openapi.yaml`

**Tests**: Unit tests and integration tests are required by CA-007 and CA-008.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare test scaffolding and helpers for secure user-management flows.

- [X] T001 Create module test directories `tests/unit/modules/v1/auth/` and `tests/unit/modules/v1/users/`
- [X] T002 Create integration test directory `tests/integration/modules/v1/users/` and auth contracts directory `tests/integration/modules/v1/auth/`
- [X] T003 [P] Extend reusable auth test helpers for bearer flows in `tests/support/http-client.ts`
- [X] T004 [P] Add user factory support for deterministic admin/non-admin fixtures in `tests/support/factories/user-factory.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts and repository capabilities required before any user story work.

**CRITICAL**: User story implementation starts only after this phase is complete.

- [X] T005 Expand user repository abstraction with `findById`, `findByEmail`, `updateById`, and `deleteById` in `src/modules/v1/users/repositories/users-interfaces.repository.ts`
- [X] T006 [P] Implement foundational Prisma methods for user lookup/update/delete in `src/modules/v1/users/repositories/prisma-users.repository.ts`
- [X] T007 [P] Define shared user request/response/domain types for get/update/delete flows in `src/modules/v1/users/users.types.ts`
- [X] T008 [P] Define shared Zod schemas for user id params, update payload whitelist, and sanitized user response in `src/modules/v1/users/users.schemas.ts`
- [X] T009 Add role-aware JWT payload typing used by authorization checks in `src/lib/auth/jwt.ts`
- [X] T010 [P] Add controller method stubs for get/update/delete orchestration in `src/modules/v1/users/users.controller.ts`
- [X] T011 Wire users module factory to updated service/repository interfaces in `src/modules/v1/users/users.factory.ts`

**Checkpoint**: Foundation complete; user stories can proceed independently.

---

## Phase 3: User Story 1 - Register with immediate access (Priority: P1) MVP

**Goal**: Return a usable authentication token in `POST /v1/auth/register` without removing existing response fields.

**Independent Test**: Register a new account via `/v1/auth/register`, confirm response includes existing user fields plus `token` and `expiresIn`, then call a protected route with that token.

### Tests for User Story 1 (MANDATORY)

- [X] T012 [P] [US1] Add unit tests for register token issuance, duplicate email conflict, and token-failure handling in `tests/unit/modules/v1/auth/auth.service.spec.ts`
- [X] T013 [P] [US1] Add integration contract tests for `POST /v1/auth/register` success payload in `tests/integration/modules/v1/auth/auth.contract.spec.ts`
- [X] T014 [US1] Add integration test for duplicate register returning stable error envelope without token in `tests/integration/modules/v1/auth/auth.contract.spec.ts`

### Implementation for User Story 1

- [X] T015 [P] [US1] Extend register response type to include `token` and `expiresIn` in `src/modules/v1/auth/auth.types.ts`
- [X] T016 [P] [US1] Update register response schema to preserve user fields and add auth fields in `src/modules/v1/auth/auth.schemas.ts`
- [X] T017 [US1] Update register route response contract to the new schema in `src/modules/v1/auth/auth.routes.ts`
- [X] T018 [US1] Implement register auto-auth token issuance with stable error mapping in `src/modules/v1/auth/auth.service.ts`
- [X] T019 [US1] Update auth repository interface for register-flow persistence needs in `src/modules/v1/auth/repositories/auth-interfaces.repository.ts`
- [X] T020 [US1] Implement repository behavior required by register auto-auth flow in `src/modules/v1/auth/repositories/prisma-auth.repository.ts`
- [X] T021 [US1] Keep register controller orchestration aligned with updated service output in `src/modules/v1/auth/auth.controller.ts`
- [X] T022 [US1] Update auth factory wiring after service/repository changes in `src/modules/v1/auth/auth.factory.ts`

**Checkpoint**: Register flow is independently releasable with immediate authentication.

---

## Phase 4: User Story 3 - Authorized user update (Priority: P1)

**Goal**: Allow `PATCH /v1/users/{userId}` only for self or `SUPER_ADMIN`, with strict field whitelist.

**Independent Test**: Execute PATCH with three actors (self, super admin, unrelated user) and verify only self/super admin succeed.

### Tests for User Story 3 (MANDATORY)

- [X] T023 [P] [US3] Add unit tests for update authorization matrix and whitelist validation in `tests/unit/modules/v1/users/users.service.spec.ts`
- [X] T024 [P] [US3] Add integration contract tests for PATCH success and forbidden paths in `tests/integration/modules/v1/users/users.contract.spec.ts`
- [X] T025 [US3] Add integration test for PATCH email uniqueness conflict (`409`) in `tests/integration/modules/v1/users/users.contract.spec.ts`

### Implementation for User Story 3

- [X] T026 [P] [US3] Add PATCH body/params/response schemas (`200/403/409/422`) in `src/modules/v1/users/users.schemas.ts`
- [X] T027 [P] [US3] Add update command and authorization context types in `src/modules/v1/users/users.types.ts`
- [X] T028 [US3] Implement self-or-super-admin authorization and whitelist update logic in `src/modules/v1/users/users.service.ts`
- [X] T029 [US3] Implement PATCH controller method using `req.user` and `params.userId` in `src/modules/v1/users/users.controller.ts`
- [X] T030 [US3] Implement authenticated PATCH route `/v1/users/{userId}` in `src/modules/v1/users/users.routes.ts`
- [X] T031 [US3] Implement whitelist field-by-field update persistence in `src/modules/v1/users/repositories/prisma-users.repository.ts`

**Checkpoint**: Authorized update works independently with correct permission and conflict behavior.

---

## Phase 5: User Story 2 - Authenticated get user by id (Priority: P2)

**Goal**: Provide authenticated `GET /v1/users/{userId}` returning only sanitized user data.

**Independent Test**: Call GET with valid token and existing ID (200), no token (401), and missing ID (404).

### Tests for User Story 2 (MANDATORY)

- [X] T032 [P] [US2] Add unit tests for get-by-id not-found mapping and response sanitization in `tests/unit/modules/v1/users/users.service.spec.ts`
- [X] T033 [P] [US2] Add integration contract tests for GET `200/401/404` in `tests/integration/modules/v1/users/users.contract.spec.ts`

### Implementation for User Story 2

- [X] T034 [P] [US2] Add GET params and `200/401/404` response schemas in `src/modules/v1/users/users.schemas.ts`
- [X] T035 [US2] Implement get-by-id service method with sensitive-field filtering in `src/modules/v1/users/users.service.ts`
- [X] T036 [US2] Implement GET controller method for `/v1/users/{userId}` in `src/modules/v1/users/users.controller.ts`
- [X] T037 [US2] Implement authenticated GET route `/v1/users/{userId}` with `fastify.authenticate` in `src/modules/v1/users/users.routes.ts`
- [X] T038 [US2] Implement repository projection for sanitized get-by-id result in `src/modules/v1/users/repositories/prisma-users.repository.ts`

**Checkpoint**: Authenticated get-by-id works independently with stable error envelope.

---

## Phase 6: User Story 4 - Super-admin hard delete (Priority: P2)

**Goal**: Restrict `DELETE /v1/users/{userId}` to `SUPER_ADMIN` and execute physical deletion.

**Independent Test**: Delete with super admin token (204), non-admin token (403), and non-existing target (404).

### Tests for User Story 4 (MANDATORY)

- [X] T039 [P] [US4] Add unit tests for delete authorization and not-found behavior in `tests/unit/modules/v1/users/users.service.spec.ts`
- [X] T040 [P] [US4] Add integration contract tests for DELETE `204/403/404` in `tests/integration/modules/v1/users/users.contract.spec.ts`

### Implementation for User Story 4

- [X] T041 [P] [US4] Add DELETE response schemas (`204/401/403/404`) in `src/modules/v1/users/users.schemas.ts`
- [X] T042 [US4] Implement super-admin-only delete service rule in `src/modules/v1/users/users.service.ts`
- [X] T043 [US4] Implement DELETE controller method for `/v1/users/{userId}` in `src/modules/v1/users/users.controller.ts`
- [X] T044 [US4] Implement authenticated DELETE route `/v1/users/{userId}` in `src/modules/v1/users/users.routes.ts`
- [X] T045 [US4] Implement hard delete repository operation with not-found signaling in `src/modules/v1/users/repositories/prisma-users.repository.ts`

**Checkpoint**: Hard delete is independently releasable and protected by role authorization.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final contract alignment, documentation, and mandatory quality gates.

- [X] T046 [P] Align OpenAPI contract with implemented request/response/error payloads in `specs/002-secure-user-management/contracts/users-management.openapi.yaml`
- [X] T047 [P] Update execution and validation steps for final behavior in `specs/002-secure-user-management/quickstart.md`
- [X] T048 Validate route registration and docs exposure for updated endpoints in `src/routes/index.ts`
- [X] T049 Run typecheck gate and resolve findings in `src/modules/v1/auth/` and `src/modules/v1/users/`
- [X] T050 Run lint gate and resolve findings in `src/modules/v1/auth/`, `src/modules/v1/users/`, and `tests/`
- [ ] T051 Run unit/integration/coverage gates and resolve failures in `tests/unit/modules/v1/auth/`, `tests/unit/modules/v1/users/`, and `tests/integration/modules/v1/`
- [X] T052 Audit stable error envelope + traceId behavior in `src/lib/http/error-handler.ts` and `src/modules/v1/users/users.routes.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3-6 (User Stories)**: Depend on Phase 2 completion.
- **Phase 7 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on other stories.
- **US3 (P1)**: Starts after Phase 2; no runtime dependency on US1.
- **US2 (P2)**: Starts after Phase 2; can run independently from US1/US3.
- **US4 (P2)**: Starts after Phase 2; can run independently from US1/US2/US3.

### Dependency Graph

```text
Phase 1 -> Phase 2 -> [US1, US3, US2, US4] -> Phase 7
```

### Within Each User Story

- Tests first (unit + integration), then implementation.
- Maintain layer chain `routes -> controller -> service -> repository -> factory`.
- Keep Zod contracts complete for params/body/response and error mappings.
- Preserve stable error envelope with `traceId`.

---

## Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel.
- Foundational tasks marked `[P]` can run in parallel.
- After Phase 2, US1, US3, US2, and US4 can be staffed in parallel.
- Test tasks marked `[P]` can run in parallel with non-overlapping file edits.

---

## Parallel Example: User Story 1

```bash
Task T012: tests/unit/modules/v1/auth/auth.service.spec.ts
Task T013: tests/integration/modules/v1/auth/auth.contract.spec.ts
Task T015: src/modules/v1/auth/auth.types.ts
Task T016: src/modules/v1/auth/auth.schemas.ts
```

## Parallel Example: User Story 3

```bash
Task T023: tests/unit/modules/v1/users/users.service.spec.ts
Task T024: tests/integration/modules/v1/users/users.contract.spec.ts
Task T026: src/modules/v1/users/users.schemas.ts
Task T027: src/modules/v1/users/users.types.ts
```

## Parallel Example: User Story 2

```bash
Task T032: tests/unit/modules/v1/users/users.service.spec.ts
Task T033: tests/integration/modules/v1/users/users.contract.spec.ts
Task T034: src/modules/v1/users/users.schemas.ts
Task T038: src/modules/v1/users/repositories/prisma-users.repository.ts
```

## Parallel Example: User Story 4

```bash
Task T039: tests/unit/modules/v1/users/users.service.spec.ts
Task T040: tests/integration/modules/v1/users/users.contract.spec.ts
Task T041: src/modules/v1/users/users.schemas.ts
Task T045: src/modules/v1/users/repositories/prisma-users.repository.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3 (US1).
4. Validate with US1 unit + integration tests and gates.
5. Demo/deploy MVP.

### Incremental Delivery

1. Deliver US1 (register auto-auth).
2. Deliver US3 (authorized update).
3. Deliver US2 (authenticated get by id).
4. Deliver US4 (super-admin hard delete).
5. Finish with Phase 7 hardening and quality gates.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. After Phase 2:
   - Engineer A: US1 (auth module)
   - Engineer B: US3 (update authorization)
   - Engineer C: US2 + US4 (read/delete user routes)
3. Merge and validate all gates in Phase 7.
