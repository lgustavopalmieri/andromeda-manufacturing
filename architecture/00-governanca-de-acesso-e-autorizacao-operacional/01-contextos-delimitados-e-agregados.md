# Bounded contexts, modules, and aggregates

> This is the responsibility index of the spec. Each linked module file brings together the product source, what its entities represent, invariants, and features; therefore a feature must never be implemented solely from this summary or as generic CRUD.

## Backend organization rule

A module has a pure `entity/` and its vertical features in `features/<verb>/`. A feature contains `domain`, `application`, `inbound`/`outbound` adapters, and `wire`; it receives interfaces, never ORM, Express, or Keycloak. The owning module protects its invariants. Another module consults it through a port, ID, or event, never through a shared ORM entity. This separation makes explicit who can change each rule from [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md).

`entity/` imports only sibling types from its own module: it does not import `@shared`, another module, framework, or ORM. IDs from another context are local primitives/aliases in the contract; translation to `@shared/access`, external data resolution, and port composition occur in `application`.

## Evaluator owner and read ports

`access-governance/features/evaluate-access` implements `ContextualAuthorizationService`: its `application` declares ports for subject/membership, policy/revisions, grants, descendants, competency/shift/assignment, delegation/exception, and segregation facts. The resource-owning feature implements only the `resolve-resource-authorization-context` port, which returns trusted context and version authorship/operation facts; it does not replicate grant rules. The `wire` composes these ports, keeping the evaluator reusable and resource queries with the resource owner.

## Module map: entity, role, and feature

| Module / boundary | Aggregate and role in the requirement | Initial features and source | Entity and feature spec |
|---|---|---|---|
| `@shared/access` | Neutral contracts for subject, resource, request, and decision; contains no policy. | Evaluate the same request in any channel. [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md), [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [02](02-contratos-compartilhados-de-autorizacao.md) |
| `tenant` | `Tenant`, `TenantOnboardingRequest`, `OwnerAppointment`, `PolicyAcceptance`: creates the account, proves acceptance, and maintains lifecycle/ownership. | `request-onboarding`, `provision-owner-invitation`, `activate-tenant`, `appoint-owner`, `transfer-owner`, `recover-owner`, `suspend-tenant`. [P03](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md) | [03](03-entidades-tenant.md) |
| `identity` | `Identity`, `Credential`, `CredentialUsage`: records the human, service, device, or agent principal and evidence of the external credential. | `resolve-identity`, `register-non-human-identity`, `issue/rotate/revoke-credential`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [04](04-entidades-identidade-e-vinculo.md) |
| `membership` | `TenantMember`, `MembershipAffiliation`, `MemberInvitation`: creates the local subject, its historical affiliation, sponsor, and validity. | `register-member`, `record/change/end-affiliation`, `invite-member`, `accept-invitation`, `suspend-member`, `revoke-member`. [P09](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | [04](04-entidades-identidade-e-vinculo.md) |
| `access-governance` — catalog | `PermissionDefinition`, `RoleDefinition`/`RoleRevision`, `AccessPolicyRevision`: defines explicit operation, revisable package, and tenant-local policy. | `bootstrap-catalog`, `define-role`, `publish-role-revision`, `publish-access-policy`. [P04](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md), [P06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md) | [05](05-entidades-catalogo-papeis-e-politica.md) |
| `access-governance` — assignment | `AccessRequest`, `AccessGrant`, `AccessReviewTask`: separates sponsoring, approving, provisioning, reviewing, and revoking effective authority. | `propose-access`, `decide-access-request`, `grant-access`, `suspend-grant`, `revoke-grant`, `review-grants`, `evaluate-access`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [P09](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | [06](06-entidades-pedidos-concessoes-e-escopos.md) |
| `operational-topology` | `OperationalNode`, `TopologyChange`: supplies the authorizable tree and simplified asset. | `register-node`, `move-node`, `inactivate-node`, `resolve-descendant-scope`. [P00](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md), [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md) | [07](07-entidades-topologia.md) |
| `competency` | `CompetencyEvidence`: proves current competency; it is not an LMS. | `record-evidence`, `validate-evidence`, `revoke-evidence`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [P09](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | [08](08-entidades-condicoes-operacionais.md) |
| `work-schedule` | `ShiftTemplate`, `ShiftOccurrence`: materializes trusted schedule to restrict an action. | `define-shift`, `materialize-occurrence`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md) | [08](08-entidades-condicoes-operacionais.md) |
| `asset-assignment` | `AssetAssignment`: evidences that an already-authorized person was assigned to act on an asset/shift for a purpose. | `assign-asset`, `suspend-assignment`, `end-assignment`. [P05](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md), [P10](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md) | [08](08-entidades-condicoes-operacionais.md) |
| `delegation` | `Delegation`: derived, finite authority less than or equal to the source grant. | `create-delegation`, `accept-delegation`, `revoke-delegation`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [09](09-entidades-delegacao-excecao.md) |
| `emergency-access` | `EmergencyAccess`: exceptional, least, short-lived access with later review. | `authorize-emergency-access`, `revoke-emergency-access`, `review-emergency-access`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md), [P08](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md) | [09](09-entidades-delegacao-e-excecao.md) |
| `audit-trail` | `AuditEvent`: append-only fact of change, decision, or action with effective actor and context. | `record-event`, `list-audit-events`, `export-audit-evidence`. [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | [10](10-entidades-auditoria.md) |

## Relationship between aggregates in the decision

```text
Identity ──< TenantMember >── Tenant ──< OwnerAppointment
TenantMember ──< AccessGrant >── RoleRevision / AccessPolicyRevision
AccessGrant ──< ScopeSelector >── OperationalNode (and restrictions)
TenantMember ──< CompetencyEvidence / AssetAssignment / Delegation
AuthorizationDecision ──> AuditEvent
```

`TenantMember` is the tenant authorization boundary: the same `Identity` never combines role, scope, or condition between A and B. `AccessGrant` is the only ordinary authority; competency, shift, assignment, delegation, and exception only satisfy, reduce, or replace conditions according to policy.

## Consistency boundaries

- `Tenant` protects lifecycle and Owner; onboarding uses a local transaction and an outbox.
- `AccessGrant`, `Delegation`, and `EmergencyAccess` protect their own states; cross-references are verified by the application before transitions, without directly updating foreign aggregates.
- `OperationalNode` updates its tree/closure table atomically and requests review of affected access.
- `AuditEvent` is not a changeable aggregate: it only receives transactional inserts by owning modules.

The four simplified operational modules (`operational-topology`, `competency`, `work-schedule`, and `asset-assignment`) contain only the data required for authorization now. They can gain their own domain later, provided they preserve IDs and the historical context required by [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md).
