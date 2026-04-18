# Data Model: Restrict Pet Species

**Feature**: `005-restrict-pet-species`  
**Phase**: 1 - Design  
**Date**: 2026-04-17

> Nenhuma migration e necessaria para esta feature. O objetivo e restringir valores aceitos em criacao sem alterar schema de banco.

## Entidades de Dominio

### 1. Pet (existente)

| Campo | Tipo | Obrigatorio no create | Regra nesta feature |
|---|---|---|---|
| id | UUID | n/a | Sem alteracao |
| name | string | sim | Sem alteracao |
| species | string | sim | Deve aceitar apenas `Canine` ou `Feline` na criacao |
| breed | string \| null | nao | Sem alteracao |
| birthDate | DateTime \| null | nao | Sem alteracao |
| sex | enum (`MALE` `FEMALE` `UNKNOWN`) \| null | nao | Sem alteracao |
| notes | string \| null | nao | Sem alteracao |
| primaryTutorId | UUID | sim (derivado de auth) | Sem alteracao |
| createdAt | DateTime | n/a | Auditoria |
| updatedAt | DateTime | n/a | Auditoria |

### 2. Species Constraint (novo conceito de dominio)

| Campo | Tipo | Regra |
|---|---|---|
| allowedValues | enum set | `{ Canine, Feline }` |
| appliesTo | string | `POST /v1/pets` |
| mode | string | validacao estrita por valor canonico |

## Modelos de Interface

### 3. CreatePetRequest (atualizado)

| Campo | Tipo | Obrigatorio | Regra |
|---|---|---|---|
| name | string | sim | min 1, max 120 |
| species | enum | sim | somente `Canine` ou `Feline` |
| breed | string | nao | max 80 |
| birthDate | date-time | nao | data valida |
| sex | enum | nao | `MALE` `FEMALE` `UNKNOWN` |
| notes | string | nao | max 2000 |

### 4. CreatePetResult (inalterado)

Retorna entidade `Pet` com mesmo shape atual da API `/v1`, preservando compatibilidade para consumidores existentes.

## Regras de Integridade

- Requisicoes de criacao com `species` fora de `Canine` ou `Feline` devem ser rejeitadas.
- Tentativas invalidas de `species` nao podem resultar em persistencia parcial.
- Valores canonicos sao case-sensitive; variantes como `canine` e `cat` sao invalidas.
- Dados historicos com valores antigos de `species` nao sao alterados por esta feature.

## State Transitions

### Fluxo de criacao de pet

1. **Payload valido com especie permitida**
   - Transicao: valida -> persiste pet -> retorna sucesso.
   - Resultado: `201`.

2. **Payload invalido por especie nao permitida**
   - Transicao: valida -> rejeita request -> nao persiste.
   - Resultado: erro de validacao de requisicao.

3. **Payload invalido por especie ausente/vazia/nula**
   - Transicao: valida -> rejeita request -> nao persiste.
   - Resultado: erro de validacao de requisicao.
