# Tasks: Restrict Pet Species

**Input**: Design documents from `/Volumes/SSD Externo/Projects/MyPet/specs/005-restrict-pet-species/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/post-create-pet.md`, `quickstart.md`

**Tests**: Unit tests are mandatory for service/domain rules and integration tests are required for `POST /v1/pets` contract and persistence behavior impacted by species restriction.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared anchors for implementation and validation of species restriction.

- [X] T001 Add canonical create-pet payload fixtures for valid/invalid species in `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [X] T002 Add create-pet species unit test fixture helpers in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T003 [P] Align create-pet contract examples with canonical species values in `specs/005-restrict-pet-species/contracts/post-create-pet.md`
- [X] T004 [P] Align quickstart smoke scenarios for accepted/rejected species in `specs/005-restrict-pet-species/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish reusable domain and schema primitives required before story implementation.

**CRITICAL**: Complete this phase before implementing user story-specific behavior.

- [X] T005 Define canonical species domain type/constant for create flow in `src/modules/v1/pets/pets.types.ts`
- [X] T006 [P] Export reusable species enum schema for create payload in `src/modules/v1/pets/pets.schemas.ts`
- [X] T007 [P] Add service-level species guard helper for create flow in `src/modules/v1/pets/pets.service.ts`
- [X] T008 Wire create route schema to canonical species enum source in `src/modules/v1/pets/pets.routes.ts`
- [X] T009 Confirm repository create mapping remains explicit whitelist persistence in `src/modules/v1/pets/repositories/prisma-pets.repository.ts`

**Checkpoint**: Foundation complete, user stories can now be implemented independently.

---

## Phase 3: User Story 1 - Cadastrar pet com especie permitida (Priority: P1) MVP

**Goal**: Garantir que especies permitidas (`Canine`, `Feline`) sejam aceitas no cadastro de pet.

**Independent Test**: Enviar `POST /v1/pets` com payload valido e `species` igual a `Canine` e `Feline`, validando `201` e persistencia correta.

### Tests for User Story 1 (MANDATORY)

- [X] T010 [P] [US1] Add unit tests for accepted canonical species (`Canine`, `Feline`) in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T011 [P] [US1] Add integration tests for `POST /v1/pets` success with canonical species in `tests/integration/modules/v1/pets/pets.contract.spec.ts`

### Implementation for User Story 1

- [X] T012 [US1] Restrict `petCreateBodySchema.species` to canonical enum in `src/modules/v1/pets/pets.schemas.ts`
- [X] T013 [US1] Update create input typing to canonical species union in `src/modules/v1/pets/pets.types.ts`
- [X] T014 [US1] Apply canonical species guard in `createPet` service flow in `src/modules/v1/pets/pets.service.ts`
- [X] T015 [US1] Ensure `POST /v1/pets` route contract exposes enum values in docs metadata in `src/modules/v1/pets/pets.routes.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Bloquear especie nao permitida (Priority: P1)

**Goal**: Bloquear cadastro com especie fora da lista permitida e impedir persistencia de dados invalidos.

**Independent Test**: Enviar `POST /v1/pets` com `species` invalida (`Bird`, `canine`, vazio, `null`) e validar erro de requisicao com ausencia de novo registro persistido.

### Tests for User Story 2 (MANDATORY)

- [X] T016 [P] [US2] Add unit tests for invalid species rejection and repository non-invocation in `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [X] T017 [P] [US2] Add integration tests for invalid species payloads and non-persistence checks in `tests/integration/modules/v1/pets/pets.contract.spec.ts`

### Implementation for User Story 2

- [X] T018 [US2] Enforce BAD_REQUEST mapping for invalid species in create service rule in `src/modules/v1/pets/pets.service.ts`
- [X] T019 [US2] Tighten create schema against empty/null/non-canonical variants in `src/modules/v1/pets/pets.schemas.ts`
- [X] T020 [US2] Ensure create route error response contract for validation failures in `src/modules/v1/pets/pets.routes.ts`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Consumidor entender valores aceitos (Priority: P2)

**Goal**: Tornar explicito no contrato/documentacao da API que apenas `Canine` e `Feline` sao aceitos.

**Independent Test**: Consultar documentacao/contrato da criacao de pets e confirmar exibicao explicita dos valores permitidos para `species`.

