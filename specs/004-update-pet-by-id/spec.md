# Feature Specification: Atualização de Dados de Pet por ID

**Feature Branch**: `004-update-pet-by-id`
**Created**: 2026-04-07
**Status**: Draft
**Input**: User description: "Quero adicionar uma rota de update dos dados dos pets por ID"

## Clarifications

### Session 2026-04-07

- Q: Qual status HTTP deve ser retornado quando o pet existe, mas o usuario autenticado nao tem permissao de atualizacao? -> A: Retornar `403 Forbidden`.
- Q: Qual verbo e rota HTTP devem representar a atualizacao parcial de pet por ID? -> A: `PATCH /v1/pets/:id`.
- Q: Quais campos cadastrais do pet sao permitidos no payload de atualizacao parcial? -> A: `name`, `species`, `breed`, `birthDate`, `sex`, `observations`.
- Q: Qual status HTTP usar para ID invalido, payload sem campos permitidos e tentativa de atualizar campos nao permitidos? -> A: `400 Bad Request`.
- Q: Como tratar edicoes concorrentes no mesmo pet? -> A: Exigir controle otimista (versao/`updatedAt`) e retornar `409 Conflict` em caso de conflito.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Atualizar cadastro do pet (Priority: P1)

Um tutor com permissão edita os dados cadastrais de um pet específico para manter as informações corretas e atuais.

**Why this priority**: Esse é o objetivo central da solicitação e habilita manutenção contínua dos dados do pet sem recriação de cadastro.

**Independent Test**: Pode ser testado isoladamente enviando uma atualização válida para um pet existente com usuário autorizado e verificando retorno de sucesso com os dados atualizados.

**Acceptance Scenarios**:

1. **Given** um pet existente e um usuário autorizado, **When** o usuário envia uma atualização válida por ID, **Then** o sistema salva os novos dados e retorna sucesso com os dados atualizados.
2. **Given** um pet existente e um usuário autorizado, **When** o usuário envia atualização parcial de campos permitidos, **Then** apenas os campos enviados são alterados e os demais permanecem inalterados.

---

### User Story 2 - Proteger atualização indevida (Priority: P2)

Um usuário sem vínculo com o pet tenta alterar os dados e o sistema deve bloquear a operação para proteger a privacidade e a integridade das informações.

**Why this priority**: Segurança e controle de acesso são essenciais para evitar alterações não autorizadas.

**Independent Test**: Pode ser testado isoladamente executando a mesma atualização com usuário sem permissão e verificando retorno de acesso negado sem alteração no cadastro.

**Acceptance Scenarios**:

1. **Given** um pet existente e um usuário sem permissão, **When** ele tenta atualizar os dados do pet por ID, **Then** o sistema retorna `403 Forbidden` e não altera os dados do pet.
2. **Given** um ID inexistente, **When** um usuário autorizado tenta atualizar dados, **Then** o sistema informa que o recurso não foi encontrado.

---

### Edge Cases

- O que acontece quando o identificador do pet é inválido? O sistema retorna `400 Bad Request` e não processa alteração.
- O que acontece quando o payload não contém nenhum campo permitido para atualização? O sistema retorna `400 Bad Request` informando que não há dados válidos para atualizar.
- O que acontece quando o usuário tenta atualizar campos sensíveis ou não permitidos? O sistema retorna `400 Bad Request`, rejeita a solicitação e mantém dados protegidos intactos.
- O que acontece quando outro usuário atualiza o mesmo pet entre leitura e gravação? O sistema detecta conflito por controle otimista (versão/`updatedAt`) e retorna `409 Conflict`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar atualização de dados de pet por identificador.
- **FR-002**: O sistema MUST permitir atualização apenas para usuários autenticados com permissão sobre o pet.
- **FR-011**: O sistema MUST retornar `403 Forbidden` quando o usuário estiver autenticado, mas sem vínculo/permissão para atualizar o pet existente.
- **FR-003**: O sistema MUST validar o identificador do pet antes de processar a atualização.
- **FR-004**: O sistema MUST informar recurso não encontrado quando o pet informado não existir.
- **FR-005**: O sistema MUST aceitar atualização parcial apenas dos campos `name`, `species`, `breed`, `birthDate`, `sex` e `observations`.
- **FR-006**: O sistema MUST impedir atualização de campos sensíveis, relacionais ou de auditoria.
- **FR-007**: O sistema MUST retornar a representação atualizada do pet após atualização bem-sucedida.
- **FR-008**: O sistema MUST manter inalterados os campos não enviados na solicitação.
- **FR-009**: O sistema MUST rejeitar payload inválido com mensagem de erro clara e estável para clientes.
- **FR-010**: O sistema MUST registrar a tentativa e o resultado da atualização com identificador de rastreio da solicitação.
- **FR-012**: O sistema MUST expor a atualização parcial de pet no endpoint `PATCH /v1/pets/:id`.
- **FR-013**: O sistema MUST retornar `400 Bad Request` para identificador inválido, payload sem campos permitidos e tentativa de atualização de campos não permitidos.
- **FR-014**: O sistema MUST exigir controle otimista na atualização (por versão ou `updatedAt`) e retornar `409 Conflict` quando detectar conflito de concorrência.

