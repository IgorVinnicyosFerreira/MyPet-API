# Research: Restrict Pet Species

**Feature**: `005-restrict-pet-species`  
**Phase**: 0 - Outline & Research  
**Date**: 2026-04-17

## Resolucao de NEEDS CLARIFICATION

### 1. Performance Goals

**Decision**: Definir para `POST /v1/pets` alvo de `p95 <= 250ms`, throughput de `50 req/s` sustentado com burst de `100 req/s` por 5 minutos e taxa de falha infra `<1%`.

**Rationale**: A feature adiciona validacao de dominio em endpoint de escrita simples, com baixo custo adicional, e o baseline ja adotado em features recentes de escrita (`002`, `004`) e suficiente para este escopo.

**Alternatives considered**:
- `p95 <= 350ms`: rejeitado por permissivo demais para criacao unitaria com validacao simples.
- `p95 <= 200ms`: rejeitado por agressivo demais para baseline atual do projeto.

### 2. Scale/Scope

**Decision**: Assumir baseline atual do produto (`~10k MAU`, `~100k pets`) e limitar escopo ao `POST /v1/pets`, sem bulk create, sem backfill de dados historicos e sem novas estrategias de escala (cache/fila/sharding).

**Rationale**: A mudanca e localizada no contrato de entrada de criacao e nao altera o padrao de acesso ao banco nem topologia do sistema.

**Alternatives considered**:
- Planejar escala elevada nesta entrega: rejeitado por overengineering sem demanda explicita.
- Ignorar volumetria: rejeitado por deixar metas operacionais indefinidas.

## Best Practices por Dependencia / Integracao

### 3. Restricao de enum no contrato HTTP

**Decision**: Restringir `species` no schema de entrada da rota de criacao para um enum canonico com `Canine` e `Feline`.

**Rationale**: Faz o contrato ser explicito para consumidores e atualiza automaticamente documentacao gerada, reduzindo tentativa invalida de integracao.

**Alternatives considered**:
- Validar apenas no service: rejeitado por nao expor restricao no contrato de API.
- Manter `string` livre com texto de documentacao: rejeitado por baixa garantia de conformidade.

### 4. Regra de dominio defensiva no service

**Decision**: Manter validacao defensiva de especie permitida tambem no service de criacao, mesmo com validacao na rota.

**Rationale**: Preserva regra de negocio no layer correto e evita bypass em chamadas internas fora do boundary HTTP.

**Alternatives considered**:
- Confiar somente no schema da rota: rejeitado por enfraquecer garantia de dominio fora do fluxo HTTP.

### 5. Persistencia e dados existentes

**Decision**: Nao alterar coluna `Pets.species` nem aplicar migration nesta entrega; a restricao vale para novas criacoes.

**Rationale**: Evita mudanca de coluna existente (acao que exige aprovacao explicita) e reduz risco operacional com dados legados.

**Alternatives considered**:
- Converter coluna para enum no banco agora: rejeitado por ampliar escopo e risco de compatibilidade com dados existentes.

### 6. Versionamento e compatibilidade

**Decision**: Manter a feature em `/v1` sem criar `/v2`.

**Rationale**: Nao ha alteracao de shape de resposta de sucesso nem mudanca de recurso/rota, apenas endurecimento de validacao de entrada alinhado ao contrato.

**Alternatives considered**:
- Abrir `/v2` para a mesma rota: rejeitado por aumento de custo de manutencao sem beneficio proporcional.

### 7. Testes obrigatorios da mudanca

**Decision**: Cobrir unitariamente a regra de especie no service e em integracao o contrato do `POST /v1/pets` para especies validas e invalidas, incluindo nao persistencia em tentativa invalida.

**Rationale**: A constituicao exige testes para regra de negocio e fluxo cross-layer quando contrato/validacao muda.

**Alternatives considered**:
- Somente testes de integracao: rejeitado por deixar regra de dominio sem teste unitario direto.
- Somente testes unitarios: rejeitado por nao validar contrato HTTP/documentacao.
