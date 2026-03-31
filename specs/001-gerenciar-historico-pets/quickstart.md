# Quickstart - 001-gerenciar-historico-pets

## Goal

Run and validate the API design for pet history/care, including local file storage abstraction and auto docs in `/docs`.

## Prerequisites

- Docker + Docker Compose
- Node.js (for runtime/development)
- pnpm
- Bun (for automated tests)

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

## 4) Prepare local storage root

```bash
cd /Volumes/SSD Externo/Projects/MyPet
mkdir -p storage
```

Expected local structure for provider:

```text
/Volumes/SSD Externo/Projects/MyPet/storage/
`-- pets/
    `-- {petId}/
        |-- exams/
        `-- vaccinations/
```

## 5) Run API in development

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make dev
```

## 6) Open generated API docs

- Swagger/Scalar docs: `http://localhost:3333/docs`

## 7) Validate quality gates

Typecheck:

```bash
cd /Volumes/SSD Externo/Projects/MyPet
pnpm typecheck
```

Lint:

```bash
cd /Volumes/SSD Externo/Projects/MyPet
pnpm biome check .
```

Tests with Bun (unit + integration, minimum 80% coverage for module):

```bash
cd /Volumes/SSD Externo/Projects/MyPet
make test-coverage
```

## 8) Contract sanity checks

- Ensure all routes stay under `/v1/...` and plural resources.
- Ensure each route defines Zod schema for `querystring`, `params`, `body`, and `response` (relevant statuses).
- Ensure credential flow exists (`/v1/auth/register` and `/v1/auth/login`) and protected routes require bearer token.
- Ensure digital wallet endpoint (`/v1/pets/{petId}/digital-wallet`) returns structured JSON only.
- Ensure optimistic-lock updates require `version` and return `409 Conflict` on stale updates (`/v1/pets/{petId}/history/{recordType}/{recordId}` and `/v1/prescriptions/{prescriptionId}`).
- Ensure retroactive dose record keeps schedule unchanged (`nextDoseRecalculated=false` when `takenAt` is older than latest confirmed dose).
- Ensure error payload follows:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Pet not found",
    "details": {},
    "traceId": "req-123"
  }
}
```

## Task references

- Setup phase: T001-T007
- Foundational phase: T008-T017
- User Story 1: T018-T035
- User Story 2: T036-T048
- User Story 3: T049-T058
- Polish: T059-T065

## API usage examples

Register:

```bash
curl -X POST http://localhost:3333/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Igor Ferreira",
    "email": "igor@example.com",
    "password": "12345678"
  }'
```

Login:

```bash
curl -X POST http://localhost:3333/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "igor@example.com",
    "password": "12345678"
  }'
```

Create pet:

```bash
curl -X POST http://localhost:3333/v1/pets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Luna",
    "species": "Canine",
    "breed": "SRD"
  }'
```

Upload attachment (base64 payload):

```bash
curl -X POST http://localhost:3333/v1/files/uploads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "petId": "<PET_ID>",
    "domain": "EXAM",
    "originalName": "hemograma.pdf",
    "mimeType": "application/pdf",
    "contentBase64": "<BASE64_CONTENT>"
  }'
```

Medication agenda:

```bash
curl -X GET "http://localhost:3333/v1/pets/<PET_ID>/medication-agenda?date=2026-03-13" \
  -H "Authorization: Bearer <TOKEN>"
```
