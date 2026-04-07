# Implementation Plan: Pet Details with Health Summary

**Branch**: `003-pet-details-summary` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-pet-details-summary/spec.md`

## Summary

Expor o endpoint `GET /v1/pets/:petId` que retorna os dados cadastrais completos do pet junto com o último registro de cada categoria de saúde (peso, vacinação, consulta, vermifugo, parasitário e dieta) aninhados sob `healthSummary`. O acesso é restrito ao tutor primário ou a usuários com `CareRelation` com status `ACTIVE`; nenhuma migration é necessária pois todos os modelos já existem no schema Prisma.

## Technical Context

**Language/Version**: Node.js + TypeScript
**Primary Dependencies**: Fastify, Zod v4-mini (`fastify-type-provider-zod`), Prisma, PostgreSQL
**Storage**: PostgreSQL (via Prisma ORM) — modelos `Pets`, `WeightRecords`, `Vaccinations`, `Consultations`, `SanitaryRecords`, `FeedingRecords`, `CareRelations` já existem
**Testing**: Bun test framework; unit para service/regras de domínio; integração para repositório e fluxo HTTP
**Target Platform**: Docker Compose service — API backend
**Project Type**: Versioned REST API (`/v1/...`)
**Performance Goals**: p95 < 300ms (definido em clarifications da spec)
**Constraints**: Sem novas migrations; sem novos layers; seguir o módulo `src/modules/v1/pets/` existente
**Scale/Scope**: Uso normal de app mobile/web; consulta single-query via Prisma `findUnique` com nested selects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Layered architecture is preserved with `routes -> controller -> service -> repository -> factory`.
- [x] Controller, service, and repository responsibilities are separated with no business-rule leakage.
- [x] Services depend on repository abstractions/interfaces, not concrete Prisma classes.
- [x] Simplicity is preserved: any additional layer/pattern has explicit problem statement and trade-off.
- [x] API contracts define Zod schemas for `params` e `response` (sem `querystring` nem `body` para este GET).
- [x] Route design follows REST conventions: `GET /v1/pets/:petId`, noun plural, read-only semantics.
- [x] HTTP status codes: 200 sucesso, 400 param inválido, 403 acesso negado, 404 não encontrado.
- [x] Breaking API changes: não aplicável — novo endpoint sem breaking change.
- [x] Security impacts: auth JWT obrigatório, verificação de ownership/care relation, sem campos sensíveis na resposta, rate limit por rota.
- [x] Observability impacts: logs estruturados com `timestamp`, `level`, `message`, `traceId`, `context: "pets.getById"`.
- [x] Test plan: unitários para service (7 cenários) + integração (5 cenários) — ver CA-007/CA-008 na spec.
- [x] Quality gates: typecheck, lint, tests, cobertura >= 80%.

**Resultado**: todos os gates aprovados. Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/003-pet-details-summary/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── get-pet-by-id.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NÃO criado por /speckit.plan)
```

### Source Code (repository root)

```text
src/modules/v1/pets/
├── repositories/
│   ├── pets-interfaces.repository.ts   ← adicionar IPetsRepository.getPetWithHealthSummary
│   └── prisma-pets.repository.ts       ← implementar getPetWithHealthSummary
├── pets.schemas.ts                     ← adicionar petByIdParamSchema + petWithHealthSummarySchema
├── pets.routes.ts                      ← registrar GET /:petId
├── pets.controller.ts                  ← adicionar getPetById
├── pets.service.ts                     ← adicionar getPetById com verificação de acesso
└── pets.factory.ts                     ← sem alteração (singleton já compõe tudo)

tests/
├── unit/modules/v1/pets/
│   └── pets.service.spec.ts            ← adicionar 7 cenários unitários
└── integration/modules/v1/pets/
    └── pets.contract.spec.ts           ← adicionar 5 cenários de integração
```

## Complexity Tracking

> Nenhuma violação ao Constitution Check. Seção não aplicável.