### Tests for User Story 3 (MANDATORY)

- [X] T021 [P] [US3] Add integration assertion that create-pet schema advertises `species` enum values in API contract output in `tests/integration/modules/v1/pets/pets.contract.spec.ts`

### Implementation for User Story 3

- [X] T022 [US3] Update API contract documentation for create-pet species enum in `specs/005-restrict-pet-species/contracts/post-create-pet.md`
- [X] T023 [US3] Update quickstart documentation with canonical species acceptance/rejection evidence in `specs/005-restrict-pet-species/quickstart.md`
- [X] T024 [US3] Ensure route/schema documentation metadata remains aligned with contract docs in `src/modules/v1/pets/pets.routes.ts`

**Checkpoint**: All user stories are independently deliverable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, regressions, and quality gates across all stories.

- [X] T025 [P] Add edge-case integration coverage for mixed-invalid payloads in `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [X] T026 [P] Review and normalize canonical terminology (`Canine`, `Feline`) in `src/modules/v1/pets/pets.schemas.ts`
- [X] T027 Execute quality gates from `/Volumes/SSD Externo/Projects/MyPet` and record outputs in `specs/005-restrict-pet-species/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed independently from US1 once foundational tasks are complete.
- **Phase 5 (US3)**: Depends on Phase 2 and artifacts produced by US1/US2 contract updates.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational completion.
- **US2 (P1)**: Starts after Foundational completion.
- **US3 (P2)**: Starts after US1 contract/schema baseline is available.

### Within Each User Story

- Write tests first and confirm they fail before implementation.
- Preserve architecture chain: `routes -> controller -> service -> repository -> factory`.
- Keep route contracts explicit with Zod schemas.
- Preserve stable error envelope and traceability requirements.

---

## Parallel Opportunities

- Setup: T003 and T004.
- Foundational: T006 and T007.
- US1: T010 and T011 in parallel.
- US2: T016 and T017 in parallel.
- US3: T021 can run while T022/T023 are prepared.
- Polish: T025 and T026.

---

## Parallel Example: User Story 1

```bash
# Parallel tests
Task T010: tests/unit/modules/v1/pets/pets.service.spec.ts
Task T011: tests/integration/modules/v1/pets/pets.contract.spec.ts

# Parallel implementation on separate files
Task T012: src/modules/v1/pets/pets.schemas.ts
Task T013: src/modules/v1/pets/pets.types.ts
```

## Parallel Example: User Story 2

```bash
# Parallel tests
Task T016: tests/unit/modules/v1/pets/pets.service.spec.ts
Task T017: tests/integration/modules/v1/pets/pets.contract.spec.ts

# Parallel hardening after tests fail
Task T018: src/modules/v1/pets/pets.service.ts
Task T020: src/modules/v1/pets/pets.routes.ts
```

## Parallel Example: User Story 3

```bash
# Parallel consumer-facing documentation updates
Task T022: specs/005-restrict-pet-species/contracts/post-create-pet.md
Task T023: specs/005-restrict-pet-species/quickstart.md

# Contract verification remains separate
Task T021: tests/integration/modules/v1/pets/pets.contract.spec.ts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3 (US1).
4. Validate US1 independently via T010/T011 and quality checks.

### Incremental Delivery

1. Deliver US1 (accepted species flow).
2. Deliver US2 (invalid species blocking + non-persistence).
3. Deliver US3 (consumer-facing contract clarity).
4. Execute polish and full quality gates.

### Suggested MVP Scope

- **MVP**: Phase 1 + Phase 2 + Phase 3 (US1).

---

## Notes

- `[P]` marks tasks that can run in parallel on independent files.
- `[USx]` labels map each task to its user story for traceability.
- Every task includes an explicit file path for direct execution.

## T027 Quality Gate Evidence

Executed from `/Volumes/SSD Externo/Projects/MyPet` on 2026-04-17 (America/Recife):

- `make typecheck` -> PASS (`tsc --noEmit --skipLibCheck`)
- `pnpm lint` -> PASS (`biome check .`)
- `make test` -> PASS (47 unit tests, 0 failures)
- `make test-integration` -> PASS (44 integration tests, 0 failures)
- `make test-coverage` -> PASS (global coverage: 80.19% lines, 82.04% funcs)
