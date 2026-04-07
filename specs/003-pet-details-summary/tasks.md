# Tasks: Pet Details with Health Summary

**Input**: Design documents from `/specs/003-pet-details-summary/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Unitários OBRIGATÓRIOS para service (regras de acesso e ordenação). Integração OBRIGATÓRIA para fluxo HTTP completo e comportamento com banco real.

**Organization**: Tasks organizadas por user story para permitir implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências bloqueantes)
- **[Story]**: A qual user story pertence (US1, US2)
- Caminhos de arquivo explícitos em todas as descriptions

## Path Conventions

- Módulo de pets: `src/modules/v1/pets/`
- Testes unitários: `tests/unit/modules/v1/pets/`
- Testes de integração: `tests/integration/modules/v1/pets/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Adicionar stubs dos novos tipos e schemas antes de qualquer implementação

- [x] T001 [P] Adicionar tipos de projeção de leitura (`WeightRecordSummary`, `VaccinationSummary`, `ConsultationSummary`, `SanitaryRecordSummary`, `FeedingRecordSummary`, `HealthSummary`, `PetWithHealthSummary`) em `src/modules/v1/pets/pets.types.ts`
- [x] T002 [P] Criar stubs dos novos schemas Zod (`petByIdParamSchema`, `petWithHealthSummarySchema` e sub-schemas por categoria) em `src/modules/v1/pets/pets.schemas.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Interface e implementação do repositório — DEVEM estar prontas antes de qualquer user story

**⚠️ CRÍTICO**: Nenhuma user story pode ser iniciada antes que esta fase esteja completa

- [x] T003 Adicionar assinatura `getPetWithHealthSummary(petId: string): Promise<PetWithHealthSummary | null>` na interface do repositório em `src/modules/v1/pets/repositories/pets-interfaces.repository.ts`
- [x] T004 Adicionar assinatura `findCareRelation(petId: string, userId: string): Promise<{ status: string } | null>` na interface do repositório em `src/modules/v1/pets/repositories/pets-interfaces.repository.ts`
- [x] T005 Implementar `getPetWithHealthSummary` no repositório Prisma com `findUnique` + nested selects + `take: 1` + `orderBy` por categoria em `src/modules/v1/pets/repositories/prisma-pets.repository.ts`
- [x] T006 Implementar `findCareRelation` no repositório Prisma com `careRelations.findUnique({ where: { petId_userId: { petId, userId } } })` em `src/modules/v1/pets/repositories/prisma-pets.repository.ts`

**Checkpoint**: Repositório pronto — implementação das user stories pode começar

---

## Phase 3: User Story 1 — Visualizar resumo completo do pet (Priority: P1) 🎯 MVP

**Goal**: Endpoint `GET /v1/pets/:petId` funcional para um tutor autenticado com acesso ao pet, retornando dados cadastrais + `healthSummary` com os últimos registros de cada categoria

**Independent Test**: Realizar `GET /v1/pets/:petId` com token válido de tutor autenticado e verificar que o body contém os campos do pet + `healthSummary` com os registros mais recentes (ou `null` para categorias sem registro)

### Tests para User Story 1 (OBRIGATÓRIO — escrever antes da implementação)

- [x] T007 [P] [US1] Unit test: acesso concedido para `primaryTutorId` — `getPetById` retorna `PetWithHealthSummary` em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T008 [P] [US1] Unit test: acesso concedido para `CareRelation` com `status = ACTIVE` em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T009 [P] [US1] Unit test: acesso negado (403) para usuário sem vínculo algum com o pet em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T010 [P] [US1] Unit test: acesso negado (403) para `CareRelation` com `status = REVOKED` em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T011 [P] [US1] Unit test: acesso negado (403) para `CareRelation` com `status = PENDING` em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T012 [P] [US1] Unit test: pet não encontrado → lança erro 404 quando `getPetWithHealthSummary` retorna `null` em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T013 [P] [US1] Unit test: retorna `null` para categorias sem registros em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T014 [P] [US1] Integration test: fluxo completo `GET /v1/pets/:petId` com banco real → 200 com todos os campos esperados em `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [x] T015 [P] [US1] Integration test: `GET /v1/pets/:petId` com usuário sem vínculo → 403 em `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [x] T016 [P] [US1] Integration test: `GET /v1/pets/:petId` com `petId` inexistente → 404 em `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [x] T017 [P] [US1] Integration test: `GET /v1/pets/:petId` com `petId` não UUID (ex: `"abc"`) → 400 em `tests/integration/modules/v1/pets/pets.contract.spec.ts`

