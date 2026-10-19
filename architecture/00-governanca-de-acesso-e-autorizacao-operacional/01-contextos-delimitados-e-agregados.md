# Contextos delimitados, módulos e agregados

> Este é o índice de responsabilidade da spec. Cada arquivo de módulo ligado abaixo reúne a
> origem de produto, o que suas entidades representam, invariantes e features; portanto uma
> feature nunca deve ser implementada só a partir deste resumo ou como CRUD genérico.

## Regra de organização do backend

Um módulo possui `entity/` puro e suas features verticais em `features/<verbo>/`. A feature contém
`domain`, `application`, adaptadores `inbound`/`outbound` e `wire`; ela recebe interfaces, não ORM,
Express ou Keycloak. O módulo dono protege suas invariantes. Outro módulo o consulta por porta, ID
ou evento, nunca por entidade ORM compartilhada. Esta separação torna explícito quem pode mudar cada
regra de [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md).

`entity/` importa somente tipos irmãos do próprio módulo: não importa `@shared`, outro módulo,
framework ou ORM. IDs de outro contexto são primitivos/aliases locais no contrato; a tradução para
`@shared/access`, a resolução de dados externos e a composição de portas ocorrem na `application`.

## Dono do avaliador e portas de leitura

`access-governance/features/evaluate-access` implementa `ContextualAuthorizationService`: sua
`application` declara portas para sujeito/membership, política/revisões, grants, descendência,
competência/turno/designação, delegação/exceção e fatos de segregação. A feature dona do recurso
implementa somente a porta `resolve-resource-authorization-context`, que retorna contexto confiável
e fatos de autoria/operação da versão; ela não replica regra de grants. A `wire` compõe essas portas,
mantendo o avaliador reutilizável e as consultas ao recurso no dono do recurso.

## Mapa de módulos: entidade, papel e feature

| Módulo / fronteira | Agregado e atuação no requisito | Features iniciais e fonte | Spec da entidade e feature |
|---|---|---|---|
| `@shared/access` | Contratos neutros de sujeito, recurso, pedido e decisão; não contém política. | Avaliar o mesmo pedido em qualquer canal. [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md), [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [02](02-contratos-compartilhados-de-autorizacao.md) |
| `tenant` | `Tenant`, `TenantOnboardingRequest`, `OwnerAppointment`, `PolicyAcceptance`: cria a conta, prova o aceite e mantém ciclo/propriedade. | `request-onboarding`, `provision-owner-invitation`, `activate-tenant`, `appoint-owner`, `transfer-owner`, `recover-owner`, `suspend-tenant`. [P03](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md) | [03](03-entidades-tenant.md) |
| `identity` | `Identity`, `Credential`, `CredentialUsage`: registra o principal humano, serviço, dispositivo ou agente e evidência da credencial externa. | `resolve-identity`, `register-non-human-identity`, `issue/rotate/revoke-credential`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [04](04-entidades-identidade-e-vinculo.md) |
| `membership` | `TenantMember`, `MembershipAffiliation`, `MemberInvitation`: cria o sujeito local, seu vínculo histórico, patrocinador e vigência. | `register-member`, `record/change/end-affiliation`, `invite-member`, `accept-invitation`, `suspend-member`, `revoke-member`. [P09](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | [04](04-entidades-identidade-e-vinculo.md) |
| `access-governance` — catálogo | `PermissionDefinition`, `RoleDefinition`/`RoleRevision`, `AccessPolicyRevision`: define operação explícita, pacote revisável e política tenant-local. | `bootstrap-catalog`, `define-role`, `publish-role-revision`, `publish-access-policy`. [P04](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md), [P06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md) | [05](05-entidades-catalogo-papeis-e-politica.md) |
| `access-governance` — atribuição | `AccessRequest`, `AccessGrant`, `AccessReviewTask`: separa patrocinar, aprovar, provisionar, revisar e revogar a autoridade efetiva. | `propose-access`, `decide-access-request`, `grant-access`, `suspend-grant`, `revoke-grant`, `review-grants`, `evaluate-access`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [P09](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | [06](06-entidades-pedidos-concessoes-e-escopos.md) |
| `operational-topology` | `OperationalNode`, `TopologyChange`: fornece a árvore autorizável e o ativo simplificado. | `register-node`, `move-node`, `inactivate-node`, `resolve-descendant-scope`. [P00](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md), [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md) | [07](07-entidades-topologia.md) |
| `competency` | `CompetencyEvidence`: prova capacitação vigente; não é um LMS. | `record-evidence`, `validate-evidence`, `revoke-evidence`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [P09](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | [08](08-entidades-condicoes-operacionais.md) |
| `work-schedule` | `ShiftTemplate`, `ShiftOccurrence`: materializa horário confiável para restringir uma atuação. | `define-shift`, `materialize-occurrence`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md) | [08](08-entidades-condicoes-operacionais.md) |
| `asset-assignment` | `AssetAssignment`: evidencia que pessoa já autorizada foi designada a atuar em ativo/turno com propósito. | `assign-asset`, `suspend-assignment`, `end-assignment`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [P10](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md) | [08](08-entidades-condicoes-operacionais.md) |
| `delegation` | `Delegation`: autoridade derivada, finita e menor ou igual à concessão fonte. | `create-delegation`, `accept-delegation`, `revoke-delegation`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [09](09-entidades-delegacao-e-excecao.md) |
| `emergency-access` | `EmergencyAccess`: acesso excepcional, mínimo, curto e com revisão posterior. | `authorize-emergency-access`, `revoke-emergency-access`, `review-emergency-access`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md), [P08](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md) | [09](09-entidades-delegacao-e-excecao.md) |
| `audit-trail` | `AuditEvent`: fato append-only de mudança, decisão ou ação com ator efetivo e contexto. | `record-event`, `list-audit-events`, `export-audit-evidence`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [10](10-entidades-auditoria.md) |

## Relação entre agregados na decisão

```text
Identity ──< TenantMember >── Tenant ──< OwnerAppointment
TenantMember ──< AccessGrant >── RoleRevision / AccessPolicyRevision
AccessGrant ──< ScopeSelector >── OperationalNode (e restrições)
TenantMember ──< CompetencyEvidence / AssetAssignment / Delegation
AuthorizationDecision ──> AuditEvent
```

`TenantMember` é a fronteira de autorização por tenant: uma mesma `Identity` nunca combina papel,
escopo ou condição entre A e B. `AccessGrant` é a única autoridade ordinária; competência, turno,
designação, delegação e exceção apenas satisfazem, reduzem ou substituem condições segundo a política.

## Fronteiras de consistência

- `Tenant` protege ciclo de vida e Owner; onboarding usa uma transação local e uma outbox.
- `AccessGrant`, `Delegation` e `EmergencyAccess` protegem seus próprios estados; referências cruzadas
  são verificadas pela application antes de transições, sem atualizar agregados alheios diretamente.
- `OperationalNode` atualiza sua árvore/closure table atomica e solicita revisão de acessos afetados.
- `AuditEvent` não é agregado alterável: só recebe inclusão transacional pelos módulos proprietários.

Os quatro módulos operacionais simplificados (`operational-topology`, `competency`, `work-schedule`
e `asset-assignment`) têm somente o dado necessário para a autorização agora. Eles podem ganhar
domínio próprio depois, desde que preservem IDs e o contexto histórico exigido em [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md).
