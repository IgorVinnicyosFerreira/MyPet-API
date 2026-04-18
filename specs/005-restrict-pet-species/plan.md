# Implementation Plan: Restrict Pet Species

**Branch**: `005-restrict-pet-species` | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-restrict-pet-species/spec.md`

## Summary

Restringir o campo `species` na criacao de pets para um conjunto canonico (`Canine`, `Feline`) sem breaking change de `/v1`, mantendo a arquitetura em camadas atual (`routes -> controller -> service -> repository -> factory`) e reforcando a garantia de nao persistir valores invalidos. O plano inclui ajuste de contrato de entrada da rota, validacao de regra de dominio no service, documentacao de contrato e cobertura de testes unitarios/integracao para cenarios validos e invalidos.

## Technical Context

**Language/Version**: Node.js + TypeScript  
**Primary Dependencies**: Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL  
**Storage**: PostgreSQL (via Prisma ORM), tabela `Pets` existente (sem migration de coluna nesta feature)  
**Testing**: Unit tests para regras de service, integration tests para fluxo HTTP de criacao, gates de typecheck/lint/test/coverage  
**Target Platform**: Docker Compose (API backend)  
**Project Type**: REST API versionada (`/v1/...`)  
**Performance Goals**: p95 `<= 250ms` para `POST /v1/pets`, `50 req/s` sustentado com burst `100 req/s` por 5 minutos, taxa de falha infra `<1%`  
**Constraints**: Nao alterar colunas existentes nem criar migration; manter contrato de resposta de sucesso da rota; persistencia por whitelist campo-a-campo; manter simplicidade sem novas camadas  
**Scale/Scope**: Baseline atual do produto (`~10k MAU`, `~100k pets`), escopo limitado ao fluxo de criacao de pet em `/v1/pets`, sem backfill de dados historicos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Layered architecture is preserved with `routes -> controller -> service -> repository -> factory`.
- [x] Controller, service, and repository responsibilities are separated with no business-rule leakage.
- [x] Services depend on repository abstractions/interfaces, not concrete Prisma classes.
- [x] Simplicity is preserved: no new layer/pattern beyond existing module conventions.
- [x] API contracts define Zod schemas for route inputs/outputs used by the endpoint (`body` and relevant `response` statuses for this route).
- [x] Route design follows REST conventions: `POST /v1/pets`.
- [x] HTTP status codes are defined consistently (`201` success, validation error status per project handler mapping).
- [x] Breaking API changes are not introduced; `/v2` is not required for this feature.
- [x] Security impacts are covered: auth preserved in route, whitelist persistence mapping, and no sensitive data exposure.
- [x] Observability impacts are covered: stable error envelope with `error.code` and `traceId`, plus structured logs already in request lifecycle.
- [x] Test plan includes mandatory unit tests and required integration tests where behavior/contract changes.
- [x] Quality gates are planned: typecheck, lint, tests, and coverage target >= 80%.

**Gate status (pre-Phase 0)**: PASS  
**Re-check status (post-Phase 1 design)**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/005-restrict-pet-species/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- post-create-pet.md
`-- tasks.md             # Phase 2 (/speckit.tasks), nao gerado neste comando
```

### Source Code (repository root)

```text
src/modules/v1/pets/
|-- repositories/
|   |-- pets-interfaces.repository.ts
|   `-- prisma-pets.repository.ts
|-- pets.types.ts
|-- pets.schemas.ts
|-- pets.routes.ts
|-- pets.controller.ts
|-- pets.service.ts
`-- pets.factory.ts

tests/
|-- unit/modules/v1/pets/
|   `-- pets.service.spec.ts
`-- integration/modules/v1/pets/
    `-- pets.contract.spec.ts
```

**Structure Decision**: Implementar no modulo existente `src/modules/v1/pets`, ajustando apenas contratos e regra de criacao sem novas pastas/layers.

## Complexity Tracking

> Nenhuma violacao ao Constitution Check. Secao nao aplicavel.