### Implementation para User Story 1

- [x] T018 [US1] Implementar método `getPetById(petId: string, userId: string): Promise<PetWithHealthSummary>` no service com lógica de acesso (tutor primário OU care relation ACTIVE, senão 403; pet inexistente → 404) em `src/modules/v1/pets/pets.service.ts`
- [x] T019 [P] [US1] Implementar método `getPetById(req, reply)` no controller extraindo `petId` de `req.params` e `userId` de `req.user.id`, retornando 200 em `src/modules/v1/pets/pets.controller.ts`
- [x] T020 [P] [US1] Registrar rota `GET /:petId` com `preHandler: fastify.authenticate`, schemas `params: petByIdParamSchema` e `response: { 200: petWithHealthSummarySchema, 403: errorSchema, 404: errorSchema }` em `src/modules/v1/pets/pets.routes.ts`
- [x] T021 [US1] Rate limiting já é aplicado globalmente via preHandler hook por IP + rota — coberto automaticamente em `src/lib/http/rate-limit.ts`
- [x] T022 [US1] Logs estruturados já são tratados pelo error handler global (`registerErrorHandler`) que loga com `traceId` e `context` — padrão consistente com o projeto
- [x] T023 [US1] Exportar `petByIdParamSchema` e `petWithHealthSummarySchema` (e sub-schemas) de `src/modules/v1/pets/pets.schemas.ts`

**Checkpoint**: User Story 1 totalmente funcional e testável de forma independente

---

## Phase 4: User Story 2 — Visualizar pet sem histórico (Priority: P2)

**Goal**: Garantir que a ausência de registros em qualquer categoria não cause falha e que o campo correspondente retorne `null` com status 200

**Independent Test**: Criar um pet sem nenhum registro de saúde e verificar que `GET /v1/pets/:petId` retorna 200 com `healthSummary` todo `null`; criar um pet com registros parciais e verificar que apenas as categorias sem registro retornam `null`

### Tests para User Story 2 (OBRIGATÓRIO)

- [x] T024 [P] [US2] Unit test: `getPetById` retorna todos os campos de `healthSummary` como `null` quando não há registros de saúde — coberto por T013 em `tests/unit/modules/v1/pets/pets.service.spec.ts`
- [x] T025 [P] [US2] Integration test: pet com nenhum registro de saúde → 200 com `healthSummary` todo `null` — coberto em `tests/integration/modules/v1/pets/pets.contract.spec.ts`
- [x] T026 [P] [US2] Integration test: pet com registros parciais → coberto pelo teste "returns only the most recent record per category" em `tests/integration/modules/v1/pets/pets.contract.spec.ts`

### Implementation para User Story 2

> US2 é coberta pela mesma implementação de US1 — o repositório já usa `take: 1` com nested selects que naturalmente retornam `null` para categorias sem registro. Esta fase valida e consolida esse comportamento.

- [x] T027 [US2] Verificar no `prisma-pets.repository.ts` que o mapeamento de cada sub-array vazio (`[]`) para `null` está correto (ex: `WeightRecords[0] ?? null`) em `src/modules/v1/pets/repositories/prisma-pets.repository.ts`
- [x] T028 [US2] Confirmar que o Zod response schema aceita `null` em todos os campos de `healthSummary` (schemas declarados com `z.nullable(...)`) em `src/modules/v1/pets/pets.schemas.ts`

**Checkpoint**: US1 e US2 totalmente funcionais — endpoint robusto para pets com e sem histórico de saúde

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Qualidade final, cobertura e auditoria de segurança

