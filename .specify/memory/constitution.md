<!--
Sync Impact Report
Version change: 1.0.0 -> 1.1.0
Modified principles:
- V. Mandatory Automated Quality -> VI. Mandatory Automated Quality (renumbered)
Added principles:
- V. REST Route Design and Resource Semantics
Added sections:
- None
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ⚠ .specify/templates/commands/*.md (directory does not exist in this repository)
Follow-up TODOs:
- None
-->

# MyPet Constitution

## Core Principles

### I. Clean Code and Explicit Intent (NON-NEGOTIABLE)
All production code MUST be written for readability first: meaningful names,
small cohesive units, and explicit control flow. Any change MUST remove dead code,
opaque comments, and avoid hidden side effects. Duplication that carries the same
business intent MUST be consolidated to keep maintenance predictable.

Rationale: readable code reduces regressions, lowers onboarding cost, and keeps
feature delivery safe as the codebase grows.

### II. Layered Architecture with SOLID Boundaries
Every feature MUST follow `routes -> controller -> service -> repository -> factory`.
Controllers MUST orchestrate HTTP only, services MUST contain business rules,
repositories MUST contain persistence concerns only, and factories MUST compose
dependencies. Services MUST depend on repository abstractions (interfaces), not on
Prisma implementations directly.

Rationale: clear boundaries enforce single responsibility and allow safe extension
without changing stable behavior.

### III. DDD Pragmatism with Simplicity First
DDD concepts MUST be applied only when they clarify domain invariants,
ubiquitous language, or business rules. New layers, patterns, or folders MUST NOT
be introduced without explicit value to the current feature. Large structural
refactors done only for stylistic "pure DDD" goals are prohibited.

Rationale: domain modeling should improve correctness, not add ceremony.
Simplicity preserves development speed and long-term maintainability.

### IV. Typed Contracts and Backward-Compatible APIs
All REST routes under `/v1/...` MUST define Zod schemas for `querystring`,
`params`, `body`, and `response` (all relevant statuses). Any breaking contract
change (response keys, payload structure, or semantic change that invalidates
consumers) MUST be released in `/v2/...`.

Rationale: explicit contracts keep integrations stable, documentation reliable,
and changes auditable.

### V. REST Route Design and Resource Semantics
Routes MUST be resource-oriented, versioned, and predictable: use `/v1/<plural-resource>`
paths, plural nouns, and HTTP verbs to express intent. Endpoints MUST avoid
verb-oriented paths (e.g., `/createPet`) unless a non-resource action is justified
documentally in the spec/plan. Method semantics MUST be preserved (`GET` read-only,
`POST` creation, `PUT/PATCH` update, `DELETE` removal) with coherent status codes
(`200/201/204/400/404/409/422`, etc.) and consistent pagination/filtering through
querystring where applicable.

Rationale: strict REST conventions reduce ambiguity, improve client integration,
and make API evolution safer.

### VI. Mandatory Automated Quality
Every change that introduces or modifies business rules MUST include or update unit
tests for service/domain behavior. Integration tests MUST cover repository behavior
and cross-layer flows when persistence contracts are affected. Delivery is accepted
only when typecheck, lint, and tests pass, with a minimum 80% coverage target
(global or for the changed module, as defined by pipeline).

Rationale: automated tests and quality gates are the minimum control set to prevent
regressions in API and domain logic.

## Operational and Security Constraints

- Protected routes MUST enforce authentication and authorization checks.
- Sensitive or public endpoints MUST apply rate limiting.
- Persistence objects MUST be built field-by-field (whitelist); direct persistence of
  raw `req.body` is forbidden.
- Responses MUST NOT expose sensitive data such as passwords, tokens, or secrets.
- Errors MUST return stable machine-readable `error.code` and include `traceId`.
- Production responses MUST NOT leak stack traces.
- New flows MUST emit structured logs with `timestamp`, `level`, `message`,
  `traceId` (or requestId), and `context`.

## Development Workflow and Delivery Standards

- Official workflow commands MUST prioritize the `Makefile` (`make up`,
  `make docker-dev`, `make logs`, `make migrate`, `make prisma-generate`, `make test`, `make test-coverage`
  `make typecheck` when available).
- When `make typecheck` is unavailable, `pnpm typecheck` MUST be used.
- Migrations MUST use explicit descriptive names.
- Commits MUST follow Conventional Commits.
- Pull requests MUST state objective, API contract impact, test strategy,
  and risks/rollback when applicable.
- Any request to install dependencies, change existing database columns, or modify
  route contracts MUST receive explicit approval before implementation.
- `AGENTS.md` MUST be treated as an operational companion guide; if a conflict
  exists, this constitution prevails and `AGENTS.md` MUST be aligned in the same PR.

## Governance

This constitution is the highest engineering policy for MyPet.

Amendment procedure:
- Amendments MUST be submitted via pull request with explicit rationale,
  impacted principles/sections, and template/runtime document sync updates.
- Amendments MUST include a Sync Impact Report in `.specify/memory/constitution.md`.
- At least one maintainer approval is required before merge.

Versioning policy (Semantic Versioning):
- MAJOR: backward-incompatible governance changes or principle removals/redefinitions.
- MINOR: new principle/section or materially expanded mandatory guidance.
- PATCH: clarifications, wording improvements, typo fixes, non-semantic refinements.

Compliance review expectations:
- Every implementation plan MUST pass the Constitution Check before research/design.
- Every tasks file MUST include explicit tasks for architecture compliance,
  REST route compliance, mandatory unit tests, and quality gates.
- Code review MUST block merges that violate non-negotiable principles unless a
  documented exception is approved and time-boxed.

**Version**: 1.1.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-11
