# Consistência, persistência e validação — spec de implementação

> Esta spec torna verificáveis isolamento, revogação imediata e autoria histórica exigidos por
> [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md),
> [P03](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md),
> [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md),
> [P06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md),
> [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md),
> [P09](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) e
> [P10](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md).

## Regra de posse de dados e isolamento

PostgreSQL é a fonte de verdade da autorização no MVP. Toda entidade **pertencente a tenant** possui
`tenant_id NOT NULL`, UUID interno, timestamps UTC e é carregada com `tenant_id` antes do ID do
recurso. A exceção é intencional: `Identity` e `PermissionDefinition` são catálogos globais de
plataforma, sem dado de negócio do tenant; só se tornam observáveis no tenant por `TenantMember` ou
por uma concessão. `Credential` e `CredentialUsage`, embora vivam no módulo `identity`, continuam
tenant-scoped. Nunca usar a exceção global para guardar recurso, evidência ou configuração do tenant.

| Grupo persistido | Dono/spec | Regra de isolamento e retenção |
|---|---|---|
| Tenant, onboarding e Owner | [03](03-entidades-tenant.md) | `correlation_id` único; transição de Owner bloqueia concorrência e preserva antecessor/sucessor. |
| Identity global; credencial e uso tenant-scoped | [04](04-entidades-identidade-e-vinculo.md) | `provider_subject_id` único quando presente; segredo fica somente em provedor/referência externa. |
| Member e vínculo RH/contrato | [04](04-entidades-identidade-e-vinculo.md) | `(tenant_id, identity_id)` único; fonte, patrocinador, período e fim do contrato são históricos. |
| Papéis, política, pedidos e grants | [05](05-entidades-catalogo-papeis-e-politica.md), [06](06-entidades-pedidos-concessoes-e-escopos.md) | Revisões publicadas são imutáveis; grant referencia revisão/justificativa e nunca cruza tenant. |
| Topologia e condições | [07](07-entidades-topologia.md), [08](08-entidades-condicoes-operacionais.md) | Árvore, evidência, turno e designação pertencem ao mesmo tenant do membro/ativo consultado. |
| Delegação e exceção | [09](09-entidades-delegacao-e-excecao.md) | Referências fonte/destino/escopo são validadas no tenant e conservam expiração/revisão. |
| Auditoria e outbox | [10](10-entidades-auditoria.md) | `audit_event` é append-only; mensagem tenant-scoped na outbox leva `tenant_id`, correlação e ID deduplicável. |

## Índices e restrições mínimas

- `tenant_member(tenant_id, identity_id)` único; `identity(provider_subject_id)` único parcial;
  `tenant_onboarding_request(correlation_id)` único para idempotência.
- `role_revision(role_definition_id, version)` e `access_policy_revision(tenant_id, version)` únicos;
  uma restrição/validação impede duas revisões efetivas no mesmo instante quando a política assim exigir.
- `access_grant(tenant_id, subject_member_id, status, valid_from, valid_until)` e índices equivalentes
  para delegação/exceção atendem a reavaliação por ação; não indexar somente por ID global.
- `topology_closure(tenant_id, ancestor_id, descendant_id)` tem unicidade e índices nos dois sentidos;
  `ancestorNodeIds` é derivado, nunca coluna confiada ao cliente.
- `audit_event(tenant_id, occurred_at DESC)` inicia a consulta; particionamento mensal só entra quando
  volume justificar. Outbox usa índice de pendência/ordenação e chave de deduplicação do evento.

## Limites transacionais e integração externa

| Fluxo | Transação local obrigatória | Efeito externo/concorrência |
|---|---|---|
| Onboarding pré-tenant | A allowlist pública cria somente request correlacionado com ator de sistema; a resolução cria tenant, membro/Owner pendentes, política inicial, auditoria e outbox. | Worker idempotente envia convite Keycloak; falha não ativa tenant nem duplica convite. |
| Aceite, ativação, transferência ou recuperação de Owner | Aceite resolve identidade/membro, política aceita, nomeação e grant explícito de governança antes de ativar; demais mutações bloqueiam linha do tenant e comprovam Owner ativo. | Nunca há intervalo sem Owner; grant inicial não é operacional; recuperação exige prova/autoridade e revisão. |
| Mudança RH/contrato | Atualiza vínculo e suas datas; suspensão/fim encerra efeitos futuros de grants, delegações e designações. | Evento notifica consumidores; a próxima avaliação consulta estado atual, não cache permissivo. |
| Pedido, política ou grant | Aprovação/provisionamento materializa só revisão publicada, escopo autorizado e razão; mudança e auditoria são uma unidade. | Locks/versão impedem autoelevação, dupla decisão e transição concorrente. |
| Ato protegido | Reavalia imediatamente antes de gravar efeito, contexto histórico, auditoria e outbox. | Conflito de versão/estado aborta tudo e exige nova decisão. |
| Topologia, delegação ou exceção | Altera agregado, revisa dependências e registra auditoria/outbox na mesma unidade. | Mover ativo não reescreve fatos; expiração/revogação não tem renovação silenciosa. |

A outbox é infraestrutura nova da fase 0, não assumir que o publicador atual a fornece. O relay entrega
ao menos uma vez, usa o ID do evento para deduplicação e deixa consumidores idempotentes. Eventos de
topologia, competência, vínculo e revogação podem invalidar cache futuro, mas cache nunca autoriza
sozinho. `AuditEvent` recebe apenas inserção pela aplicação; nem worker, nem API ordinária o atualiza
ou exclui.

## Contexto histórico e dados sensíveis

Todo fato operacional futuro guarda `tenantId`, recurso/local/ativo, versão e contexto que valiam no
instante do efeito. Uma mudança de linha não reescreve o fato nem amplia acesso retroativo. Auditoria
guarda referências e digests de antes/depois, não payload produtivo bruto; credenciais guardam
referência externa/impressão digital, nunca senha, token ou segredo de cliente.

## Estratégia de validação e evidência de aceite

| Nível | O que deve provar | Fonte/casos |
|---|---|---|
| Domínio | Estados, Owner final, subconjunto de delegação, expiração, SoD e normalização de cada feature. | Regras nos módulos [03–10](03-entidades-tenant.md). |
| Application | Ordem: negar não toca repositório/efeito; portas recebem somente tenant/contexto confiáveis; obrigação reavalia. | [11](11-modelo-de-decisao-contextual.md). |
| Integração PostgreSQL | Unicidade, filtros tenant, locks/transações, closure tree, append-only e migrações/outbox. | Cenários de isolamento e revogação de [P08](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md). |
| Integração Keycloak/worker | Convite repetido, aceite, token inválido, retry e deduplicação; mock somente nos testes de application. | Onboarding de [P03](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md). |
| E2E | Os 15 cenários de P08 e 11 de P10 por HTTP/HMI simulado/integração, inclusive não enumeração. | [P08](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md), [P10](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md). |

São não regressões mínimas: Owner sem grant operacional não vê HMI; membro A não infere ativo B;
revogação com sessão aberta bloqueia a próxima chamada; desligamento encerra delegações; autor de
versão não a aprova/publica sob SoD; e mover ativo não modifica autoria ou escopo do fato anterior.