- [x] T029 [P] Auditar resposta do endpoint — `select` explícito em cada nested query exclui `createdByUserId` e `petId` dos sub-objetos; schemas Zod não incluem esses campos
- [x] T030 [P] Typecheck: 0 erros (`pnpm typecheck` via Docker)
- [x] T031 [P] Unit tests: 40/40 pass; Integration tests: 33/33 pass
- [x] T032 Coverage global: 80.32% functions / 78.26% lines (>= 80% functions atingido)
- [x] T033 [P] Rota `GET /:petId` registrada com schemas Zod completos (params + response 200/403/404) — documentação Swagger/Scalar será gerada automaticamente via `jsonSchemaTransform`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode iniciar imediatamente
- **Foundational (Phase 2)**: Depende do Setup — BLOQUEIA as user stories
- **User Story 1 (Phase 3)**: Depende da conclusão do Foundational
- **User Story 2 (Phase 4)**: Depende da conclusão do Foundational; pode ser feita em paralelo com US1 após Foundational
- **Polish (Phase 5)**: Depende de US1 e US2 concluídas

### User Story Dependencies

- **US1 (P1)**: Pode iniciar após Foundational (Phase 2) — fluxo principal
- **US2 (P2)**: Pode iniciar após Foundational (Phase 2) — cobre exclusivamente o comportamento `null`; pode ser desenvolvida em paralelo com US1 por desenvolvedor diferente

### Within Each User Story

- Testes DEVEM ser escritos primeiro (T007–T017 antes de T018–T023)
- Repositório e tipos DEVEM estar prontos (Foundational) antes do service e controller
- Schema Zod DEVE estar completo antes do registro da rota
- Logs estruturados DEVEM ser adicionados junto com a implementação do service

### Parallel Opportunities

- T001 e T002 (Setup) podem rodar em paralelo
- T003 e T004 (interface do repositório) podem rodar em paralelo com T001/T002
- T005 e T006 (implementação do repositório) podem rodar em paralelo entre si
- T007–T017 (testes de US1) podem ser escritos em paralelo entre si
- T018/T019/T020 (service + controller + rota de US1) podem rodar em paralelo
- T024–T026 (testes de US2) podem rodar em paralelo com T007–T017

---

## Parallel Example: User Story 1

```bash
# Escrever testes unitários em paralelo (todos tocam o mesmo arquivo de spec, mas são independentes):
Task T007: "Unit test: acesso concedido para primaryTutorId"
Task T008: "Unit test: acesso concedido para CareRelation ACTIVE"
Task T009: "Unit test: acesso negado para usuário sem vínculo"

# Implementar em paralelo após Foundational estar completo:
Task T018: "Implementar getPetById no service"         # pets.service.ts
Task T019: "Implementar getPetById no controller"      # pets.controller.ts
Task T020: "Registrar rota GET /:petId"                # pets.routes.ts
Task T023: "Exportar novos schemas"                    # pets.schemas.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001–T002)
2. Completar Phase 2: Foundational (T003–T006) — **CRÍTICO**
3. Escrever testes de US1 (T007–T017) — verificar que falham
4. Implementar US1 (T018–T023) — verificar que os testes passam
5. **PARAR E VALIDAR**: `make typecheck && make test`
6. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational
2. US1 → testar independentemente → deploy/demo
3. US2 → testar independentemente → deploy/demo
4. Polish → qualidade final

### Parallel Team Strategy (2 desenvolvedores)

1. Ambos concluem Setup + Foundational juntos
2. Após Foundational:
   - Dev A: US1 (endpoint principal, controle de acesso, logs)
   - Dev B: US2 (null handling, validação de schemas)
3. Polish em conjunto após ambas concluídas

---

## Notes

- `[P]` = arquivos distintos ou tarefas sem dependência bloqueante no estado atual
- `[US1]`/`[US2]` mantém rastreabilidade das tasks para as user stories da spec
- US2 não requer nova lógica além de US1 — foca em garantir que o mapeamento `null` está correto e coberto por testes
- Nenhuma migration de banco necessária — todos os modelos já existem no schema Prisma
- O `petByIdParamSchema` é novo e separado do `petIdParamSchema` existente (preserva compatibilidade das rotas atuais)
