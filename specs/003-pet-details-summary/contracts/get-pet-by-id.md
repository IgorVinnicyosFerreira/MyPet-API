# API Contract: GET /v1/pets/:petId

**Feature**: `003-pet-details-summary`
**Method**: GET
**Path**: `/v1/pets/:petId`
**Auth**: Required — Bearer JWT (`fastify.authenticate` preHandler)
**Rate Limit**: Yes — seguir padrão dos endpoints protegidos do módulo

---

## Request

### Path Parameters

| Param  | Type   | Validation         | Description         |
|--------|--------|--------------------|---------------------|
| petId  | string | UUID v4 (required) | ID único do pet     |

**Zod schema** (novo — `petByIdParamSchema`):
```typescript
const petByIdParamSchema = z.object({
  petId: z.string().check(z.uuid()),
});
```

> Nota: Não reutiliza `petIdParamSchema` existente (que usa `z.string()` sem validação de UUID) para não impactar outras rotas.

### Query String
Nenhuma.

### Body
Nenhum.

---

## Responses

### 200 OK — Sucesso

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Luna",
  "species": "Canine",
  "breed": "SRD",
  "birthDate": "2020-03-15T00:00:00.000Z",
  "sex": "FEMALE",
  "notes": "Alérgica a frango",
  "primaryTutorId": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-06-01T08:30:00.000Z",
  "healthSummary": {
    "lastWeight": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "weightGrams": 8500,
      "measuredAt": "2025-12-01T10:00:00.000Z",
      "note": "Pesagem rotineira",
      "version": 1,
      "createdAt": "2025-12-01T10:05:00.000Z",
      "updatedAt": "2025-12-01T10:05:00.000Z"
    },
    "lastVaccination": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "vaccineName": "V10",
      "appliedAt": "2025-10-15T09:00:00.000Z",
      "vetName": "Dra. Silva",
      "nextDoseAt": "2026-10-15T09:00:00.000Z",
      "reminderEnabled": true,
      "nextDoseReminderAt": "2026-10-08T08:00:00.000Z",
      "notes": null,
      "fileId": null,
      "version": 1,
      "createdAt": "2025-10-15T09:10:00.000Z",
      "updatedAt": "2025-10-15T09:10:00.000Z"
    },
    "lastConsultation": {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "occurredAt": "2025-11-20T14:00:00.000Z",
      "clinicName": "Clínica PetVida",
      "vetName": "Dr. Alves",
      "notes": "Check-up anual",
      "version": 1,
      "createdAt": "2025-11-20T14:30:00.000Z",
      "updatedAt": "2025-11-20T14:30:00.000Z"
    },
    "lastDewormer": {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "category": "DEWORMER",
      "productName": "Drontal Plus",
      "appliedAt": "2025-09-01T08:00:00.000Z",
      "nextApplicationAt": "2025-12-01T08:00:00.000Z",
      "reminderEnabled": true,
      "notes": null,
      "version": 1,
      "createdAt": "2025-09-01T08:05:00.000Z",
      "updatedAt": "2025-09-01T08:05:00.000Z"
    },
    "lastAntiparasitic": {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "category": "ANTIPARASITIC",
      "productName": "Bravecto",
      "appliedAt": "2025-11-01T08:00:00.000Z",
      "nextApplicationAt": "2026-02-01T08:00:00.000Z",
      "reminderEnabled": true,
      "notes": null,
      "version": 1,
      "createdAt": "2025-11-01T08:05:00.000Z",
      "updatedAt": "2025-11-01T08:05:00.000Z"
    },
    "lastFeeding": {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "type": "FEED",
      "description": "Ração Premium Adulto 200g 2x ao dia",
      "startsAt": "2025-08-01T00:00:00.000Z",
      "endsAt": null,
      "isActive": true,
      "version": 1,
      "createdAt": "2025-08-01T07:00:00.000Z",
      "updatedAt": "2025-08-01T07:00:00.000Z"
    }
  }
}
```

**Campos `null` quando não há registro para a categoria:**
```json
{
  "healthSummary": {
    "lastWeight": null,
    "lastVaccination": null,
    "lastConsultation": null,
    "lastDewormer": null,
    "lastAntiparasitic": null,
    "lastFeeding": null
  }
}
```

**Campos explicitamente excluídos** (FR-012): `createdByUserId` em todos os sub-objetos de `healthSummary`; `petId` nos sub-objetos (redundante).

---

### 400 Bad Request — petId inválido (não UUID)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid petId format",
    "details": {},
    "traceId": "req-abc123"
  }
}
```

### 403 Forbidden — usuário sem acesso ao pet

```json
{
  "error": {
    "code": "ACCESS_DENIED",
    "message": "You do not have access to this pet",
    "details": {},
    "traceId": "req-abc123"
  }
}
```

### 404 Not Found — pet não encontrado

```json
{
  "error": {
    "code": "PET_NOT_FOUND",
    "message": "Pet not found",
    "details": {},
    "traceId": "req-abc123"
  }
}
```

---

## Zod Response Schema (esboço)

```typescript
const healthSummaryWeightSchema = z.nullable(z.object({
  id: z.string(),
  weightGrams: z.number(),
  measuredAt: z.coerce.date(),
  note: z.nullable(z.string()),
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}));

const healthSummaryVaccinationSchema = z.nullable(z.object({
  id: z.string(),
  vaccineName: z.string(),
  appliedAt: z.coerce.date(),
  vetName: z.string(),
  nextDoseAt: z.nullable(z.coerce.date()),
  reminderEnabled: z.boolean(),
  nextDoseReminderAt: z.nullable(z.coerce.date()),
  notes: z.nullable(z.string()),
  fileId: z.nullable(z.string()),
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}));

const healthSummaryConsultationSchema = z.nullable(z.object({
  id: z.string(),
  occurredAt: z.coerce.date(),
  clinicName: z.nullable(z.string()),
  vetName: z.nullable(z.string()),
  notes: z.nullable(z.string()),
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}));

const healthSummarySanitarySchema = z.nullable(z.object({
  id: z.string(),
  category: z.enum(['DEWORMER', 'ANTIPARASITIC']),
  productName: z.string(),
  appliedAt: z.coerce.date(),
  nextApplicationAt: z.nullable(z.coerce.date()),
  reminderEnabled: z.boolean(),
  notes: z.nullable(z.string()),
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}));

const healthSummaryFeedingSchema = z.nullable(z.object({
  id: z.string(),
  type: z.enum(['FEED', 'NATURAL', 'MIXED', 'OTHER']),
  description: z.string(),
  startsAt: z.coerce.date(),
  endsAt: z.nullable(z.coerce.date()),
  isActive: z.boolean(),
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}));

const petWithHealthSummarySchema = petSchema.extend({
  healthSummary: z.object({
    lastWeight: healthSummaryWeightSchema,
    lastVaccination: healthSummaryVaccinationSchema,
    lastConsultation: healthSummaryConsultationSchema,
    lastDewormer: healthSummarySanitarySchema,
    lastAntiparasitic: healthSummarySanitarySchema,
    lastFeeding: healthSummaryFeedingSchema,
  }),
});
```

---

## Notas de Implementação

- A rota usa `fastify.authenticate` como `preHandler` (mesmo middleware das outras rotas do módulo).
- Rate limit deve ser adicionado como segundo `preHandler` seguindo o padrão do módulo.
- A verificação de acesso (tutor primário ou care relation ACTIVE) ocorre no service antes de qualquer retorno de dados.
- A ordem de checagem no service: (1) pet existe → 404 se não; (2) usuário tem acesso → 403 se não; (3) retornar dados.
