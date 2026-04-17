# Research: Atualizacao de Dados de Pet por ID

**Feature**: `004-update-pet-by-id`  
**Phase**: 0 — Outline & Research  
**Date**: 2026-04-07

## Resolucao de NEEDS CLARIFICATION

### 1. Performance Goals

**Decision**: Definir para `PATCH /v1/pets/:id` alvo de `p95 <= 250ms`, throughput de `50 req/s` sustentado com burst de `100 req/s` por 5 minutos e taxa de falha infra `<1%`.

**Rationale**: O endpoint e update de registro unico (mais simples que agregacoes de leitura) e o historico do projeto ja usa metas nessa ordem para operacoes PATCH/DELETE sem sobrecarga de processamento pesado.

**Alternatives considered**:
- `p95 <= 350ms`: rejeitado por ser permissivo demais para update unitario.
- `p95 <= 200ms`: rejeitado por risco de ser agressivo demais considerando auth + autorizacao + OCC.
- `p95 < 300ms`: rejeitado por nao aproveitar o baseline mais estrito de endpoints de escrita simples.

### 2. Scale/Scope

**Decision**: Assumir escopo de uso mobile/web padrao do produto (baseline de referencia do projeto: ate ~10k MAU e ~100k pets), com atualizacao parcial de um unico pet por requisicao, sem bulk update, sem cache/fila/sharding.

**Rationale**: A spec nao definiu volumetria nova e a feature nao introduz processamento batch nem novo padrao de persistencia; manter premissas atuais reduz risco de overengineering.

**Alternatives considered**:
- Planejar arquitetura de escala alta agora (fila/cache/sharding): rejeitado por falta de necessidade comprovada.
- Assumir escala muito baixa e ignorar concorrencia: rejeitado porque a spec exige controle otimista e `409`.

## Best Practices por Dependencia / Integracao

### 3. Concorrencia otimista com Prisma + PostgreSQL

**Decision**: Usar `updatedAt` como token de concorrencia otimista no payload (`expectedUpdatedAt`) e aplicar update condicional no repositorio com `updateMany` filtrando por `{ id, updatedAt: expectedUpdatedAt }`; quando `count === 0`, tratar como conflito (`409 Conflict`).

**Rationale**: `Pets` ja possui `updatedAt` e nao possui `version`; a estrategia de compare-and-swap com `updateMany` segue padrao ja usado no projeto para updates concorrentes em outros modulos e evita migration adicional nesta fase.

**Alternatives considered**:
- Adicionar coluna `version` em `Pets`: rejeitado por exigir migration e alteracao de contrato sem necessidade imediata.
- Lock pessimista (`SELECT ... FOR UPDATE`): rejeitado por maior complexidade e potencial de contencao.
- Last-write-wins sem token: rejeitado por risco de sobrescrita silenciosa.

### 4. Validacao de payload PATCH com Zod/Fastify

**Decision**: Definir body schema como `z.strictObject(...)` com whitelist dos campos permitidos (`name`, `species`, `breed`, `birthDate`, `sex`, `observations`, `expectedUpdatedAt`) e regra de no minimo um campo de atualizacao de dominio (alem do token de concorrencia).

**Rationale**: A spec exige `400` para campos nao permitidos e payload sem campos validos; `strictObject` impede descarte silencioso de chaves desconhecidas.

**Alternatives considered**:
- `z.object` nao estrito + sanitizacao em service: rejeitado por poder ocultar erro de contrato.
- Usar `422` para payload invalido: rejeitado porque a spec fixa `400` para esses cenarios.

### 5. Autorizacao por vinculo User-Pet

**Decision**: No service, manter regra de autorizacao por vinculo existente: permitir update quando `userId === pet.primaryTutorId` ou quando `CareRelation.status === ACTIVE`; caso contrario, retornar `403 Forbidden`.

**Rationale**: Regra de dominio pertence ao service e ja existe padrao consolidado no modulo `pets`, preservando consistencia entre endpoints do recurso.

**Alternatives considered**:
- Empurrar regra de autorizacao para repositorio: rejeitado por violar separacao de responsabilidades.
- Retornar `404` para usuario sem acesso: rejeitado porque a spec explicitou `403` para pet existente sem permissao.

### 6. Mapeamento de erros estavel

**Decision**: Usar envelope padrao do projeto para todos os erros da rota:
- `400 BAD_REQUEST`: `petId` invalido, payload vazio, campos nao permitidos;
- `403 FORBIDDEN`: sem permissao em pet existente;
- `404 RESOURCE_NOT_FOUND`: pet inexistente;
- `409 CONFLICT`: conflito de concorrencia otimista.

**Rationale**: Alinha com o `error-handler` central e com os codigos estaveis consumiveis por clientes definidos pela constituicao.

**Alternatives considered**:
- Codigos de erro custom por rota fora do padrao global: rejeitado por aumentar acoplamento client-servidor.
- Expor stack/details internos em producao: rejeitado por regra de seguranca.

### 7. Observabilidade e logging

**Decision**: Registrar tentativa e resultado do PATCH com `request.log` incluindo `traceId` (`request.id`) e `context` fixo (ex.: `pets.updateById`), sem logar payload bruto completo.

**Rationale**: Cumpre requisito FR-010 e evita vazamento de dados sensiveis ou excesso de ruido em logs.

**Alternatives considered**:
- Nao logar sucesso/erro de dominio: rejeitado por reduzir rastreabilidade operacional.
- Logar `req.body` integral: rejeitado por risco de exposicao de dados e acoplamento ao contrato.

### 8. Compatibilidade de nomenclatura `observations` x `notes`

**Decision**: Aceitar `observations` no contrato da nova rota e normalizar internamente para a coluna `notes` de `Pets`, mantendo resposta no shape atual de `petSchema` (`notes`).

**Rationale**: Preserva compatibilidade com o modelo persistido e com respostas atuais do modulo, sem alterar schema de banco.

**Alternatives considered**:
- Mudar banco e responses para `observations`: rejeitado por aumento de escopo e risco de impacto transversal.
- Ignorar `observations` e exigir somente `notes`: rejeitado por divergencia da clarificacao da spec.
