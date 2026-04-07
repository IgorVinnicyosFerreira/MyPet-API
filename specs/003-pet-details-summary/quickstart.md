# Quickstart: Pet Details with Health Summary

**Feature**: `003-pet-details-summary`
**Branch**: `003-pet-details-summary`

## Pré-requisitos

```bash
make up          # Sobe PostgreSQL via Docker Compose
make migrate     # Aplica migrations (nenhuma nova para esta feature)
make prisma-generate  # Regenera Prisma Client
```

## Arquivos a criar/modificar

### 1. `src/modules/v1/pets/pets.types.ts`
Adicionar os tipos de projeção de leitura:
- `WeightRecordSummary` — campos de WeightRecords sem `createdByUserId` e `petId`
- `VaccinationSummary`
- `ConsultationSummary`
- `SanitaryRecordSummary`
- `FeedingRecordSummary`
- `HealthSummary` — objeto com `lastWeight`, `lastVaccination`, `lastConsultation`, `lastDewormer`, `lastAntiparasitic`, `lastFeeding`
- `PetWithHealthSummary` — `Pet` + `healthSummary: HealthSummary`

### 2. `src/modules/v1/pets/pets.schemas.ts`
Adicionar schemas Zod:
- `petByIdParamSchema` — `{ petId: z.string().check(z.uuid()) }`
- `healthSummaryWeightSchema`, `healthSummaryVaccinationSchema`, `healthSummaryConsultationSchema`, `healthSummarySanitarySchema`, `healthSummaryFeedingSchema`
- `petWithHealthSummarySchema` — `petSchema.extend({ healthSummary: ... })`

Exportar os novos schemas.

### 3. `src/modules/v1/pets/repositories/pets-interfaces.repository.ts`
Adicionar ao `IPetsRepository`:
```typescript
getPetWithHealthSummary(petId: string, userId: string): Promise<PetWithHealthSummary | null>;
```
> Retorna `null` quando o pet não existe. Autorização não é responsabilidade do repositório.

Separar concern: adicionar método de checagem de acesso:
```typescript
findCareRelation(petId: string, userId: string): Promise<{ status: CareStatus } | null>;
```

### 4. `src/modules/v1/pets/repositories/prisma-pets.repository.ts`
Implementar `getPetWithHealthSummary`:
- `prisma.pets.findUnique` com nested selects usando `take: 1` + `orderBy` por categoria
- Mapear resultado para `PetWithHealthSummary` omitindo `createdByUserId` e `petId` dos sub-objetos
- Montar `healthSummary` com `null` para categorias sem registro

Implementar `findCareRelation`:
- `prisma.careRelations.findUnique({ where: { petId_userId: { petId, userId } } })`

### 5. `src/modules/v1/pets/pets.service.ts`
Adicionar método `getPetById(petId: string, userId: string): Promise<PetWithHealthSummary>`:
1. Chamar `repository.getPetWithHealthSummary(petId, userId)` → se `null`, throw `PetNotFoundError` (404)
2. Verificar acesso: `pet.primaryTutorId === userId` → OK
3. Senão, chamar `repository.findCareRelation(petId, userId)` → se `status === ACTIVE` → OK
4. Senão, throw `AccessDeniedError` (403)
5. Retornar `PetWithHealthSummary`

### 6. `src/modules/v1/pets/pets.controller.ts`
Adicionar método `getPetById(req, reply)`:
- Extrair `petId` de `req.params` e `userId` de `req.user.id`
- Chamar `service.getPetById(petId, userId)`
- Retornar `reply.status(200).send(result)`

### 7. `src/modules/v1/pets/pets.routes.ts`
Registrar nova rota:
```typescript
fastify.get(
  '/:petId',
  {
    preHandler: [fastify.authenticate, fastify.rateLimit(...)],
    schema: {
      params: petByIdParamSchema,
      response: {
        200: petWithHealthSummarySchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
  },
  (req, reply) => makePetsController().getPetById(req, reply),
);
```

> Verificar como `rateLimit` é configurado nas outras rotas do módulo e replicar o mesmo padrão.

## Testes

### Unitários
Arquivo: `tests/unit/modules/v1/pets/pets.service.spec.ts`

Adicionar 7 casos:
1. Acesso concedido para tutor primário → retorna `PetWithHealthSummary`
2. Acesso concedido para care relation com status ACTIVE
3. Acesso negado para usuário sem vínculo → lança 403
4. Acesso negado para care relation com status REVOKED → lança 403
5. Acesso negado para care relation com status PENDING → lança 403
6. Pet não encontrado → lança 404
7. Pet sem registros de saúde → retorna todos os campos de `healthSummary` como `null`
8. Pet com múltiplos registros por categoria → retorna apenas o mais recente

### Integração
Arquivo: `tests/integration/modules/v1/pets/pets.contract.spec.ts`

Adicionar 5 casos:
1. GET com tutor autenticado → 200 com todos os campos esperados
2. GET com pet sem histórico → 200 com `healthSummary` todo `null`
3. GET com usuário sem vínculo → 403
4. GET com petId inexistente → 404
5. GET com petId inválido (não UUID) → 400

## Validação

```bash
make typecheck      # ou pnpm typecheck se não disponível
make test           # roda unit + integration
make test-coverage  # verificar >= 80% no módulo pets
```