### Key Entities *(include if feature involves data)*

- **Pet**: Representa o cadastro do animal com seus dados de identificação e perfil (ex.: nome, espécie, raça, data de nascimento, sexo e observações).
- **User**: Representa o ator autenticado que executa a atualização, sujeito a regras de permissão sobre o pet.
- **Care Relation**: Representa o vínculo de acesso entre usuário e pet que define se a atualização é autorizada.

## Assumptions

- A atualização é de caráter parcial, mantendo o valor atual para campos não enviados.
- A feature não altera contratos existentes de leitura/criação de pets; apenas adiciona capacidade de atualização no mesmo domínio.
- Campos de identidade do recurso, vínculos de tutela e dados de auditoria não fazem parte do escopo de atualização desta feature.

## Dependencies

- Existência de mecanismo de autenticação e identificação do usuário solicitante.
- Disponibilidade de regra de autorização baseada em vínculo entre usuário e pet.
- Existência de rastreio de requisição para correlação em logs de auditoria.

## Out of Scope

- Cadastro, remoção ou transferência de vínculo de tutela entre usuários e pets.
- Alteração de dados sensíveis de autenticação de usuários.
- Mudanças em funcionalidades de leitura que já existem no domínio de pets.

## Constitution Alignment *(mandatory)*

### Architecture and Design Constraints

- **CA-001**: A feature MUST seguir a separação de responsabilidades em `routes -> controller -> service -> repository -> factory`.
- **CA-002**: Regras de autorização e validações de negócio MUST ficar na camada de serviço; acesso a dados MUST ficar na camada de repositório.
- **CA-003**: A solução MUST reutilizar padrões já existentes no módulo de pets, evitando criação de camadas extras sem necessidade.

### API Contract and Versioning Constraints

- **CA-004**: O contrato da funcionalidade MUST definir claramente entradas válidas, respostas de sucesso e respostas de erro.
- **CA-005**: A mudança MUST ser retrocompatível com a versão atual do produto, pois adiciona nova capacidade sem quebrar contratos existentes.
- **CA-006**: A funcionalidade MUST manter consistência de contrato com os demais recursos de pets e semântica de resposta coerente.

### Quality and Testing Constraints

- **CA-007**: A feature MUST incluir testes unitários cobrindo validações de negócio e autorização de atualização.
- **CA-008**: A feature MUST incluir testes de integração cobrindo fluxo de sucesso, acesso negado, payload inválido e pet inexistente.
- **CA-009**: A entrega MUST passar pelos gates de typecheck, lint, testes e meta mínima de cobertura de 80%.

### Security and Observability Constraints

- **CA-010**: A feature MUST exigir autenticação, aplicar controle de permissão por pet e evitar retorno de dados sensíveis.
- **CA-011**: Erros MUST seguir contrato estável com código e mensagem consumíveis por cliente, incluindo identificador de rastreio para correlação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% das atualizações válidas de cadastro de pet são concluídas com sucesso na primeira tentativa do usuário autorizado.
- **SC-002**: 100% das tentativas de atualização por usuários sem permissão são bloqueadas sem alteração de dados.
- **SC-003**: 100% das solicitações com identificador inválido, payload inválido ou pet inexistente retornam erro consistente e compreensível.
- **SC-004**: O tempo médio para um tutor corrigir dados de um pet cai para menos de 1 minuto por operação no fluxo de edição.
