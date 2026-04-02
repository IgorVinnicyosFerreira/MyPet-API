# Implementation Plan: Gestao Segura de Usuarios

**Branch**: `002-secure-user-management` | **Date**: 2026-04-01 | **Spec**: `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/spec.md`
**Input**: Feature specification from `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/spec.md` + repository constraints from constitution and AGENTS.md.

## Summary

Implement secure user-management flows in `/v1` by adding authenticated `GET /v1/users/{userId}`, authorized `PATCH /v1/users/{userId}` (self or super admin), and super-admin-only `DELETE /v1/users/{userId}` with hard delete.
Also evolve `POST /v1/auth/register` to keep existing user fields and add immediate authentication token in the same response, preserving backward compatibility for current `/v1` consumers.
Implementation keeps the mandatory chain `routes -> controller -> service -> repository -> factory`, stable error envelope with `traceId`, field whitelist persistence, and sensitive-data sanitization.

## Technical Context

**Language/Version**: Node.js + TypeScript (runtime), Bun 1.x (automated test runner)
**Primary Dependencies**: Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL, custom JWT middleware (`src/lib/auth/jwt.ts`)
**Storage**: PostgreSQL (via Prisma ORM)
**Testing**: Unit tests for service/domain authorization rules, integration tests for auth/register and protected user routes, plus `make typecheck`, lint, and test coverage gates
**Target Platform**: Docker Compose service running API backend
**Project Type**: Versioned REST API (`/v1/...`, `/v2/...` for breaking changes)
**Performance Goals**: p95 <= 150ms for `GET /v1/users/{userId}`, p95 <= 250ms for `PATCH` and `DELETE`, p95 <= 300ms for `POST /v1/auth/register` with token issuance; sustained 50 req/s with bursts to 100 req/s for 5 minutes and <1% infra error rate
**Constraints**: Preserve architecture layering, no direct persistence of raw `req.body`, hard delete only for super admin endpoint, stable error payload `{ error: { code, message, details, traceId } }`, and no sensitive fields in responses
**Scale/Scope**: Plan for up to 100k users, 10k MAU, ~200 concurrent authenticated sessions, and ~2k user-management requests/day; feature scope limited to register auto-auth + user get/update/delete by id

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
/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- users-management.openapi.yaml
`-- tasks.md
```

### Source Code (repository root)

```text
/Volumes/SSD Externo/Projects/MyPet/src/
|-- lib/
|   |-- auth/
|   |-- http/
|   `-- logger.ts
|-- routes/
|-- modules/
|   `-- v1/
|       |-- auth/
|       `-- users/
`-- server.ts

/Volumes/SSD Externo/Projects/MyPet/tests/
|-- unit/
`-- integration/
```

**Structure Decision**: Keep changes isolated to existing `auth` and `users` modules, preserving current folder conventions and dependency-injection factories.

## Complexity Tracking

No constitution violations or exception paths identified during planning/design.
