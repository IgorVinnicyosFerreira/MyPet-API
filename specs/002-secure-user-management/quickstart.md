# Quickstart - 002-secure-user-management

## Goal

Run and validate secure user-management contracts: register with immediate token, user lookup by id, authorized update, and super-admin-only hard delete.

## Prerequisites

- Docker + Docker Compose
- Node.js
- pnpm
- Bun

## 1) Start infrastructure

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make up
```

## 2) Install dependencies (if needed)

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make install
```

## 3) Prepare database

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make prisma-generate
make migrate
```

## 4) Run API in development

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make dev
```

## 5) Open generated API docs

- Swagger/Scalar docs: `http://localhost:3333/docs`

## 6) Validate quality gates

Typecheck:

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make typecheck
```

Lint:

```bash
cd /Volumes/SSD Externo/Projects/MyPet
pnpm biome check .
```

Tests and coverage:

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make test
make test-integration
make test-coverage
```

## 7) API sanity checks with curl

Register (must return user fields + token):

```bash
curl -X POST http://localhost:3333/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Demo",
    "email": "demo@example.com",
    "password": "12345678"
  }'
```

Get user by id (authenticated):

```bash
curl -X GET http://localhost:3333/v1/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

Update own user (authenticated):

```bash
curl -X PATCH http://localhost:3333/v1/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Atualizado"
  }'
```

Delete user (super admin only, hard delete):

```bash
curl -X DELETE http://localhost:3333/v1/users/<USER_ID> \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>"
```

## 8) Contract checks

- `/v1/auth/register` must keep existing user fields and include `token` and `expiresIn`.
- `/v1/users/{userId}` must require bearer authentication.
- `PATCH /v1/users/{userId}` must allow only self or super admin.
- `DELETE /v1/users/{userId}` must allow only super admin and perform hard delete.
- Error payload must keep format:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": {},
    "traceId": "req-123"
  }
}
```
