# AGENTS.md - Projeto MyPet

Este documento define o contexto e os padroes obrigatorios para agents que implementam novas funcionalidades no projeto MyPet.

## 1) Objetivo

- Garantir consistencia de arquitetura.
- Garantir qualidade minima de entrega.
- Reduzir regressao e breaking change em contratos da API.

## 2) Stack e fluxo de desenvolvimento

- Runtime: Node.js + TypeScript.
- API: Fastify + Zod (`fastify-type-provider-zod`).
- ORM: Prisma + PostgreSQL.
- Documentacao de API: Swagger + Scalar em `/docs`.
- Fluxo oficial de desenvolvimento: Docker + Docker Compose.
- Interface principal de comandos: `Makefile`.

Comandos principais:
- `make up`
- `make docker-dev`
- `make logs`
- `make migrate`
- `make prisma-generate`
- `make test`
- `make test-coverage`
- `make typecheck` (quando existir no Makefile; caso nao exista, usar `pnpm typecheck`)

## 3) Arquitetura obrigatoria

Toda nova feature deve seguir o mesmo padrao atual:

`routes -> controller -> service -> repository -> factory`

Regras:
- `routes`: definicao de rotas, schemas Zod e delegacao para controller.
- `controller`: orquestracao HTTP (request/reply), sem regra de negocio complexa.
- `service`: regras de negocio e validacoes de dominio.
- `repository`: acesso a dados (Prisma), sem regra de negocio.
- `factory`: composicao das dependencias (injecao manual).

## 3.1) Principios de design (SOLID + DDD com parcimonia)

- Aplicar principios SOLID em novas implementacoes e refactors, principalmente:
  - responsabilidade unica por camada;
  - dependencia de abstracoes (interfaces) entre service e repository;
  - extensao sem modificacoes arriscadas de comportamento existente.
- Usar conceitos de DDD apenas quando fizer sentido para o dominio e sem burocracia desnecessaria.
- Manter o projeto simples: evitar camadas extras, patterns e pastas novas sem ganho claro.
- Nao fazer grandes reorganizacoes estruturais apenas para "ficar mais DDD".
- Priorizar legibilidade, onboarding rapido e manutencao facil.

## 4) Convencoes de nomenclatura

- Entidades em codigo (types, schemas, interfaces): singular.
  - Ex.: `User`, `Pet`, `Medication`, `Appointment`.
- Tabelas no banco: plural.
  - Ex.: `Users`, `Pets`, `Medications`, `Appointments`.
- Rotas REST: plural.
  - Ex.: `/v1/users`, `/v1/pets`.
- Versionamento em path: `/v1/...`.

## 5) Versionamento de API

Criar nova versao (`/v2`) quando houver breaking change para consumidores (mobile/web/sistemas externos), incluindo:
- mudanca em chaves de resposta;
- mudanca de estrutura de payload;
- alteracao de semantica que invalida integracoes existentes.

## 6) Contratos e validacao com Zod

Sempre que aplicavel, as rotas devem declarar schema Zod para:
- `querystring`;
- `params` (path params);
- `body`;
- `response` (todos os status relevantes).

Objetivo: manter contrato tipado e documentacao automatica correta em `/docs`.

## 7) Padrao de erros da API (proposta inicial)

Padrao recomendado para respostas de erro:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Pet not found",
    "details": {},
    "traceId": "req-123"
  }
}
```

Mapeamento sugerido:
- `400 Bad Request`: payload invalido (fora de regras de negocio).
- `401 Unauthorized`: sem autenticacao/credencial invalida.
- `403 Forbidden`: sem permissao para recurso.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: violacao de unicidade/estado conflitante.
- `422 Unprocessable Entity`: regra de negocio nao satisfeita.
- `429 Too Many Requests`: rate limit.
- `500 Internal Server Error`: erro nao tratado.

Regras:
- Nunca vazar stack trace em ambiente produtivo.
- Incluir `traceId` para correlacao em logs.
- `code` deve ser estavel (consumivel por client).

## 8) Prisma, migrations e banco

- Nome de migration deve ser descritivo e explicito.
  - Ex.: `create_column_breed_table_pets`.
- Campos de auditoria devem ser mantidos nas entidades persistidas.
  - Minimo esperado: `createdAt`, `updatedAt` (e `deletedAt` quando aplicavel).
- Soft delete nao e obrigatorio por padrao.
  - So implementar quando solicitado explicitamente.

## 9) Seguranca obrigatoria

- Implementar autenticacao para rotas protegidas (API consumida por mobile/web).
- Aplicar rate limit em endpoints sensiveis e/ou publicos.
- Nunca persistir `req.body` diretamente no banco.
  - Sempre montar objeto de persistencia campo a campo (whitelist).
- Nunca retornar dados sensiveis em responses.
  - Ex.: nao retornar `password`, tokens, segredos.
- Sanitizar/filtrar dados antes de resposta quando necessario.

## 10) Logs estruturados

Todos os fluxos novos devem considerar logs estruturados com, no minimo:
- `timestamp`
- `level`
- `message`
- `traceId` (ou requestId)
- `context` (modulo/acao)

Observacao: Sentry/OTel pode ser adicionado no futuro; manter desenho preparado para evolucao.

## 11) Qualidade minima (gates obrigatorios)

Toda entrega deve passar em:
- typecheck;
- lint;
- testes.

Cobertura minima de testes:
- 80% (global ou por modulo novo, conforme pipeline definida).

Tipos de teste esperados:
- unitarios (services/regras de negocio);
- integracao (repositorios e fluxo com banco/infra controlada).

## 12) Git e colaboracao

- Commits: Conventional Commits.
  - Ex.: `feat: add pets listing endpoint`
- Branches com prefixo de tipo.
  - Ex.: `feat/nome-da-feature`, `chore/nome-da-modificacao`, `fix/nome-do-ajuste`.
- Nao ha template de PR obrigatorio no momento, mas PR deve descrever:
  - objetivo;
  - impacto em contrato;
  - estrategia de testes;
  - riscos e rollback (quando aplicavel).

## 13) Limites de autonomia para agents

Agent deve pedir autorizacao antes de:
- instalar novas dependencias;
- modificar colunas existentes em tabelas;
- modificar chaves/contratos de rotas.

Agent pode seguir sem confirmacao previa para:
- criar novos modulos seguindo padrao vigente;
- criar novos arquivos de schema/controller/service/repository/factory;
- criar testes e refactors sem breaking change de contrato.

## Active Technologies
- Node.js + TypeScript (runtime), Bun 1.x (automated test runner) + Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL, `@fastify/swagger`, `@scalar/fastify-api-reference` (001-gerenciar-historico-pets)
- PostgreSQL (via Prisma ORM) + local file storage in `/Volumes/SSD Externo/Projects/MyPet/storage` behind `StorageProvider` interface (001-gerenciar-historico-pets)
- Node.js + TypeScript (runtime), Bun 1.x (automated test runner) + Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL, custom JWT middleware (`src/lib/auth/jwt.ts`) (002-secure-user-management)

## Recent Changes
- 001-gerenciar-historico-pets: Added Node.js + TypeScript (runtime), Bun 1.x (automated test runner) + Fastify, Zod (`fastify-type-provider-zod`), Prisma, PostgreSQL, `@fastify/swagger`, `@scalar/fastify-api-reference`
