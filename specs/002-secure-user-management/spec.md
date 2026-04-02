# Feature Specification: Gestão Segura de Usuários

**Feature Branch**: `002-secure-user-management`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "A API deve possuir as seguintes rotas de usuário: buscar por ID (rota autenticada), update de dados do usuário (apenas o próprio usuário pode atualizar seus dados ou um usuário super admin), deletar usuário (apenas usuário super admin da plataforma). Também modificar a rota de register atual para autenticar o usuário imediatamente e devolver token."

## Clarifications

### Session 2026-04-01

- Q: Qual a política de exclusão de usuário no endpoint de delete? → A: Exclusão física (hard delete), removendo o registro do banco.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro com acesso imediato (Priority: P1)

Como novo usuário da plataforma, quero concluir o cadastro e já receber autenticação válida para entrar na área protegida sem precisar fazer login novamente.

**Why this priority**: Remove fricção no onboarding e reduz abandono logo após o cadastro.

**Independent Test**: Criar uma conta nova com dados válidos e confirmar que a resposta do cadastro já inclui token utilizável para acessar endpoint protegido.

**Acceptance Scenarios**:

1. **Given** um visitante sem conta, **When** ele envia dados válidos de cadastro, **Then** a conta é criada e o retorno inclui token de autenticação ativo.
2. **Given** um usuário recém-cadastrado com token recebido no cadastro, **When** ele chama uma rota protegida, **Then** o acesso é autorizado sem necessidade de novo login.
3. **Given** tentativa de cadastro com identificador já existente, **When** o cadastro é enviado, **Then** o sistema rejeita a criação e não emite token.

---

### User Story 2 - Consulta de usuário por ID autenticada (Priority: P2)

Como usuário autenticado, quero buscar dados de usuário por ID para consultar informações cadastrais permitidas pelo sistema.

**Why this priority**: A consulta por ID suporta fluxos administrativos e de perfil, habilitando leitura consistente dos dados de usuário.

**Independent Test**: Autenticar um usuário, consultar um ID válido e validar retorno de dados permitidos; repetir com token inválido e confirmar bloqueio.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** ele consulta um ID de usuário existente, **Then** o sistema retorna os dados permitidos para aquele contexto de acesso.
2. **Given** uma requisição sem autenticação válida, **When** a consulta por ID é realizada, **Then** o sistema retorna erro de não autenticado.
3. **Given** um ID inexistente, **When** a consulta é realizada com autenticação válida, **Then** o sistema retorna recurso não encontrado.

---

### User Story 3 - Atualização de dados com autorização correta (Priority: P1)

Como usuário da plataforma, quero atualizar meus próprios dados; como super admin, quero poder atualizar dados de qualquer usuário quando necessário.

**Why this priority**: Garante autonomia para manutenção de perfil e atende necessidades operacionais da administração sem abrir brechas de segurança.

**Independent Test**: Executar atualização com três perfis (próprio usuário, super admin e terceiro sem privilégio) e validar que apenas os dois primeiros têm sucesso.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** ele atualiza o próprio cadastro, **Then** a atualização é aplicada com sucesso.
2. **Given** um super admin autenticado, **When** ele atualiza dados de outro usuário, **Then** a atualização é aplicada com sucesso.
3. **Given** um usuário autenticado sem privilégio administrativo, **When** ele tenta atualizar dados de outro usuário, **Then** o sistema retorna erro de permissão.

---

### User Story 4 - Exclusão restrita a super admin (Priority: P2)

Como administrador da plataforma, quero que apenas super admins possam excluir usuários para evitar remoções indevidas.

**Why this priority**: Exclusão de usuário é ação sensível e precisa de controle rígido para reduzir risco operacional e de segurança.

**Independent Test**: Tentar exclusão com super admin e com usuário comum, confirmando sucesso apenas para super admin.

**Acceptance Scenarios**:

1. **Given** um super admin autenticado, **When** ele solicita a exclusão de um usuário existente, **Then** o usuário é removido permanentemente (hard delete).
2. **Given** um usuário autenticado sem papel de super admin, **When** ele solicita a exclusão de um usuário, **Then** o sistema retorna erro de permissão.
3. **Given** um super admin autenticado, **When** ele tenta excluir um usuário inexistente, **Then** o sistema retorna recurso não encontrado.

### Edge Cases

