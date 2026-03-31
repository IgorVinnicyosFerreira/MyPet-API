# Feature Specification: API de Histórico e Cuidados de Pets

**Feature Branch**: `001-gerenciar-historico-pets`
**Created**: 2026-03-11
**Status**: Draft
**Input**: User description: "API para app móvel e web com gestão completa de histórico de pets, medicação, compartilhamento de cuidado e carteira digital do pet."

## Clarifications

### Session 2026-03-13

- Q: Qual regra de autorização devemos fixar para edição/exclusão de registros clínicos (alimentação, peso, consultas, exames, vacinas e vermífugos)? → A: Co-tutor pode criar/editar, mas não excluir registros clínicos; cuidador só registra doses/anotações.
- Q: Quando uma dose for registrada com horário anterior à última dose confirmada, qual regra deve valer? → A: Aceitar como registro retroativo sem recalcular automaticamente a próxima dose.
- Q: Qual formato de resposta a API deve adotar para emissão da carteira digital do pet? → A: Retornar somente JSON estruturado (sem arquivo/PDF).
- Q: O cadastro de medicamentos deve ser de escopo global ou por responsável? → A: Catálogo híbrido (base global + itens customizados por tutor).
- Q: Para evitar sobrescrita silenciosa, qual política devemos adotar em edições concorrentes do mesmo registro? → A: Optimistic locking com versão/updatedAt e retorno de 409 em conflito.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Histórico Clínico Completo do Pet (Priority: P1)

Como tutor principal, quero cadastrar meus pets e manter seu histórico de saúde
(alimentação, peso, consultas, exames, vacinas, vermífugos e antiparasitários)
para acompanhar a evolução clínica do animal em um único lugar.

**Why this priority**: Este é o núcleo do produto e habilita todo o restante do fluxo
(cuidados contínuos, lembretes, compartilhamento e carteira digital).

**Independent Test**: Cadastrar um pet, registrar eventos de alimentação, peso,
consulta, exame e vacinação, e confirmar que o histórico permanece consultável em
ordem temporal mesmo após atualizações.

**Acceptance Scenarios**:

1. **Given** um tutor autenticado sem pets cadastrados, **When** ele cadastra um pet,
   **Then** o pet passa a aparecer na lista de pets do tutor.
2. **Given** um pet com dieta ativa, **When** o tutor registra mudança de alimentação,
   **Then** a dieta anterior é preservada no histórico e a nova dieta passa a ser a ativa.
3. **Given** registros de peso em datas diferentes, **When** o histórico é consultado,
   **Then** os pontos de peso retornam em sequência cronológica para visualização em gráfico.
4. **Given** uma consulta registrada, **When** o tutor adiciona anotações clínicas,
   **Then** as anotações ficam vinculadas à consulta no histórico.
5. **Given** um exame ou vacina com comprovante, **When** o arquivo é enviado,
   **Then** o registro mantém o anexo e as anotações relacionadas.

---

### User Story 2 - Rotina de Medicação e Lembretes (Priority: P2)

Como tutor ou co-tutor, quero cadastrar receitas e horários de medicamentos,
receber lembretes e registrar doses aplicadas para manter a rotina terapêutica correta.

**Why this priority**: Erros de medicação impactam diretamente a saúde do pet;
alertas e cálculo automático da próxima dose reduzem esquecimentos.

**Independent Test**: Cadastrar receita com dosagem e frequência, ativar lembrete,
marcar uma dose como tomada e validar cálculo automático do próximo horário e lista
"próximos horários do dia" para widgets.

**Acceptance Scenarios**:

1. **Given** um medicamento cadastrado, **When** o tutor cria uma receita com dosagem,
   frequência e início, **Then** o plano terapêutico é salvo e habilita lembretes.
2. **Given** um lembrete ativo de medicamento, **When** uma dose é marcada como tomada,
   **Then** o próximo horário é recalculado automaticamente.
3. **Given** múltiplas receitas ativas no mesmo dia, **When** o front consulta
   próximos horários, **Then** recebe uma lista ordenada por horário para exibir em widget.

---

### User Story 3 - Compartilhamento de Cuidado e Carteira Digital (Priority: P3)

Como tutor principal, quero compartilhar o cuidado do pet com co-tutor e cuidador,
com permissões distintas, e emitir uma carteira digital com histórico sanitário.

**Why this priority**: O cuidado de pets é frequentemente compartilhado; controle de
acesso e visão consolidada fortalecem continuidade e segurança do tratamento.

**Independent Test**: Convidar co-tutor e cuidador para um pet, validar permissões
por perfil e gerar carteira digital contendo vacinação, vermífugos e antiparasitários.

