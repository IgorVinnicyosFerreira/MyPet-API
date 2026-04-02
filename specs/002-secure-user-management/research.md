# Phase 0 Research - 002-secure-user-management

## Scope

This document resolves all `NEEDS CLARIFICATION` items from the implementation plan and captures dependency/integration decisions for secure user management.

## 1) API latency and throughput targets

- Decision: Adopt p95 <= 150ms for `GET /v1/users/{userId}`, p95 <= 250ms for `PATCH` and `DELETE` on `/v1/users/{userId}`, and p95 <= 300ms for `POST /v1/auth/register` including token issuance. Throughput target is 50 req/s sustained with bursts to 100 req/s for 5 minutes.
- Rationale: Endpoints are single-record operations on Fastify + Prisma + PostgreSQL and should be faster than broader history workflows from feature 001 while still leaving headroom for password hashing and JWT signing.
- Alternatives considered: Reuse 250/350ms from feature 001 (rejected as too loose); no explicit targets (rejected because success criteria would be unverifiable).

## 2) Initial scale and scope assumptions

- Decision: Plan for up to 100k registered users, 10k MAU, around 200 concurrent authenticated sessions, and ~2k user-management requests/day.
- Rationale: This supports realistic early growth without overengineering (no caching/sharding requirement in this feature), while maintaining safe authorization and unique email constraints.
- Alternatives considered: Enterprise-scale day-one assumptions (rejected due to complexity); very small assumptions (<5k users) (rejected due to under-preparation).

## 3) Super admin identification source

- Decision: Use JWT claim `role` with value `SUPER_ADMIN` as the authorization source for privileged operations, with service checks using `request.user` from authentication middleware.
- Rationale: `JwtPayload` already supports `role` in the current codebase (`src/lib/auth/jwt.ts`) and avoids mandatory schema changes in `Users` during this feature planning cycle.
- Alternatives considered: Add `role` column in `Users` now (rejected in this planning slice to avoid column-change dependency); hard-coded admin checks in controllers (rejected due to leakage of business rules).

## 4) Authorization policy for user endpoints

- Decision: Keep `GET /v1/users/{userId}` authenticated and sanitized; allow update only when actor is target user or super admin; allow delete only for super admin.
- Rationale: Matches FR-001..FR-010 and enforces business rules in service layer with explicit policy functions and deny-by-default behavior.
- Alternatives considered: Allow any authenticated user to update others (rejected for security); soft delete (rejected because FR-015 requires hard delete).

## 5) Whitelist strategy for user updates

- Decision: Restrict update payload to explicit whitelist (`name`, `email`), reject empty payload, and reject/ignore non-whitelisted fields by schema+service validation.
- Rationale: Prevents mass-assignment and direct persistence of sensitive fields such as `passwordHash` or privileged attributes.
- Alternatives considered: Persist any provided field from body (rejected by constitution and AGENTS security rules).

## 6) Register auto-auth contract evolution

- Decision: Keep `POST /v1/auth/register` on `/v1` with `201`, preserving existing response fields (`id`, `name`, `email`, `createdAt`, `updatedAt`) and adding `token` plus `expiresIn` in the same top-level object.
- Rationale: Additive response change keeps backward compatibility (FR-012) while satisfying immediate-access requirement (FR-011).
- Alternatives considered: Require separate login after register (rejected by FR-011); create `/v2` (rejected because change is additive, not breaking).

## 7) Register failure handling when token issuance fails

- Decision: Treat register as failed for the client if token issuance fails after user creation, return stable internal error payload with `traceId`, and log structured failure; implementation may use compensation (remove newly created user) to preserve atomic user experience.
- Rationale: Avoids partial success where account exists but onboarding promise (authenticated immediately) is broken.
- Alternatives considered: Return success without token and force manual login retry (rejected due to inconsistent UX and FR-011 risk).

## 8) Error envelope and observability

- Decision: Keep existing error envelope `{ error: { code, message, details, traceId } }` for all relevant statuses (`400/401/403/404/409/422/429/500`) and require structured logs with context.
- Rationale: Already aligned with constitution and current `error-handler` implementation; keeps machine-readable client behavior stable.
- Alternatives considered: Return framework-native error format (rejected due to contract instability).

## 9) Data sanitization and persistence mapping

- Decision: Use explicit repository selection/mapping for user read/update responses and never expose `passwordHash` or raw Prisma rows; persist user updates field-by-field.
- Rationale: Prevents sensitive data leakage and enforces invariant boundaries between repository and service layers.
- Alternatives considered: Reuse Prisma model objects directly in responses (rejected due to sensitive field exposure risk).

## Clarification status

All items previously marked as `NEEDS CLARIFICATION` in `/Volumes/SSD Externo/Projects/MyPet/specs/002-secure-user-management/plan.md` are resolved.
