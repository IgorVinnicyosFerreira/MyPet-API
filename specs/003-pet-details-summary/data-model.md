# Data Model: Pet Details with Health Summary

**Feature**: `003-pet-details-summary`
**Phase**: 1 — Design
**Date**: 2026-04-06

> Nenhuma migration é necessária. Todos os modelos já existem no schema Prisma. Este documento descreve os modelos existentes relevantes para esta feature e as projeções de leitura utilizadas.

---

## Modelos Existentes Utilizados

### Pets

| Campo           | Tipo        | Nullable | Descrição                        |
|-----------------|-------------|----------|----------------------------------|
| id              | UUID (PK)   | não      | Identificador único              |
| name            | String      | não      | Nome do pet                      |
| species         | String      | não      | Espécie                          |
| breed           | String      | sim      | Raça                             |
| birthDate       | DateTime    | sim      | Data de nascimento               |
| sex             | Sex enum    | sim      | MALE / FEMALE / UNKNOWN          |
| notes           | String      | sim      | Observações gerais               |
| primaryTutorId  | UUID (FK)   | não      | Tutor principal (Users.id)       |
| createdAt       | DateTime    | não      | Timestamp de criação             |
| updatedAt       | DateTime    | não      | Timestamp de atualização         |

**Regra de acesso**: o usuário autenticado deve ser `primaryTutorId` OU ter um registro em `CareRelations` com `status = ACTIVE`.

---

### CareRelations

| Campo           | Tipo          | Nullable | Descrição                                  |
|-----------------|---------------|----------|--------------------------------------------|
| id              | UUID (PK)     | não      |                                            |
| petId           | UUID (FK)     | não      | Pet relacionado                            |
| userId          | UUID (FK)     | não      | Usuário com acesso                         |
| role            | CareRole enum | não      | PRIMARY_TUTOR / CO_TUTOR / CAREGIVER       |
| status          | CareStatus    | não      | PENDING / ACTIVE / REVOKED                 |
| invitedByUserId | UUID (FK)     | não      |                                            |
| revokedAt       | DateTime      | sim      |                                            |

**Constraint**: `UNIQUE(petId, userId)`.
**Regra de autorização**: apenas `status = ACTIVE` concede acesso ao GET.

---

### WeightRecords

Campos retornados em `healthSummary.lastWeight` (excluindo `createdByUserId`, `petId`):

| Campo       | Tipo     | Nullable | Critério de "mais recente" |
|-------------|----------|----------|---------------------------|
| id          | UUID     | não      |                           |
| weightGrams | Int      | não      | —                         |
| measuredAt  | DateTime | não      | `ORDER BY measuredAt DESC LIMIT 1` |
| note        | String   | sim      | —                         |
| version     | Int      | não      | —                         |
| createdAt   | DateTime | não      | —                         |
| updatedAt   | DateTime | não      | —                         |

---

### Vaccinations

Campos retornados em `healthSummary.lastVaccination` (excluindo `createdByUserId`, `petId`):

| Campo              | Tipo     | Nullable | Critério de "mais recente" |
|--------------------|----------|----------|---------------------------|
| id                 | UUID     | não      |                           |
| vaccineName        | String   | não      | —                         |
| appliedAt          | DateTime | não      | `ORDER BY appliedAt DESC LIMIT 1` |
| vetName            | String   | não      | —                         |
| nextDoseAt         | DateTime | sim      | —                         |
| reminderEnabled    | Boolean  | não      | —                         |
| nextDoseReminderAt | DateTime | sim      | —                         |
| notes              | String   | sim      | —                         |
| fileId             | UUID     | sim      | ID do arquivo vinculado   |
| version            | Int      | não      | —                         |
| createdAt          | DateTime | não      | —                         |
| updatedAt          | DateTime | não      | —                         |

---

### Consultations

Campos retornados em `healthSummary.lastConsultation` (excluindo `createdByUserId`, `petId`):

| Campo      | Tipo     | Nullable | Critério de "mais recente"    |
|------------|----------|----------|-------------------------------|
| id         | UUID     | não      |                               |
| occurredAt | DateTime | não      | `ORDER BY occurredAt DESC LIMIT 1` |
| clinicName | String   | sim      | —                             |
| vetName    | String   | sim      | —                             |
| notes      | String   | sim      | —                             |
| version    | Int      | não      | —                             |
| createdAt  | DateTime | não      | —                             |
| updatedAt  | DateTime | não      | —                             |

---

### SanitaryRecords (Dewormer e Antiparasitic)

Dois campos separados no `healthSummary`: `lastDewormer` e `lastAntiparasitic`.
Filtro: `category = 'DEWORMER'` para `lastDewormer`; `category = 'ANTIPARASITIC'` para `lastAntiparasitic`.
Campos retornados (excluindo `createdByUserId`, `petId`):

| Campo            | Tipo              | Nullable | Critério de "mais recente"  |
|------------------|-------------------|----------|-----------------------------|
| id               | UUID              | não      |                             |
| category         | SanitaryCategory  | não      | DEWORMER ou ANTIPARASITIC   |
| productName      | String            | não      | —                           |
| appliedAt        | DateTime          | não      | `ORDER BY appliedAt DESC LIMIT 1` |
| nextApplicationAt| DateTime          | sim      | —                           |
| reminderEnabled  | Boolean           | não      | —                           |
| notes            | String            | sim      | —                           |
| version          | Int               | não      | —                           |
| createdAt        | DateTime          | não      | —                           |
| updatedAt        | DateTime          | não      | —                           |

---

### FeedingRecords

Campos retornados em `healthSummary.lastFeeding` (excluindo `createdByUserId`, `petId`):

| Campo       | Tipo        | Nullable | Critério de "mais recente"  |
|-------------|-------------|----------|-----------------------------|
| id          | UUID        | não      |                             |
| type        | FeedingType | não      | FEED / NATURAL / MIXED / OTHER |
| description | String      | não      | —                           |
| startsAt    | DateTime    | não      | `ORDER BY startsAt DESC LIMIT 1` |
| endsAt      | DateTime    | sim      | —                           |
| isActive    | Boolean     | não      | —                           |
| version     | Int         | não      | —                           |
| createdAt   | DateTime    | não      | —                           |
| updatedAt   | DateTime    | não      | —                           |

---

## Projeção de Leitura: PetWithHealthSummary

Shape TypeScript esperado como retorno do repositório:

```typescript
type PetWithHealthSummary = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: Date | null;
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
  notes: string | null;
  primaryTutorId: string;
  createdAt: Date;
  updatedAt: Date;
  healthSummary: {
    lastWeight: WeightRecordSummary | null;
    lastVaccination: VaccinationSummary | null;
    lastConsultation: ConsultationSummary | null;
    lastDewormer: SanitaryRecordSummary | null;
    lastAntiparasitic: SanitaryRecordSummary | null;
    lastFeeding: FeedingRecordSummary | null;
  };
};
```

> Os sub-types (`WeightRecordSummary`, etc.) devem ser definidos em `pets.types.ts` omitindo `createdByUserId` e `petId`.
