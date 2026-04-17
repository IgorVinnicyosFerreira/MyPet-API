# API Contract: PATCH /v1/pets/:petId

**Feature**: `004-update-pet-by-id`  
**Method**: PATCH  
**Path**: `/v1/pets/:petId`  
**Auth**: Required — Bearer JWT (`fastify.authenticate`)  
**Rate Limit**: Reutilizar politica dos endpoints protegidos do modulo `pets`

## Request

### Path Parameters

| Param | Type | Validation | Description |
|---|---|---|---|
| petId | string | UUID v4 (required) | Identificador unico do pet |

### Body

```json
{
  "name": "Luna",
  "species": "Canine",
  "breed": "SRD",
  "birthDate": "2020-03-15T00:00:00.000Z",
  "sex": "FEMALE",
  "observations": "Alergica a frango",
  "expectedUpdatedAt": "2026-04-07T12:30:00.000Z"
}
```

#### Regras de body

- Campos permitidos para update parcial:
  - `name`, `species`, `breed`, `birthDate`, `sex`, `observations`.
- `expectedUpdatedAt` e obrigatorio para controle otimista.
- Deve haver ao menos 1 campo de dominio para atualizar (nao vale enviar apenas `expectedUpdatedAt`).
- Campos nao permitidos devem ser rejeitados com `400 Bad Request`.

## Responses

### 200 OK

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
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2026-04-07T12:31:20.000Z"
}
```

> `observations` e normalizado para `notes` no modelo persistido/resposta do modulo.

### 400 Bad Request

Casos esperados:
- `id` invalido;
- body sem campos permitidos de dominio;
- tentativa de enviar campo nao permitido;
- formato invalido de campo.

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

### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this pet",
    "details": {},
    "traceId": "req-abc123"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Pet not found",
    "details": {},
    "traceId": "req-abc123"
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Pet update conflict",
    "details": {},
    "traceId": "req-abc123"
  }
}
```

## Validacoes de contrato executadas

- `PATCH` com sucesso retorna `200` e preserva campos omitidos.
- `PATCH` com `expectedUpdatedAt` desatualizado retorna `409` com `error.code = "CONFLICT"` e `traceId`.
- `PATCH` por usuario sem vinculo retorna `403` com `error.code = "FORBIDDEN"` e sem mutacao de dados.
- `PATCH` para pet inexistente retorna `404` com `error.code = "RESOURCE_NOT_FOUND"` e `traceId`.
- Todos os cenarios de erro mantem envelope padrao:
  - `error.code`
  - `error.message`
  - `error.details`
  - `error.traceId`

## Zod Contract Sketch

```typescript
const petUpdateParamSchema = z.object({
  petId: z.string().check(z.uuid()),
});

const petUpdateBodySchema = z
  .strictObject({
    expectedUpdatedAt: z.coerce.date(),
    name: z.optional(z.string().check(z.minLength(1), z.maxLength(120))),
    species: z.optional(z.string().check(z.minLength(1), z.maxLength(60))),
    breed: z.optional(z.nullable(z.string().check(z.maxLength(80)))),
    birthDate: z.optional(z.nullable(z.coerce.date())),
    sex: z.optional(z.nullable(z.enum(['MALE', 'FEMALE', 'UNKNOWN']))),
    observations: z.optional(z.nullable(z.string().check(z.maxLength(2000)))),
  })
  .check((value) =>
    [
      value.name,
      value.species,
      value.breed,
      value.birthDate,
      value.sex,
      value.observations,
    ].some((field) => field !== undefined),
  );
```
