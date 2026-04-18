# Quickstart: Restrict Pet Species

**Feature**: `005-restrict-pet-species`  
**Branch**: `005-restrict-pet-species`

## Pre-requisitos

```bash
make up
make migrate
make prisma-generate
```

## Cenarios de validacao rapida

### 1. Criacao com especie permitida (Canine)

```bash
curl -X POST "http://localhost:3333/v1/pets" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luna",
    "species": "Canine"
  }'
```

Resultado esperado:
- `201 Created`
- pet criado com `species = "Canine"`

### 2. Criacao com especie permitida (Feline)

```bash
curl -X POST "http://localhost:3333/v1/pets" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mia",
    "species": "Feline"
  }'
```

Resultado esperado:
- `201 Created`
- pet criado com `species = "Feline"`

### 3. Criacao com especie invalida

```bash
curl -X POST "http://localhost:3333/v1/pets" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Piu",
    "species": "Bird"
  }'
```

Resultado esperado:
- erro de validacao de request
- nenhum registro novo persistido para a tentativa invalida

## Implementacao por camada

### 1. `src/modules/v1/pets/pets.schemas.ts`

- Definir enum canonico de especie permitida (`Canine`, `Feline`) no schema de criacao.
- Aplicar enum ao campo `species` do `petCreateBodySchema`.
- Manter demais campos e limites existentes.

### 2. `src/modules/v1/pets/pets.service.ts`

- Validar defensivamente regra de especie no fluxo de `createPet` para garantir dominio mesmo fora da entrada HTTP.
- Rejeitar especie invalida sem chamar persistencia.

### 3. `src/modules/v1/pets/pets.routes.ts`

- Manter rota `POST /v1/pets` com autenticacao atual.
- Garantir documentacao da rota refletindo enum permitido no request.

### 4. `src/modules/v1/pets/repositories/prisma-pets.repository.ts`

- Nao alterar modelagem de persistencia.
- Confirmar persistencia field-by-field como whitelist.

## Testes obrigatorios

### Unitarios

Arquivo: `tests/unit/modules/v1/pets/pets.service.spec.ts`

Cobrir pelo menos:
1. `createPet` aceita `Canine`.
2. `createPet` aceita `Feline`.
3. `createPet` rejeita especie invalida (`Bird`) e nao chama repositorio.

### Integracao

Arquivo: `tests/integration/modules/v1/pets/pets.contract.spec.ts`

Cobrir pelo menos:
1. `POST /v1/pets` com `species = Canine` retorna `201`.
2. `POST /v1/pets` com `species = Feline` retorna `201`.
3. `POST /v1/pets` com `species` invalida retorna erro de validacao.
4. Tentativa invalida nao persiste novo pet.

## Validacao final

```bash
make typecheck
make test
make test-coverage
```
