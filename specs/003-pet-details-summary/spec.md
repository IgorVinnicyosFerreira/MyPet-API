# Feature Specification: Pet Details with Health Summary

**Feature Branch**: `003-pet-details-summary`
**Created**: 2026-04-06
**Status**: Draft
**Input**: User description: "Rota de get por id para pets, deverá trazer os dados do pet + o seu último registro de peso, vacinação, consulta, vermifugo, parasitário e dieta."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar resumo completo do pet (Priority: P1)

Um tutor ou cuidador abre o perfil de um pet específico e quer ver, em uma única tela, os dados cadastrais do pet junto com um painel de saúde mostrando o status mais recente de cada categoria de cuidado (peso, vacinação, consulta, vermifugo, parasitário e dieta).

**Why this priority**: É o fluxo central da feature — sem esse endpoint o app móvel/web não consegue montar a tela de detalhe do pet.

**Independent Test**: Pode ser testado de forma isolada realizando um GET `/v1/pets/:petId` com um token válido de um tutor autenticado e verificando se os campos retornados correspondem ao estado do banco.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado que é tutor primário do pet, **When** realiza GET `/v1/pets/:petId`, **Then** recebe 200 com dados do pet e o registro mais recente de cada categoria de saúde; categorias sem registro retornam `null`.
2. **Given** um usuário autenticado que possui `CareRelation` ativa (ACTIVE) para o pet, **When** realiza GET `/v1/pets/:petId`, **Then** recebe 200 com os mesmos dados do cenário anterior.
3. **Given** um usuário autenticado que não tem vínculo algum com o pet, **When** realiza GET `/v1/pets/:petId`, **Then** recebe 403 Forbidden.
4. **Given** um usuário autenticado, **When** realiza GET `/v1/pets/:petId` com um ID inexistente, **Then** recebe 404 Not Found.

---

### User Story 2 - Visualizar pet sem histórico em algumas categorias (Priority: P2)

Um tutor acabou de cadastrar um novo pet e ainda não registrou peso, consulta, vacinas, etc. Ao acessar o detalhe do pet, espera ver os dados cadastrais corretamente, com as categorias sem histórico indicando ausência de registro.

**Why this priority**: Garante que a ausência de registros não cause falha na resposta e que a interface possa exibir "nenhum registro" adequadamente.

**Independent Test**: Pode ser testado criando um pet sem nenhum registro de saúde e verificando que o endpoint retorna os campos de saúde como `null`.

**Acceptance Scenarios**:

1. **Given** um pet sem nenhum registro de saúde cadastrado, **When** o tutor realiza GET `/v1/pets/:petId`, **Then** recebe 200 com dados do pet preenchidos e todos os campos de saúde com valor `null`.
2. **Given** um pet com registros em apenas algumas categorias (ex: peso e vacinação), **When** o tutor realiza GET `/v1/pets/:petId`, **Then** as categorias com registro retornam o mais recente e as sem registro retornam `null`.

---

### Edge Cases

- O que acontece quando o `petId` é um UUID inválido (formato errado)? → Resposta 400 Bad Request por falha de validação de schema Zod.
- O que acontece se houver múltiplos registros de vermifugo e antiparasitário? → Retorna apenas o mais recente pelo campo `appliedAt`.
- Qual registro de dieta é o "último"? → O registro de `FeedingRecords` mais recente pelo campo `startsAt`, independente de estar ativo ou não.
- Um usuário com relação `REVOKED` ou `PENDING` pode acessar? → Não; apenas relações com status `ACTIVE` concedem acesso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema MUST expor rota `GET /v1/pets/:petId` protegida por autenticação.
- **FR-002**: Sistema MUST verificar se o usuário autenticado é o tutor primário do pet ou possui `CareRelation` com status `ACTIVE` para o pet; caso contrário, retornar 403.
- **FR-003**: Sistema MUST retornar 404 quando o `petId` não corresponder a nenhum pet no sistema.
- **FR-004**: Sistema MUST retornar os dados cadastrais completos do pet: `id`, `name`, `species`, `breed`, `birthDate`, `sex`, `notes`, `primaryTutorId`, `createdAt`, `updatedAt`.
- **FR-005**: Sistema MUST retornar o registro mais recente de peso, ordenado por data de medição decrescente; retornar `null` se inexistente.
- **FR-006**: Sistema MUST retornar o registro mais recente de vacinação, ordenado por data de aplicação decrescente; retornar `null` se inexistente.
- **FR-007**: Sistema MUST retornar o registro mais recente de consulta, ordenado por data de ocorrência decrescente; retornar `null` se inexistente.
- **FR-008**: Sistema MUST retornar o registro mais recente de vermifugo (categoria DEWORMER), ordenado por data de aplicação decrescente; retornar `null` se inexistente.
- **FR-009**: Sistema MUST retornar o registro mais recente de parasitário (categoria ANTIPARASITIC), ordenado por data de aplicação decrescente; retornar `null` se inexistente.
- **FR-010**: Sistema MUST retornar o registro mais recente de dieta/alimentação, ordenado por data de início decrescente; retornar `null` se inexistente.
- **FR-011**: Sistema MUST validar que `petId` seja um UUID válido antes de processar a requisição; retornar 400 se inválido.
- **FR-012**: Resposta MUST excluir campos internos de auditoria desnecessários na visão do cliente (ex: `createdByUserId` dos registros de saúde não deve ser exposto). Todos os demais campos públicos de cada registro de saúde MUST ser retornados dentro de `healthSummary`.

### Key Entities

