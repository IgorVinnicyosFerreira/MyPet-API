# Implementation Plan: API de Historico e Cuidados de Pets

**Branch**: `001-gerenciar-historico-pets` | **Date**: 2026-03-12 | **Spec**: `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/spec.md`
**Input**: Feature specification from `/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/spec.md` + user constraints for TypeScript/Fastify/Prisma/Zod/PostgreSQL, Bun test runner, local `storage/` abstraction and `/docs` via Swagger + Scalar.

## Summary

Implement a versioned REST API under `/v1/...` for complete pet care history, medication routines, care sharing, digital wallet generation, and credential-based authentication.
The implementation keeps the mandatory chain `routes -> controller -> service -> repository -> factory`, introduces a storage provider abstraction with local disk implementation in `/storage`, and prepares easy replacement by S3-like storage without contract breaks.
API contracts remain typed with Zod and documented automatically at `/docs` using `@fastify/swagger` and `@scalar/fastify-api-reference`, with dosage/frequency defined at prescription level, hybrid medication catalog (global + tutor custom), retroactive dose handling without automatic schedule recalculation, JSON-only digital wallet output, and optimistic locking with `409 Conflict` for concurrent updates.

## Technical Context

**Language/Version**: Node.js + TypeScript (runtime), Bun 1.x (automated test runner)
**Primary Dependencies**: Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL, `@fastify/swagger`, `@scalar/fastify-api-reference`
**Storage**: PostgreSQL (via Prisma ORM) + local file storage in `/Volumes/SSD Externo/Projects/MyPet/storage` behind `StorageProvider` interface
**Testing**: Bun (`make test-coverage`) for unit and integration tests, plus typecheck/lint gates
**Target Platform**: Docker Compose service running API backend
**Project Type**: Versioned REST API (`/v1/...`, `/v2/...` for breaking changes)
**Performance Goals**: p95 <= 250ms for read endpoints (`GET` list/history), p95 <= 350ms for write endpoints (`POST/PATCH`) excluding upload transfer time, and agenda endpoint supporting up to 200 active prescriptions per pet per day
**Constraints**: Keep architecture simple, no extra layers without explicit gain, minimal external libraries, field-by-field persistence mapping, stable error schema with `traceId`, mandatory credential auth (email + password) for protected endpoints, role matrix enforcement (`CO_TUTOR` without delete, `CAREGIVER` limited to dose/notes), and optimistic locking for mutable clinical/prescription records
**Scale/Scope**: Initial target up to 10k active users/month, 100k pets, and up to 2M historical records with pagination-first reads

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Layered architecture is preserved with `routes -> controller -> service -> repository -> factory`.
- [x] Controller, service, and repository responsibilities are separated with no business-rule leakage.
- [x] Services depend on repository abstractions/interfaces, not concrete Prisma classes.
- [x] Simplicity is preserved: any additional layer/pattern has explicit problem statement and trade-off.
- [x] API contracts define Zod schemas for `querystring`, `params`, `body`, and `response`.
- [x] Route design follows REST conventions: `/v1/<plural-resource>`, resource-oriented paths, and method semantics (`GET/POST/PUT/PATCH/DELETE`).
- [x] HTTP status codes and querystring usage (filter/pagination) are defined consistently with REST behavior.
- [x] Breaking API changes include explicit `/v2` strategy and migration impact.
- [x] Security impacts are covered: auth, rate limit, response sanitization, and whitelist persistence mapping.
- [x] Observability impacts are covered: structured logs with `timestamp`, `level`, `message`, `traceId`, `context`.
- [x] Test plan includes mandatory unit tests and required integration tests where persistence/contracts are touched.
- [x] Quality gates are planned: typecheck, lint, tests, and coverage target >= 80%.

Gate evaluation (pre-Phase 0): PASS
Gate evaluation (post-Phase 1): PASS

## Project Structure

### Documentation (this feature)

```text
/Volumes/SSD Externo/Projects/MyPet/specs/001-gerenciar-historico-pets/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- pets-history.openapi.yaml
`-- tasks.md
```

### Source Code (repository root)

```text
/Volumes/SSD Externo/Projects/MyPet/src/
|-- lib/
|   `-- storage/
|       |-- storage-provider.ts
|       |-- local-storage.provider.ts
|       `-- storage.factory.ts
|-- routes/
|-- modules/
|   `-- v1/
|       |-- pets/
|       |-- medications/
|       |-- prescriptions/
|       |-- care-relations/
|       |-- auth/
|       |-- digital-wallets/
|       `-- files/
`-- server.ts

/Volumes/SSD Externo/Projects/MyPet/tests/
|-- unit/
`-- integration/
```

**Structure Decision**: Keep feature modules under `src/modules/v1/...` and implement the full layer chain for each resource; shared file storage logic stays in `src/lib/storage` with dependency injection by factories.

## Complexity Tracking

No constitution violations or exceptions identified in planning/design phases.
