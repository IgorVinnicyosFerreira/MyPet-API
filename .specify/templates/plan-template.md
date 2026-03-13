# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: Node.js + TypeScript
**Primary Dependencies**: Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL
**Storage**: PostgreSQL (via Prisma ORM)
**Testing**: Unit tests for service/domain rules (mandatory), integration tests for repository and cross-layer flows, typecheck and lint gates
**Target Platform**: Docker Compose service running API backend
**Project Type**: Versioned REST API (`/v1/...`, `/v2/...` for breaking changes)
**Performance Goals**: [NEEDS CLARIFICATION: feature-specific latency/throughput targets]
**Constraints**: Keep architecture simple; avoid new layers/patterns without explicit justification
**Scale/Scope**: [NEEDS CLARIFICATION: expected usage and data volume]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] Layered architecture is preserved with `routes -> controller -> service -> repository -> factory`.
- [ ] Controller, service, and repository responsibilities are separated with no business-rule leakage.
- [ ] Services depend on repository abstractions/interfaces, not concrete Prisma classes.
- [ ] Simplicity is preserved: any additional layer/pattern has explicit problem statement and trade-off.
- [ ] API contracts define Zod schemas for `querystring`, `params`, `body`, and `response`.
- [ ] Route design follows REST conventions: `/v1/<plural-resource>`, resource-oriented paths, and method semantics (`GET/POST/PUT/PATCH/DELETE`).
- [ ] HTTP status codes and querystring usage (filter/pagination) are defined consistently with REST behavior.
- [ ] Breaking API changes include explicit `/v2` strategy and migration impact.
- [ ] Security impacts are covered: auth, rate limit, response sanitization, and whitelist persistence mapping.
- [ ] Observability impacts are covered: structured logs with `timestamp`, `level`, `message`, `traceId`, `context`.
- [ ] Test plan includes mandatory unit tests and required integration tests where persistence/contracts are touched.
- [ ] Quality gates are planned: typecheck, lint, tests, and coverage target >= 80%.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
├── routes/
├── modules/
│   └── v1/
│       └── [resource]/
│           ├── repositories/
│           │   ├── prisma-[resource].repository.ts
│           │   └── [resource]-interfaces.repository.ts
│           ├── [resource].schemas.ts
│           ├── [resource].routes.ts
│           ├── [resource].controller.ts
│           ├── [resource].service.ts
│           └── [resource].factory.ts
└── server.ts

tests/
├── unit/
└── integration/
```

**Structure Decision**: Keep feature modules under `src/modules/v1/...` and implement the full layer chain for every endpoint.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., extra layer beyond standard chain] | [current need] | [why default layering is insufficient] |
| [e.g., no `/v2` for contract change] | [specific reason] | [why migration/version split is not feasible] |
