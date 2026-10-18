# Consistência, persistência e validação

## Dados e índices mínimos

Todo agregado de negócio possui coluna `tenant_id NOT NULL`, UUID interno e timestamps UTC. Consultas
recebem tenant antes do ID do recurso. Índices iniciais: `tenant_member(tenant_id, identity_id)` único,
`identity(provider_subject_id)` único quando preenchido, `role_revision(role_id, version)` único e índices compostos de
grants por `(tenant_id, subject_member_id, status, valid_from, valid_until)`. Escopo usa closure table
`topology_closure(tenant_id, ancestor_id, descendant_id)` e índice nos dois sentidos.

`audit_event` é particionado por mês e tenant quando o volume justificar; o MVP começa com índice
`(tenant_id, occurred_at DESC)`. A aplicação recebe apenas permissão de inserir nessa tabela. Campos
de segredo nunca são gravados: credencial armazena referência externa e impressão digital opcional.

## Transações e integração externa

| Fluxo | Limite de consistência |
|---|---|
| Onboarding | Transaction cria tenant pendente, membro/Owner e outbox; worker idempotente provisiona convite Keycloak. |
| Aceite de Owner | Transaction ativa vínculo, nomeação, grant de governança e tenant, emitindo auditoria. |
| Owner e grants | Lock do tenant/grant evita perda do último Owner, autoelevação e dupla transição concorrente. |
| Ação autorizada | Revalida imediatamente antes do efeito e grava efeito, auditoria e outbox juntos. |
| Revogação/suspensão | Transaction muda estado; próxima ação consulta fonte de verdade e falha mesmo com sessão aberta. |

O worker de outbox usa ID do evento como chave de deduplicação. Falha de provisionamento não ativa
tenant e fica recuperável/reexecutável, sem criar usuário ou convite duplicado. Eventos de topologia,
competência, vínculo e revogação servem para notificação e cache futuro, mas nunca são a única fonte
para autorizar no MVP.

## Estratégia de testes

- Domínio: todas as transições, subconjuntos de delegação, expiração, Owner final e conflitos de segregação.
- Aplicação: ordem de chamadas; negação não toca repositório/efeito; ports de contexto retornam somente tenant correto.
- Integração PostgreSQL: índices/uniqueness, transações de onboarding e Owner, closure tree e filtros por tenant.
- Integração Keycloak: convite repetido, aceite e token inválido; mock em testes de aplicação.
- E2E: os 15 cenários de `08` e os 11 de `10` do requisito, por HTTP/HMI simulado/integração.

Critérios de não regressão: Owner sem grant operacional não vê contexto HMI, usuário A não infere
ativo B, revogação bloqueia próxima chamada, e autor de uma versão não a aprova/publica quando a
política de segregação é exigida.
