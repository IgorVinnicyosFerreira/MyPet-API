# API Contract: POST /v1/pets (Species Restricted)

**Feature**: `005-restrict-pet-species`  
**Method**: POST  
**Path**: `/v1/pets`  
**Auth**: Required - Bearer JWT (`fastify.authenticate`)

---

## Request

### Body

```json
{
  "name": "Luna",
  "species": "Canine",
  "breed": "SRD",
  "birthDate": "2020-03-15T00:00:00.000Z",
  "sex": "FEMALE",
  "notes": "Alergica a frango"
}
```

### Field Rules

| Field | Type | Required | Validation |
|---|---|---|---|
| name | string | yes | min 1, max 120 |
| species | enum | yes | `Canine` or `Feline` |
| breed | string | no | max 80 |
| birthDate | string(date-time) | no | valid date-time |
| sex | enum | no | `MALE` `FEMALE` `UNKNOWN` |
| notes | string | no | max 2000 |

### Rejected Examples for `species`

- `Bird`
- `canine`
- `DOG`
- `""`
- `null`

---

## Responses

### 201 Created

Retorna o mesmo schema de pet ja existente em `/v1`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Luna",
  "species": "Canine",
  "breed": "SRD",
  "birthDate": "2020-03-15T00:00:00.000Z",
  "sex": "FEMALE",
  "notes": "Alergica a frango",
  "primaryTutorId": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-04-17T15:00:00.000Z",
  "updatedAt": "2026-04-17T15:00:00.000Z"
}
```

### Validation Error (invalid species)

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "details": {},
    "traceId": "req-abc123"
  }
}
```

---

## Contract Notes

- This feature does not introduce `/v2`; it keeps `/v1` and hardens input validation.
- Success response shape remains unchanged for backward compatibility.
- Restriction applies to creation flow only in this scope.
