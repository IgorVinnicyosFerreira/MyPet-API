---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit tests are MANDATORY for every user story that adds or changes business rules. Integration tests are REQUIRED when repository behavior, persistence contracts, or cross-layer flows are affected.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **API project**: `src/`, `tests/` at repository root
- **Feature modules**: `src/modules/v1/<resource>/`
- **Tests**: `tests/unit/` and `tests/integration/`

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Constitution alignment requirements from spec.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline quality tooling

- [ ] T001 Create feature folders in `src/modules/v1/[resource]/` following layer chain
- [ ] T002 Create test folders and base setup in `tests/unit/` and `tests/integration/`
- [ ] T003 [P] Configure/validate lint and typecheck execution
- [ ] T004 [P] Define contract and schema file stubs (`[resource].schemas.ts`, `[resource].types.ts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement route wiring and versioned registration in `src/routes/index.ts`
- [ ] T006 [P] Define repository interface in `src/modules/v1/[resource]/repositories/[resource]-interfaces.repository.ts`
- [ ] T007 [P] Implement Prisma repository in `src/modules/v1/[resource]/repositories/prisma-[resource].repository.ts`
- [ ] T008 Implement dependency factory in `src/modules/v1/[resource]/[resource].factory.ts`
- [ ] T009 Configure error and logging baseline with `traceId` propagation
- [ ] T010 Confirm REST route conventions (`/v1/<plural-resource>`, method semantics) and auth/rate-limit strategy for protected or sensitive endpoints

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (MANDATORY)

> **NOTE: Write tests first, ensure they fail, then implement**

- [ ] T011 [P] [US1] Unit test for service rules in `tests/unit/modules/v1/[resource]/[resource].service.spec.ts`
- [ ] T012 [P] [US1] Contract/schema test for endpoint in `tests/integration/modules/v1/[resource]/[resource].contract.spec.ts`
- [ ] T013 [US1] [If persistence changes] Integration test for repository flow in `tests/integration/modules/v1/[resource]/[resource].repository.spec.ts`

### Implementation for User Story 1

- [ ] T014 [P] [US1] Implement route in `src/modules/v1/[resource]/[resource].routes.ts` with REST-compliant paths and HTTP methods
- [ ] T015 [P] [US1] Implement controller in `src/modules/v1/[resource]/[resource].controller.ts`
- [ ] T016 [US1] Implement service in `src/modules/v1/[resource]/[resource].service.ts`
- [ ] T017 [US1] Implement or update repository methods in `src/modules/v1/[resource]/repositories/`
- [ ] T018 [US1] Implement/adjust factory wiring in `src/modules/v1/[resource]/[resource].factory.ts`
- [ ] T019 [US1] Add Zod schemas for `querystring`, `params`, `body`, `response` in `[resource].schemas.ts`
- [ ] T020 [US1] Add structured logging and stable error mapping (`error.code`, `traceId`)

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (MANDATORY)

- [ ] T021 [P] [US2] Unit test for service/domain behavior in `tests/unit/modules/v1/[resource]/[resource].service.spec.ts`
- [ ] T022 [P] [US2] Contract/schema test in `tests/integration/modules/v1/[resource]/[resource].contract.spec.ts`
- [ ] T023 [US2] [If persistence changes] Integration test in `tests/integration/modules/v1/[resource]/[resource].repository.spec.ts`

### Implementation for User Story 2

- [ ] T024 [P] [US2] Implement route/controller/service changes for story scope with REST-compliant paths and HTTP methods
- [ ] T025 [US2] Update repository/factory wiring as needed
- [ ] T026 [US2] Ensure backward compatibility with `/v1` or define `/v2` migration plan

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (MANDATORY)

- [ ] T027 [P] [US3] Unit test for service/domain behavior in `tests/unit/modules/v1/[resource]/[resource].service.spec.ts`
- [ ] T028 [P] [US3] Contract/schema test in `tests/integration/modules/v1/[resource]/[resource].contract.spec.ts`
- [ ] T029 [US3] [If persistence changes] Integration test in `tests/integration/modules/v1/[resource]/[resource].repository.spec.ts`

### Implementation for User Story 3

- [ ] T030 [P] [US3] Implement route/controller/service changes for story scope with REST-compliant paths and HTTP methods
- [ ] T031 [US3] Update repository/factory wiring as needed
- [ ] T032 [US3] Validate security and observability requirements for this story

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Cleanup and simplification refactors with no behavior change
- [ ] TXXX [P] Expand unit/integration coverage to meet >=80% target
- [ ] TXXX Security hardening and sensitive data response audit
- [ ] TXXX Execute full quality gates (typecheck, lint, tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2); may integrate with US1 while remaining independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2); may integrate with US1/US2 while remaining independently testable

### Within Each User Story

- Tests MUST be written first and MUST fail before implementation
- Routes, controllers, services, repositories, and factories MUST preserve layer responsibilities
- Routes MUST follow REST conventions: versioned base path, plural resources, and coherent method semantics
- Zod route contracts MUST be complete before story sign-off
- Story implementation MUST pass unit tests, required integration tests, lint, and typecheck

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel
- Foundational tasks marked `[P]` can run in parallel
- After Foundational completion, user stories can progress in parallel when staffing allows
- Test tasks marked `[P]` can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch mandatory tests for User Story 1 together:
Task: "Unit test for service rules in tests/unit/modules/v1/[resource]/[resource].service.spec.ts"
Task: "Contract/schema test in tests/integration/modules/v1/[resource]/[resource].contract.spec.ts"

# Launch implementation tasks that touch separate files:
Task: "Implement route in src/modules/v1/[resource]/[resource].routes.ts"
Task: "Implement controller in src/modules/v1/[resource]/[resource].controller.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run mandatory tests and quality gates for User Story 1
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 -> Test independently -> Deploy/Demo
3. Add User Story 2 -> Test independently -> Deploy/Demo
4. Add User Story 3 -> Test independently -> Deploy/Demo
5. Keep each increment backward-compatible or versioned

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- `[P]` tasks mean different files and no blocking dependency
- `[Story]` labels maintain traceability from tasks to spec user stories
- Avoid vague tasks or cross-story coupling that prevents independent delivery