- **Pet**: Entidade principal; contém dados de identificação e cadastro do animal (nome, espécie, raça, data de nascimento, sexo, notas).
- **WeightRecord**: Representa um registro de peso; o mais recente é determinado pela data de medição.
- **Vaccination**: Representa uma aplicação de vacina; o mais recente é determinado pela data de aplicação; inclui nome da vacina, veterinário e próxima dose.
- **Consultation**: Representa uma consulta veterinária; a mais recente é determinada pela data de ocorrência; inclui nome da clínica e do veterinário.
- **SanitaryRecord (Dewormer)**: Registro de vermifugo; o mais recente é determinado pela data de aplicação; inclui nome do produto e próxima aplicação.
- **SanitaryRecord (Antiparasitic)**: Registro de parasitário; o mais recente é determinado pela data de aplicação; inclui nome do produto e próxima aplicação.
- **FeedingRecord**: Representa um plano alimentar; o mais recente é determinado pela data de início; inclui tipo de alimentação e descrição.

## Clarifications

### Session 2026-04-06

- Q: A resposta JSON deve aninhar os dados de saúde sob uma chave dedicada ou misturar com os campos do pet no mesmo nível? → A: Dados de saúde aninhados sob `healthSummary` — ex: `{ id, name, ..., healthSummary: { lastWeight: {...}, lastVaccination: {...}, ... } }`
- Q: Quais campos retornar de cada registro de saúde dentro de `healthSummary`? → A: Todos os campos públicos do registro (exceto campos internos bloqueados por FR-012, como `createdByUserId`)
- Q: Deve-se aplicar rate limiting neste endpoint GET autenticado? → A: Sim, aplicar rate limiting por rota seguindo o mesmo padrão dos endpoints protegidos existentes
- Q: Qual o alvo mensurável de performance para SC-002 ("percebida como instantânea")? → A: p95 < 300ms

## Constitution Alignment *(mandatory)*

### Architecture and Design Constraints

- **CA-001**: Feature MUST mapear responsabilidades em `routes -> controller -> service -> repository -> factory`; a lógica de busca dos últimos registros reside no service e a consulta ao banco no repository.
- **CA-002**: Regras de acesso (verificação de tutor primário ou care relation ativa) MUST ser implementadas na camada de service; o repository permanece somente de persistência.
- **CA-003**: Nenhum novo pattern ou camada adicional é necessário; seguir a estrutura do módulo `pets` já existente em `src/modules/v1/pets/`.

### API Contract and Versioning Constraints

- **CA-004**: Rota MUST declarar schema Zod para `params` (`petId` como UUID) e `response` (200 com objeto tipado, 403 e 404 com objeto de erro padrão); não há `querystring` nem `body`. O objeto de resposta 200 MUST ter os dados cadastrais do pet no nível raiz e os dados de saúde aninhados sob a chave `healthSummary`.
- **CA-005**: A mudança é retrocompatível com `/v1` pois adiciona um endpoint novo (`GET /v1/pets/:petId`) que ainda não existe; não há breaking change nem necessidade de `/v2`.
- **CA-006**: Rota segue convenções REST: `/v1/pets/:petId`, método GET, status 200 para sucesso, 403 para acesso negado, 404 para recurso inexistente, 400 para payload inválido.

### Quality and Testing Constraints

- **CA-007**: Testes unitários obrigatórios:
  - Service: verifica acesso concedido para tutor primário.
  - Service: verifica acesso concedido para care relation com status ACTIVE.
  - Service: verifica acesso negado para usuário sem vínculo (retorna 403).
  - Service: verifica acesso negado para care relation com status REVOKED ou PENDING.
  - Service: verifica 404 quando pet não existe.
  - Service: verifica que retorna `null` para categorias sem registro.
  - Service: verifica que retorna o registro mais recente (e não o mais antigo) para cada categoria.
- **CA-008**: Testes de integração obrigatórios:
  - Fluxo completo com banco real: GET retorna 200 com todos os campos esperados e corretos.
  - Fluxo com pet sem histórico: todos os campos de saúde retornam `null`.
  - Fluxo com usuário sem vínculo: retorna 403.
  - Fluxo com petId inexistente: retorna 404.
  - Fluxo com petId inválido (não UUID): retorna 400.
- **CA-009**: Quality gates: typecheck, lint, testes e cobertura >= 80% no módulo.

### Security and Observability Constraints

- **CA-010**: Rota MUST exigir autenticação via JWT (mesmo middleware já utilizado em outras rotas do módulo pets); verificação de propriedade ou care relation ativa antes de retornar dados; nenhum dado sensível (`createdByUserId`, tokens, hashes) deve aparecer na resposta. Rate limiting MUST ser aplicado por rota seguindo o padrão dos demais endpoints protegidos do módulo.
- **CA-011**: Erros MUST seguir o padrão `{ error: { code, message, traceId } }`; logs estruturados com `timestamp`, `level`, `message`, `traceId` e `context: "pets.getById"`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário autenticado com acesso ao pet consegue visualizar o resumo completo em uma única requisição, sem necessidade de múltiplas chamadas à API.
- **SC-002**: A resposta é entregue em p95 < 300ms em condições normais de uso da aplicação móvel/web.
- **SC-003**: 100% dos cenários de acesso indevido (usuário sem vínculo, relação revogada ou pendente) resultam em respostas 403 — nenhum dado de pet é vazado para usuários não autorizados.
- **SC-004**: A ausência de registros em qualquer categoria de saúde não causa falha na requisição; o campo correspondente retorna `null` com status 200.
- **SC-005**: Cobertura de testes do módulo >= 80%, garantindo que os fluxos principais e os edge cases sejam verificados automaticamente em cada build.
