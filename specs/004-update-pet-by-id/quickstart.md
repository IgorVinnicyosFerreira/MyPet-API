# Quickstart: Atualizacao de Dados de Pet por ID

**Feature**: `004-update-pet-by-id`  
**Branch**: `004-update-pet-by-id`

## Pre-requisitos

```bash
make up
make migrate
make prisma-generate
```

## Cenarios de uso do PATCH

### 1. Sucesso de atualizacao parcial

```bash
curl -X PATCH "http://localhost:3333/v1/pets/{petId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luna Atualizada",
    "observations": "Alergica a frango",
    "expectedUpdatedAt": "2026-04-07T12:30:00.000Z"
  }'
```

Resultado esperado:
- `200 OK`
- resposta com `name` atualizado
- `observations` persistido em `notes`
- campos omitidos preservados

### 2. Conflito otimista (token desatualizado)

```bash
curl -X PATCH "http://localhost:3333/v1/pets/{petId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nome Concorrente",
    "expectedUpdatedAt": "2026-04-07T12:30:00.000Z"
  }'
```

Resultado esperado:
- `409 Conflict`
- envelope com `error.code = "CONFLICT"`
- `error.traceId` presente

### 3. Sem permissao para o pet

Resultado esperado:
- `403 Forbidden`
- envelope com `error.code = "FORBIDDEN"`
- nenhum dado do pet alterado

### 4. Pet inexistente

Resultado esperado:
- `404 Not Found`
- envelope com `error.code = "RESOURCE_NOT_FOUND"`
- `error.traceId` presente

## Implementacao por camada

### 1. `src/modules/v1/pets/pets.types.ts`

Adicionar tipos para update parcial de pet:
- `PetUpdateInput` com campos permitidos (`name`, `species`, `breed`, `birthDate`, `sex`, `observations`) e `expectedUpdatedAt`.
- `PetPatchPersistenceInput` (normalizado para `notes`) para camada de repositorio.

### 2. `src/modules/v1/pets/pets.schemas.ts`

Adicionar schemas Zod:
- `petUpdateParamSchema`: `{ petId: z.string().check(z.uuid()) }`.
- `petUpdateBodySchema`: `z.strictObject({...})` com:
  - `expectedUpdatedAt: z.coerce.date()` (obrigatorio);
  - campos de dominio opcionais;
  - validacao refinada exigindo ao menos 1 campo de dominio para atualizar.
- Reutilizar `petSchema` para resposta `200` e `errorResponseSchema` para erros.

### 3. `src/modules/v1/pets/repositories/pets-interfaces.repository.ts`

Adicionar ao `IPetsRepository`:

```typescript
updatePetByIdOptimistic(input: {
  petId: string;
  expectedUpdatedAt: Date;
  data: {
    name?: string;
    species?: string;
    breed?: string | null;
    birthDate?: Date | null;
    sex?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
    notes?: string | null;
  };
}): Promise<Pet | null>;
```

### 4. `src/modules/v1/pets/repositories/prisma-pets.repository.ts`

Implementar `updatePetByIdOptimistic`:
1. `updateMany` com filtro `{ id: petId, updatedAt: expectedUpdatedAt }`.
2. Data montada por whitelist (sem spread de body cru).
3. Se `count === 0`, retornar `null` (conflito de concorrencia).
4. Se atualizar, buscar `findUnique` e retornar `Pet` atualizado.

### 5. `src/modules/v1/pets/pets.service.ts`

Adicionar `updatePetById(petId, userId, input)`:
1. Buscar pet por id; se nao existir, `404`.
2. Validar permissao (`primaryTutorId` ou `CareRelation.status === ACTIVE`); se nao, `403`.
3. Normalizar `observations -> notes`.
4. Chamar `updatePetByIdOptimistic`; se `null`, `409`.
5. Retornar pet atualizado.

Adicionar logs estruturados da operacao com `context: "pets.updateById"` e `traceId`.

### 6. `src/modules/v1/pets/pets.controller.ts`

Adicionar handler `updatePetById(req, reply)`:
- `petId` via `req.params`;
- `userId` via `req.user.sub`;
- body tipado via schema;
- resposta `200` com entidade atualizada.

### 7. `src/modules/v1/pets/pets.routes.ts`

Registrar:

```typescript
fastify.patch(
  '/:petId',
  {
    preHandler: fastify.authenticate,
    schema: {
      params: petUpdateParamSchema,
      body: petUpdateBodySchema,
      response: {
        200: petSchema,
        400: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
  },
  (req, reply) => makePetsController().updatePetById(req, reply),
);
```

## Testes obrigatorios

### Unitarios

Arquivo: `tests/unit/modules/v1/pets/pets.service.spec.ts`

Cobrir pelo menos:
1. Atualizacao com tutor principal autorizado -> `200`.
2. Atualizacao com `CareRelation ACTIVE` -> `200`.
3. Usuario sem permissao -> `403`.
4. Pet inexistente -> `404`.
5. Conflito otimista (`expectedUpdatedAt` desatualizado) -> `409`.
6. Payload sem campos de dominio validos -> `400`.
7. Payload com campo nao permitido -> `400`.
8. Mapeamento `observations` para `notes` no objeto de persistencia.

### Integracao

Arquivo: `tests/integration/modules/v1/pets/pets.contract.spec.ts`

Cobrir pelo menos:
1. `PATCH /v1/pets/:id` sucesso com resposta atualizada.
2. `PATCH` sem permissao retorna `403` e nao altera dados.
3. `PATCH` com `petId` invalido retorna `400`.
4. `PATCH` com pet inexistente retorna `404`.
5. `PATCH` com token de concorrencia invalido retorna `409`.
6. `PATCH` com campos nao permitidos retorna `400`.

## Validacao final

```bash
make typecheck
make test
make test-coverage
```