**Acceptance Scenarios**:

1. **Given** um tutor principal, **When** ele adiciona um co-tutor,
   **Then** o co-tutor passa a acessar todo o histórico, exceto exclusão do pet.
2. **Given** um cuidador vinculado ao pet, **When** ele acessa o sistema,
   **Then** pode registrar consumo de medicamentos e anotações, sem alterar dados críticos.
3. **Given** histórico sanitário preenchido, **When** o usuário solicita carteira digital,
   **Then** o sistema retorna um JSON estruturado com os registros exigidos.

---

### Edge Cases

- Registro de dose fora de sequência deve ser aceito como retroativo, sem recalcular automaticamente a próxima dose.
- Mudança de dieta sem data de início explícita.
- Upload de comprovante inválido (formato diferente de imagem/PDF) em exames/vacinas.
- Tentativa de cuidador executar ação sem permissão (ex.: exclusão de pet).
- Tentativa de co-tutor excluir um registro clínico.
- Edição concorrente do mesmo registro clínico por dois usuários ao mesmo tempo.
- Vacina registrada sem data de reforço definida no momento do cadastro.
- Pet sem registros de peso suficientes para análise de evolução.
- Prescrição com dosagem do tipo "outros" sem descrição complementar.
- Tentativa de autenticação com senha inválida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir cadastro de pets independentemente da espécie.
- **FR-002**: O sistema MUST listar pets por usuário responsável.
- **FR-003**: O sistema MUST permitir registro de alimentação por pet, incluindo ração
  e alimentação natural.
- **FR-004**: O sistema MUST preservar histórico de dietas anteriores quando houver mudança.
- **FR-005**: O sistema MUST permitir registro histórico de peso com data e hora da medição.
- **FR-006**: O sistema MUST permitir registro de consultas com campo de anotações.
- **FR-007**: O sistema MUST permitir registro de exames com um ou mais anexos em
  PDF e/ou imagem e anotações livres.
- **FR-008**: O sistema MUST permitir registro de vacinação com comprovante (imagem/PDF),
  identificação do veterinário, possibilidade de data de próxima dose/reforço e lembrete.
- **FR-009**: O sistema MUST permitir registro histórico de vermífugos e antiparasitários,
  com suporte a lembrete de próximas aplicações.
- **FR-010**: O sistema MUST permitir cadastro de medicamentos sem dosagem/frequência,
  mantendo dosagem e frequência exclusivamente na receita, com catálogo híbrido
  (base global e itens customizados por tutor).
- **FR-011**: O sistema MUST permitir criação de receita vinculando medicamentos já
  existentes no sistema ou cadastrando vínculo equivalente para uso na rotina.
- **FR-012**: O sistema MUST aceitar dosagem em fração de comprimido, gotas, ml,
  unidades e tipo "outros" com descrição obrigatória.
- **FR-013**: O sistema MUST aceitar frequência em múltiplas unidades de tempo
  (horas, dias, semanas e equivalentes).
- **FR-014**: O sistema MUST permitir ativar e desativar lembretes de medicação.
- **FR-015**: O sistema MUST calcular automaticamente o próximo horário de dose após
  marcação de medicamento como tomado, exceto quando a dose for lançada com horário
  retroativo (anterior à última dose confirmada).
- **FR-016**: O sistema MUST disponibilizar agenda diária de próximos horários de
  medicação para suporte a widgets no front-end.
- **FR-017**: O sistema MUST permitir compartilhamento do pet com perfis distintos:
  tutor principal, co-tutor e cuidador.
- **FR-018**: O sistema MUST aplicar permissões por perfil, garantindo que co-tutor não
  exclua o pet nem registros clínicos, podendo criar/editar registros clínicos, e que
  cuidador atue somente em consumo de medicamentos e anotações.
- **FR-019**: O sistema MUST permitir emissão de carteira digital do pet com histórico
  de vacinação, vermífugos e antiparasitários retornando somente JSON estruturado.
- **FR-020**: O sistema MUST manter histórico cronológico consultável para todos os
  eventos clínicos e sanitários do pet.
- **FR-021**: O sistema MUST permitir autenticação de usuário por credenciais
  (email + senha) para consumir endpoints protegidos.
- **FR-022**: O sistema MUST aplicar optimistic locking em atualizações de registros
  clínicos e de receita, retornando `409 Conflict` em caso de edição concorrente.

### Key Entities *(include if feature involves data)*

- **Usuário**: Pessoa com acesso ao sistema, autenticada por email e senha,
  com papéis de tutor principal, co-tutor ou cuidador.
