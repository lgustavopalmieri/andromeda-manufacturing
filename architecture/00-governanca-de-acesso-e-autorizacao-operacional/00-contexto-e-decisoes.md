# Access governance and operational authorization — context and decisions

> This folder is a **backend implementation spec** for the product requirement. It turns business rules into modules, TypeScript entities, invariants, features, and verifications; it does not replace the product decision. When there is a conflict, the product prevails and the spec must change.

## How to read this spec

1. This file establishes sources, scope, and cross-cutting decisions.
2. [01](01-contextos-delimitados-e-agregados.md) identifies the responsible module; [02](02-contratos-compartilhados-de-autorizacao.md) defines the shared language.
3. Files [03–10](03-entidades-tenant.md) detail, per module, the role in the requirement, traceability, entities, rules, and features. [11](11-modelo-de-decisao-contextual.md) shows how they decide together.
4. [12](12-features-e-ordem-de-implementacao.md) is the executable order; [13](13-consistencia-persistencia-e-validacao.md) defines persistence and tests.

## Normative sources for the requirement

| Product source | Technical obligation derived from it |
|---|---|
| [P00 — vision and boundaries](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md) | Tenant isolation, physical hierarchy, versioned HMI contracts, and no physical control. |
| [P01 — personas](../../product/01-governanca-de-acesso-e-autorizacao-operacional/01-personas-papeis-e-responsabilidades.md) | A persona does not grant access; Owner is not an implicit operator. |
| [P02 — contextual decision](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) | Permission, scope, state, and conditions are cumulative; absence denies. |
| [P03 — onboarding and Owner](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md) | Isolated tenant, traceable invitation, controlled activation, and Owner continuity. |
| [P04 — catalog](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md) | Explicit business operations and roles as revisable presets. |
| [P05 — assignments and assets](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md) | Declarative grant, least scope, validity, and conditions to act on an asset. |
| [P06 — state and segregation](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md) | State, SoD, and preconditions prevail over role and productivity. |
| [P07 — identity, exception, and audit](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | Own identity, finite delegation, short exception, and immutable trail. |
| [P08 — acceptance scenarios](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md) | Fifteen minimum flows that guide E2E and security tests. |
| [P09 — employee lifecycle](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | Affiliation, sponsorship, approval, provisioning, and assignment are separate acts. |
| [P10 — lifecycle criteria](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md) | Start, change, coverage, termination, and review must be verifiable. |

## Outcome this architecture must produce

An authenticated identity selects a tenant and only sees or changes a resource when a current decision proves: active affiliation, exact operation, applicable scope, validity, state, operational conditions, and absence of conflict. This allows the E-03/B operator without granting E-04, and allows the Owner to govern the account without opening an HMI — the central examples of [P00](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md) and [P08](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md).

## Binding architectural decisions

| Decision | Implementation rule and consequence |
|---|---|
| `tenantId` is a boundary | Every business datum, read, and mutation filters by `tenantId`; foreign IDs do not confirm existence. |
| Keycloak authenticates | The edge validates the token and obtains the subject; the token is not the source of role, scope, or effective grant. |
| Andromeda authorizes | The application re-evaluates contextual authorization before the effect for HTTP, HMI, integration, and agent. |
| `TenantMember` is the local subject | The same `Identity` can have independent affiliations and powers in each tenant. |
| Roles and policies are versioned | A published revision is immutable; grant migration is explicit and auditable. |
| Owner is governance, not an exception | Holding an Owner appointment does not satisfy operation, quality, maintenance, or SoD conditions. |
| Audit is a fact, not a mutable log | A change, relevant decision, and sensitive act preserve effective actor, context, and correlation. |
| PostgreSQL is the source of truth | In the MVP there is no permissive cache; suspension/revocation blocks the next action even with an open session. |
| Pre-tenant bootstrap is an allowlist | Only public onboarding creates a `TenantOnboardingRequest` without `tenantId`, with correlation and a system actor; every tenant-scoped write requires `tenantId`. |

## Deliberate boundaries of this first delivery

Topology, competency, shift, and assignment begin simplified: they exist to prove or deny access conditions, not to replace MES, LMS, planning, or maintenance. Future order, quality, material, HMI, telemetry, and integration modules must provide their own `ResourceContext`, without changing an already-issued grant. PLC, DCS, SIS, and the physical emergency procedure remain outside the system, as specified by [P00](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md) and [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md).

## Canonical flow of a protected act

```text
Keycloak token → authenticated identity → active tenant/member → tenant-filtered resource
→ contextual decision (grant + scope + conditions + SoD) → atomic effect + audit + outbox
```

A confirmation or permitted decision is not reusable: revocation, expiry, state change, competency, assignment, or context requires a new evaluation. The rules and exact sequence are in [11](11-modelo-de-decisao-contextual.md).
