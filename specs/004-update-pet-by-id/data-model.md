# Data Model: Atualizacao de Dados de Pet por ID

**Feature**: `004-update-pet-by-id`  
**Phase**: 1 — Design  
**Date**: 2026-04-07

> Nenhuma migration e necessaria para esta feature. O modelo `Pets` ja contem os campos atualizaveis e `updatedAt` para controle otimista.

## Entidades de Dominio

### 1. Pet (existente)

| Campo | Tipo | Nullable | Atualizavel no PATCH | Observacao |
|---|---|---|---|---|
| id | UUID | nao | nao | Identificador do recurso |
| name | string | nao | sim | max 120 |
| species | string | nao | sim | max 60 |
| breed | string | sim | sim | max 80 |
| birthDate | DateTime | sim | sim | data valida |
| sex | enum (`MALE` `FEMALE` `UNKNOWN`) | sim | sim | dominio fechado |
| notes | string | sim | sim (via `observations`) | max 2000 |
| primaryTutorId | UUID | nao | nao | usado na autorizacao |
| createdAt | DateTime | nao | nao | auditoria |
| updatedAt | DateTime | nao | nao (gerado pelo banco/ORM) | token de concorrencia otimista |

### 2. User (existente)

| Campo | Tipo | Papel na feature |
|---|---|---|
| id | UUID | ator autenticado que solicita update |
| role | enum | sem mudanca de regra global nesta feature |

### 3. Care Relation (existente)

| Campo | Tipo | Papel na feature |
|---|---|---|
| petId | UUID | referencia ao recurso |
| userId | UUID | referencia ao ator |
| status | enum (`PENDING` `ACTIVE` `REVOKED`) | `ACTIVE` concede permissao de update |

## Modelos de Interface (novos no modulo)

### 4. UpdatePetByIdRequest (API)

| Campo | Tipo | Obrigatorio | Regra |
|---|---|---|---|
| name | string | nao | permitido |
| species | string | nao | permitido |
| breed | string \| null | nao | permitido |
| birthDate | string(date-time) \| null | nao | permitido |
| sex | enum \| null | nao | permitido |
| observations | string \| null | nao | permitido; normaliza para `notes` |
| expectedUpdatedAt | string(date-time) | sim | token de concorrencia otimista |

**Regra de validacao adicional**: deve existir ao menos 1 campo de dominio para atualizar (`name`, `species`, `breed`, `birthDate`, `sex`, `observations`). Enviar somente `expectedUpdatedAt` resulta em `400`.

### 5. UpdatePetByIdCommand (service)

```typescript
type UpdatePetByIdCommand = {
  petId: string;
  actorUserId: string;
  expectedUpdatedAt: Date;
  payload: {
    name?: string;
    species?: string;
    breed?: string | null;
    birthDate?: Date | null;
    sex?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
    observations?: string | null;
  };
};
```

### 6. PetUpdatePersistenceInput (repository)

```typescript
type PetUpdatePersistenceInput = {
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
};
```

## Regras de Relacionamento e Integridade

- Um `Pet` pertence a um tutor principal (`primaryTutorId`) e pode ter multiplas `CareRelations`.
- O update e autorizado quando:
  - `actorUserId === pet.primaryTutorId`; ou
  - existe `CareRelation` com `status = ACTIVE` para (`petId`, `actorUserId`).
- Campos fora da whitelist sao rejeitados com `400` (nao persistidos).
- Persistencia deve ser feita campo a campo (whitelist), nunca por spread direto de `req.body`.

## State Transitions

### Fluxo de atualizacao do Pet

1. **Pet localizado + acesso permitido + token atual**
   - Estado: `updatedAt` igual ao `expectedUpdatedAt` recebido.
   - Transicao: atualiza campos permitidos, `updatedAt` muda automaticamente.
   - Resultado: `200` com pet atualizado.

2. **Pet localizado + acesso permitido + token desatualizado**
   - Estado: `updatedAt` diferente do `expectedUpdatedAt` recebido.
   - Transicao: nenhuma alteracao persistida.
   - Resultado: `409 CONFLICT`.

3. **Pet localizado + sem permissao**
   - Transicao: nenhuma alteracao persistida.
   - Resultado: `403 FORBIDDEN`.

4. **Pet inexistente**
   - Transicao: nenhuma alteracao persistida.
   - Resultado: `404 RESOURCE_NOT_FOUND`.

5. **Payload invalido**
   - Casos: `petId` invalido, body sem campos permitidos, campo nao permitido.
   - Transicao: nenhuma alteracao persistida.
   - Resultado: `400 BAD_REQUEST`.