- Tentativa de atualização com corpo vazio ou sem campos permitidos.
- Tentativa de alterar campos sensíveis não autorizados no update (ex.: papel administrativo) por usuário comum.
- Token expirado durante consulta, atualização ou exclusão.
- Conflito de unicidade no update (ex.: e-mail já em uso por outro usuário).
- Exclusão repetida do mesmo usuário em chamadas consecutivas.
- Cadastro concluído com sucesso, mas falha na emissão do token de autenticação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar consulta de usuário por ID em rota autenticada.
- **FR-002**: O sistema MUST rejeitar consulta de usuário por ID quando a autenticação estiver ausente, inválida ou expirada.
- **FR-003**: O sistema MUST retornar resposta de recurso não encontrado quando o ID consultado não existir.
- **FR-004**: O sistema MUST permitir atualização de dados quando o solicitante for o próprio usuário alvo da operação.
- **FR-005**: O sistema MUST permitir atualização de dados de qualquer usuário quando o solicitante tiver papel de super admin.
- **FR-006**: O sistema MUST bloquear atualização quando o solicitante não for o próprio usuário nem super admin.
- **FR-007**: O sistema MUST aplicar whitelist de campos atualizáveis e ignorar ou rejeitar campos não permitidos.
- **FR-008**: O sistema MUST disponibilizar exclusão de usuário somente para solicitantes com papel de super admin.
- **FR-009**: O sistema MUST bloquear exclusão solicitada por usuários sem papel de super admin.
- **FR-010**: O sistema MUST retornar recurso não encontrado para tentativa de exclusão de usuário inexistente.
- **FR-011**: O sistema MUST autenticar automaticamente o usuário após cadastro bem-sucedido e retornar token de autenticação no mesmo fluxo.
- **FR-012**: O sistema MUST preservar os campos já retornados pelo contrato atual de cadastro, adicionando o token sem remover informações existentes.
- **FR-013**: O sistema MUST não retornar dados sensíveis de usuário nas respostas de consulta, atualização, exclusão e cadastro.
- **FR-014**: O sistema MUST retornar erros com código estável, mensagem clara e identificador de rastreio para correlação.
- **FR-015**: O sistema MUST executar exclusão física (hard delete) no endpoint de delete de usuário, removendo o registro persistido.

### Key Entities *(include if feature involves data)*

- **Usuário**: Pessoa cadastrada na plataforma com atributos de identidade e perfil editável.
- **Papel de Acesso**: Classificação de permissão do usuário (incluindo super admin) usada para autorização de update e delete.
- **Sessão Autenticada**: Estado de acesso criado após autenticação bem-sucedida e representado por token de acesso.
- **Solicitação de Atualização de Usuário**: Conjunto de campos permitidos para alteração de cadastro.

## Assumptions

- A autenticação de usuários já existe e continuará sendo o mecanismo padrão para proteger rotas de usuário.
- A consulta por ID retorna apenas dados permitidos pelo contexto de acesso, sem exposição de informações sensíveis.
- A alteração da rota de cadastro é tratada como evolução compatível da versão atual, mantendo os campos existentes e adicionando token no retorno.

## Dependencies

- Disponibilidade do mecanismo atual de emissão e validação de token de autenticação.
- Existência de identificação de papel de super admin para decisões de autorização.
- Consumidores da API preparados para receber campo adicional de token no retorno de cadastro.

## Scope Boundaries

- Inclui apenas operações de consulta por ID, atualização, exclusão de usuário e ajuste do fluxo de cadastro para autoautenticação.
- Não inclui redefinição de senha, recuperação de conta, gerenciamento de sessão em múltiplos dispositivos ou mudanças de política de login.
- Não inclui criação de nova versão de API, desde que o contrato atual de cadastro seja estendido de forma compatível.

## Constitution Alignment *(mandatory)*

### Architecture and Design Constraints

- **CA-001**: A feature MUST respeitar a separação por camadas `routes -> controller -> service -> repository -> factory`.
- **CA-002**: Regras de autorização (próprio usuário vs super admin) MUST residir na camada de serviço e não na camada de persistência.
- **CA-003**: A feature MUST evitar novas camadas ou padrões sem justificativa explícita de simplicidade e manutenção.

### API Contract and Versioning Constraints

- **CA-004**: As rotas alteradas MUST declarar contratos de entrada e saída, incluindo cenários de erro relevantes.
- **CA-005**: A alteração do cadastro MUST manter compatibilidade com `/v1`, preservando campos atuais e adicionando token sem breaking change.
- **CA-006**: As rotas MUST seguir convenções REST com recursos no plural e versionamento em path (`/v1/...`).

### Quality and Testing Constraints

- **CA-007**: A entrega MUST incluir testes unitários para regras de autorização de update e delete.
- **CA-008**: A entrega MUST incluir testes de integração para fluxo de cadastro com retorno de token e rotas autenticadas de usuário.
- **CA-009**: A entrega MUST passar por typecheck, lint, testes e cobertura mínima de 80% conforme pipeline do projeto.

### Security and Observability Constraints

- **CA-010**: A feature MUST impedir exposição de dados sensíveis e MUST persistir apenas campos explicitamente permitidos.
- **CA-011**: A feature MUST usar padrão de erro estável com `error.code`, `message`, `details` e `traceId`, além de logs estruturados com correlação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pelo menos 95% dos novos usuários completam cadastro e acessam uma rota protegida em até 1 minuto sem executar login adicional.
- **SC-002**: 100% das tentativas de atualização por usuário não autorizado (não dono e não super admin) são bloqueadas com resposta de permissão negada.
- **SC-003**: 100% das tentativas de exclusão por usuários sem papel de super admin são bloqueadas.
- **SC-004**: Pelo menos 95% das consultas autenticadas por ID retornam resultado esperado (sucesso ou erro correto) em até 2 segundos sob carga operacional normal.
- **SC-005**: 100% das respostas das rotas de usuário permanecem sem vazamento de dados sensíveis definidos pela política da plataforma.
