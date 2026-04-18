# Feature Specification: Restrict Pet Species

**Feature Branch**: `005-restrict-pet-species`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "Na rota de criar pet nao temos um enum com a lista de especies permitidas, assim qualquer coisa pode ser informada nesse campo, crie um enum inicialmente permitindo caes e gatos (Canine e Feline) para restringer os valores do campo de especie"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar pet com especie permitida (Priority: P1)

Como usuario autenticado, quero cadastrar um pet informando uma especie valida para que o registro seja aceito sem retrabalho.

**Why this priority**: Esse e o fluxo principal de valor da feature, pois garante que o cadastro funcional continue disponivel para especies suportadas.

**Independent Test**: Pode ser testado enviando uma requisicao de criacao de pet com todos os campos validos e `species` igual a `Canine` ou `Feline`, confirmando que o cadastro e criado com sucesso.

**Acceptance Scenarios**:

1. **Given** um payload valido de criacao de pet com `species` igual a `Canine`, **When** o usuario envia a requisicao, **Then** o pet e criado com resposta de sucesso.
2. **Given** um payload valido de criacao de pet com `species` igual a `Feline`, **When** o usuario envia a requisicao, **Then** o pet e criado com resposta de sucesso.

---

### User Story 2 - Bloquear especie nao permitida (Priority: P1)

Como usuario autenticado, quero receber um erro claro ao informar uma especie nao suportada para corrigir o cadastro antes de persistir dados inconsistentes.

**Why this priority**: Evita inconsistencias no dominio de pets e impede gravacao de valores livres que quebram padronizacao e relatorios.

**Independent Test**: Pode ser testado enviando uma requisicao de criacao de pet com `species` fora da lista permitida e validando retorno de erro sem persistencia.

**Acceptance Scenarios**:

1. **Given** um payload valido exceto por `species` igual a `Bird`, **When** o usuario envia a requisicao, **Then** a API retorna erro de validacao e o pet nao e criado.
2. **Given** um payload valido exceto por `species` igual a valor vazio ou nulo, **When** o usuario envia a requisicao, **Then** a API retorna erro de payload invalido e o pet nao e criado.

---

### User Story 3 - Consumidor entender valores aceitos (Priority: P2)

Como consumidor da API, quero visualizar claramente os valores permitidos para especie para evitar tentativas invalidas de integracao.

**Why this priority**: Reduz erros de integracao e retrabalho de suporte ao explicitar o contrato permitido.

**Independent Test**: Pode ser testado consultando a documentacao da rota de criacao e verificando que os valores aceitos de `species` estao explicitamente definidos.

**Acceptance Scenarios**:

1. **Given** um consumidor consultando a documentacao da rota de criacao de pets, **When** ele verifica o campo `species`, **Then** ele encontra exatamente os valores `Canine` e `Feline` como opcoes validas.

### Edge Cases

- O sistema deve rejeitar variacoes fora do valor canonico, como `canine`, `DOG` ou `cat`, quando nao corresponderem exatamente aos valores permitidos.
- O sistema deve manter comportamento de erro previsivel mesmo quando o campo `species` vier junto de outros campos invalidos no mesmo payload.
- O sistema nao deve alterar registros antigos com especies ja persistidas; a restricao vale para novas tentativas de criacao.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST aceitar na criacao de pet apenas os valores de especie `Canine` e `Feline`.
- **FR-002**: O sistema MUST rejeitar qualquer valor de especie fora da lista permitida com resposta de erro de requisicao invalida.
- **FR-003**: O sistema MUST rejeitar criacao de pet quando `species` estiver ausente, vazio ou nulo.
- **FR-004**: O sistema MUST manter o contrato de resposta de sucesso da criacao de pet sem breaking change para clientes `/v1`.
- **FR-005**: O sistema MUST explicitar no contrato da rota e na documentacao que `species` e restrito aos valores permitidos.
- **FR-006**: O sistema MUST garantir que nenhuma tentativa invalida de `species` seja persistida.

### Key Entities *(include if feature involves data)*

- **Pet**: Entidade de cadastro do animal, que inclui o atributo `species` como classificacao obrigatoria no fluxo de criacao.
- **Species Constraint**: Regra de dominio que define o conjunto fechado de especies aceitas no cadastro (`Canine`, `Feline`).

### Assumptions

- A feature aplica-se somente ao endpoint de criacao de pets na versao `/v1`.
- Os valores canonicos exigidos para especie sao exatamente `Canine` e `Feline`.
- Nao ha necessidade de migrar dados historicos nesta entrega.

## Constitution Alignment *(mandatory)*

### Architecture and Design Constraints

- **CA-001**: A implementacao MUST seguir `routes -> controller -> service -> repository -> factory` para a alteracao da regra de criacao.
- **CA-002**: A validacao de regra de negocio de especie MUST permanecer na camada de service e/ou contrato da rota, sem logica de negocio na camada de repositorio.
- **CA-003**: Nao MUST introduzir novas camadas ou patterns; a mudanca deve reutilizar a estrutura existente por simplicidade.

### API Contract and Versioning Constraints

- **CA-004**: O contrato da rota MUST declarar schema para request/response com o campo `species` restrito aos valores permitidos.
- **CA-005**: A mudanca MUST ser backward compatible com `/v1`, sem necessidade de criar `/v2`.
- **CA-006**: A rota MUST manter convencoes REST e versionamento atual (`/v1/pets`).

### Quality and Testing Constraints

- **CA-007**: Devem existir testes unitarios cobrindo casos de especie valida e invalida no fluxo de regra de negocio.
- **CA-008**: Devem existir testes de integracao cobrindo o endpoint de criacao com respostas de sucesso e erro para `species`.
- **CA-009**: A entrega MUST passar em typecheck, lint, testes e cobertura minima de 80% conforme pipeline.

### Security and Observability Constraints

- **CA-010**: A feature MUST preservar exigencias de autenticacao existentes para criacao de pets e nao expor dados sensiveis adicionais.
- **CA-011**: Respostas de erro MUST manter padrao estavel de erro com rastreabilidade por `traceId` e log estruturado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das requisicoes de criacao com `species` igual a `Canine` ou `Feline` sao aceitas na validacao de especie (considerando demais campos validos).
- **SC-002**: 100% das requisicoes de criacao com `species` fora da lista permitida retornam erro de validacao e nao criam registro.
- **SC-003**: A documentacao da API apresenta explicitamente os dois valores permitidos de `species`, eliminando ambiguidade para integradores.
- **SC-004**: Apos a entrega, a taxa de novos registros com especie fora do dominio permitido cai para 0%.
