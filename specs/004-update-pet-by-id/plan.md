# Implementation Plan: Atualizacao de Dados de Pet por ID

**Branch**: `004-update-pet-by-id` | **Date**: 2026-04-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-update-pet-by-id/spec.md`

## Summary

Adicionar o endpoint `PATCH /v1/pets/:id` para atualizacao parcial de dados cadastrais do pet, com autenticacao obrigatoria, autorizacao por vinculo (`primaryTutorId` ou `CareRelation` ativa), whitelist estrita de campos permitidos e controle otimista por `updatedAt` para evitar lost updates (`409 Conflict`). O retorno sera a representacao atualizada do pet, mantendo contrato de erro padrao (`error.code`, `message`, `details`, `traceId`) e logs estruturados com contexto de atualizacao.

## Technical Context

**Language/Version**: Node.js + TypeScript  
**Primary Dependencies**: Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL  
**Storage**: PostgreSQL (via Prisma ORM), tabela `Pets` existente com `updatedAt` para token de concorrencia otimista  
**Testing**: Unit tests para regras do service; integration tests para fluxo HTTP/repositorio; gates de typecheck, lint e testes  
**Target Platform**: Docker Compose (API backend)  
**Project Type**: REST API versionada (`/v1/...`)  
**Performance Goals**: `p95 <= 250ms`; `50 req/s` sustentado com burst `100 req/s` por 5 min; taxa de falha infra `<1%` no teste de carga  
**Constraints**: Sem novas camadas; sem migration para adicionar `version` em `Pets`; usar `updatedAt` como precondicao de update; persistencia por whitelist campo-a-campo; payload com campos permitidos apenas  
**Scale/Scope**: Uso padrao mobile/web (baseline do projeto: ate ~10k MAU / ~100k pets), escopo de atualizacao de um unico pet por requisicao, sem bulk update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Layered architecture is preserved with `routes -> controller -> service -> repository -> factory`.
- [x] Controller, service, and repository responsibilities are separated with no business-rule leakage.
- [x] Services depend on repository abstractions/interfaces, not concrete Prisma classes.
- [x] Simplicity is preserved: no extra layer/pattern beyond current module conventions.
- [x] API contracts define Zod schemas for `params`, `body` and `response` (no `querystring` for this route).
- [x] Route design follows REST conventions: `PATCH /v1/pets/:id` (resource-oriented, plural collection).
- [x] HTTP statuses are consistent (`200/400/403/404/409`) and semantics are explicit in contract.
- [x] Breaking API changes are not introduced; `/v2` is not required for this feature.
- [x] Security impacts are covered: JWT auth, permission check by pet relation, whitelist update mapping, no sensitive data exposure.
- [x] Observability impacts are covered: structured logs with `timestamp`, `level`, `message`, `traceId`, `context`.
- [x] Test plan includes unit tests (service) and integration tests (HTTP + persistence flow).
- [x] Quality gates are planned: typecheck, lint, tests and coverage >= 80%.

**Gate status (pre-Phase 0)**: PASS  
**Re-check status (post-Phase 1 design)**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/004-update-pet-by-id/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── patch-update-pet-by-id.md
└── tasks.md             # Phase 2 (/speckit.tasks), nao gerado neste comando
```

### Source Code (repository root)

```text
src/modules/v1/pets/
├── repositories/
│   ├── pets-interfaces.repository.ts
│   └── prisma-pets.repository.ts
├── pets.types.ts
├── pets.schemas.ts
├── pets.routes.ts
├── pets.controller.ts
├── pets.service.ts
└── pets.factory.ts

tests/
├── unit/modules/v1/pets/
│   └── pets.service.spec.ts
└── integration/modules/v1/pets/
    └── pets.contract.spec.ts
```

**Structure Decision**: Implementar a feature no modulo existente `src/modules/v1/pets` reaproveitando cadeia completa obrigatoria sem criar novas pastas/layers.

## Complexity Tracking

> Nenhuma violacao ao Constitution Check. Secao nao aplicavel.
