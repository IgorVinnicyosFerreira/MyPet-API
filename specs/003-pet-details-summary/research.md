# Research: Pet Details with Health Summary

**Feature**: `003-pet-details-summary`
**Phase**: 0 — Outline & Research
**Date**: 2026-04-06

## Resoluções de NEEDS CLARIFICATION

### 1. Performance Goals

**Decision**: p95 < 300ms para o endpoint `GET /v1/pets/:petId`.
**Rationale**: Definido explicitamente na sessão de clarificações da spec (2026-04-06). Alinhado com a expectativa de "resposta percebida como instantânea" do critério SC-002.
**Alternatives considered**: Sem discussão de alternativas — target definido pelo owner da spec.
**How to apply**: A query Prisma deve evitar N+1. Usar `findUnique` com nested `include`/`select` + `take: 1` + `orderBy` em cada relação de saúde, trazendo todos os dados do pet e seus últimos registros em uma única roundtrip ao banco.

---

### 2. Scale/Scope

**Decision**: Uso normal de app mobile/web. Sem target de volume explícito. Consulta otimizada para single-query via Prisma.
**Rationale**: Não foram fornecidos dados de volumetria pelo owner. O padrão atual do projeto não aplica índices adicionais além dos criados pelas constraints do Prisma (PKs, FKs). Para p95 < 300ms com volume normal, a single-query com nested selects é suficiente.
**Alternatives considered**: Query separada por categoria de saúde (descartado: N+1 desnecessário); cache in-memory (descartado: sem evidência de necessidade de cache).

---

## Decisões de Implementação

### 3. Estratégia de query Prisma

**Decision**: `prisma.pets.findUnique({ where: { id: petId }, include: { WeightRecords: { orderBy: { measuredAt: 'desc' }, take: 1 }, Vaccinations: { orderBy: { appliedAt: 'desc' }, take: 1 }, Consultations: { orderBy: { occurredAt: 'desc' }, take: 1 }, SanitaryRecords (DEWORMER): { where: { category: 'DEWORMER' }, orderBy: { appliedAt: 'desc' }, take: 1 }, SanitaryRecords (ANTIPARASITIC): { where: { category: 'ANTIPARASITIC' }, orderBy: { appliedAt: 'desc' }, take: 1 }, FeedingRecords: { orderBy: { startsAt: 'desc' }, take: 1 } } })`
**Rationale**: Uma única roundtrip ao banco. Prisma gera JOINs ou subqueries otimizadas. `take: 1` + `orderBy` garante o registro mais recente por categoria sem buscar todos os registros.
**Alternatives considered**: Múltiplos `findFirst` separados por categoria (descartado: N+1, mais roundtrips).

---

### 4. Verificação de acesso (authorization)

**Decision**: No service, verificar se `userId === pet.primaryTutorId` OU se existe `CareRelations` com `petId === petId`, `userId === userId` e `status === ACTIVE`. O repositório expõe método dedicado para buscar a relação de cuidado.
**Rationale**: A lógica de acesso é regra de negócio → pertence ao service. O repositório consulta a tabela `CareRelations` sem conhecer a regra.
**Alternatives considered**: Buscar o pet junto com CareRelations na mesma query (possível, mas mistura concerns de autorização com dados de resposta; preferível separar por clareza).

---

### 5. Validação de UUID no petId param

**Decision**: Criar `petByIdParamSchema` com `z.string().check(z.uuid())` específico para esta rota, em vez de reutilizar o `petIdParamSchema` existente (`z.string()` sem validação de UUID).
**Rationale**: FR-011 exige 400 para UUID inválido. O `petIdParamSchema` atual não valida formato UUID (só exige string). Criar schema dedicado evita quebrar as rotas existentes que já usam `petIdParamSchema` com validação mais permissiva.
**Alternatives considered**: Atualizar `petIdParamSchema` existente para incluir UUID validation (possível, mas requer verificar impacto em todas as rotas que o usam — escopo além desta feature).

---

### 6. Rate limiting

**Decision**: Aplicar `fastify.rateLimit` como `preHandler` na rota `GET /:petId`, seguindo o padrão dos demais endpoints protegidos do módulo `pets`.
**Rationale**: Definido na sessão de clarificações da spec. Endpoint autenticado ainda deve ter proteção contra abuso (ex: enumeração de IDs).
**Alternatives considered**: Rate limit global (já existe; o rate limit por rota é adicional e mais granular).

---

### 7. Campos excluídos da resposta

**Decision**: `createdByUserId` não é retornado em nenhum sub-objeto de `healthSummary`. `petId` redundante nos registros de saúde também é omitido.
**Rationale**: FR-012 — campos internos de auditoria não devem ser expostos ao cliente. O `petId` é redundante pois já é o `id` do pet no nível raiz.
**Alternatives considered**: Retornar todos os campos e deixar o cliente ignorar (descartado: vaza informação desnecessária e polui o contrato).

---

### 8. Nenhuma migration necessária

**Decision**: Nenhuma migration será criada para esta feature.
**Rationale**: Todos os modelos necessários já existem no schema Prisma: `Pets`, `WeightRecords`, `Vaccinations`, `Consultations`, `SanitaryRecords`, `FeedingRecords`, `CareRelations`. Nenhum campo novo é necessário.