- **Pet**: Animal de estimação associado a um tutor principal e, opcionalmente,
  a outros cuidadores autorizados.
- **Relação de Cuidado**: Vínculo entre usuário e pet com papel e permissões.
- **Registro de Alimentação**: Evento de dieta com tipo, descrição, período de vigência
  e status (ativo/histórico).
- **Registro de Peso**: Medição de peso com data/hora para análise evolutiva.
- **Consulta**: Registro de atendimento clínico com anotações.
- **Exame**: Registro com tipo, data, anotações e múltiplos anexos (imagem/PDF).
- **Vacinação**: Registro de vacina aplicada, comprovante, responsável, data de reforço
  e configuração de lembrete.
- **Vermífugo/Antiparasitário**: Registro sanitário com aplicação e próximo lembrete.
- **Medicamento**: Item terapêutico reutilizável com catálogo híbrido (base global e
  customização por tutor) com nomenclatura e descrição.
- **Receita**: Plano de administração de medicamento com dosagem, frequência,
  horário inicial, lembretes e status.
- **Registro de Dose**: Evento de dose administrada usado para cálculo do próximo horário.
- **Carteira Digital do Pet**: Consolidação estruturada do histórico sanitário essencial.

## Assumptions

- O acesso à API ocorre somente para usuários autenticados por email e senha.
- A API fornece dados de lembretes e próximos horários; a entrega visual de notificação
  ao usuário final é responsabilidade dos aplicativos clientes.
- Horários de medicação e lembretes consideram o fuso configurado pelo responsável do pet.
- O objetivo da carteira digital é consolidação sanitária e histórico, sem substituir
  documentos legais emitidos por órgãos reguladores.

## Dependencies

- Implementação de cadastro/autenticação de usuários por credenciais (email/senha).
- Disponibilidade de armazenamento de anexos para arquivos de exames e vacinas.
- Capacidade dos clientes (mobile/web) de consumir agenda de medicação para widgets.

## Scope Boundaries

- Inclui gestão de histórico e rotina clínica/sanitária dos pets.
- Inclui compartilhamento de cuidado com papéis e permissões específicas.
- Não inclui teleconsulta, pagamento, ou prescrição médica automatizada.

## Constitution Alignment *(mandatory)*

### Architecture and Design Constraints

- **CA-001**: A entrega MUST separar responsabilidades de entrada HTTP,
  regra de negócio, persistência e composição de dependências.
- **CA-002**: Regras de domínio de histórico, medicação e permissões MUST ficar
  centralizadas em regras de negócio testáveis.
- **CA-003**: Expansões de escopo MUST priorizar simplicidade e evitar modelagem
  excessiva sem ganho claro para o domínio.

### API Contract and Versioning Constraints

- **CA-004**: Cada operação MUST ter contrato explícito de entrada/saída,
  incluindo erros esperados.
- **CA-005**: Mudanças incompatíveis com consumidores atuais MUST ser publicadas
  em nova versão de API.
- **CA-006**: Rotas MUST seguir convenções REST com recursos no plural,
  versionamento em path e semântica coerente de métodos HTTP.

### Quality and Testing Constraints

- **CA-007**: A especificação MUST cobrir testes unitários para regras de negócio,
  especialmente permissões, cálculo de próxima dose e transições de histórico.
- **CA-008**: A especificação MUST cobrir testes de integração para fluxos com
  anexos, persistência histórica e recuperação de agenda de medicação.
- **CA-009**: A entrega MUST passar por validações de qualidade definidas pelo projeto,
  incluindo verificação de tipos, lint e testes.

### Security and Observability Constraints

- **CA-010**: O acesso MUST respeitar controle por perfil (tutor principal,
  co-tutor, cuidador) em todas as operações.
- **CA-011**: Falhas MUST retornar códigos de erro estáveis e rastreáveis,
  com identificador de correlação para suporte operacional.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pelo menos 90% dos usuários conseguem cadastrar um pet e registrar
  alimentação, peso e uma consulta em até 10 minutos na primeira utilização.
- **SC-002**: Em 100% dos registros de dose confirmados, o próximo horário da receita
  é recalculado e disponibilizado imediatamente para consulta.
- **SC-003**: Pelo menos 95% das consultas de agenda diária retornam os próximos horários
  de medicação em ordem cronológica correta.
- **SC-004**: Pelo menos 95% das tentativas de acesso indevido por papel incorreto
  (ex.: cuidador tentando excluir pet) são bloqueadas com feedback claro.
- **SC-005**: Pelo menos 95% das carteiras digitais geradas incluem corretamente todos
  os registros de vacinação, vermífugos e antiparasitários do período consultado.
