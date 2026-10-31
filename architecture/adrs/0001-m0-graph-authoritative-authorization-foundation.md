# ADR-0001 — Graph-Authoritative Authorization for the M0 Foundation

| Field | Value |
| --- | --- |
| Status | **Superseded in part by [ADR-0002](0002-required-nullable-persisted-references.md)** — only nullable-reference representation; unchanged baseline decisions are carried forward. |
| Decision date | 2026-10-30, America/Sao_Paulo |
| Source feature | [EP-00-F01 — Govern scoped access](../../product/epics/00-authorization-first-validation/01-govern-scoped-access.md) |
| Approved package | **SPEC-EP-00-F01 revision 6, M0 executable foundation only** |
| Specification | [Requirements](../specs/EP-00-F01-govern-scoped-access.requirements.md), [Design](../specs/EP-00-F01-govern-scoped-access.design.md), [Tasks](../specs/EP-00-F01-govern-scoped-access.tasks.md) |
| Context | [Authorization platform context](../00-authorization-platform-context.md) |
| Approval evidence | The user explicitly approved revision 6 in this conversation on 2026-10-30: “perfeito. spec aprovada”. No issue/approval URL was supplied. |
| Implementation | **not started**; no implementation stage opened or currently authorized. Accepted is design approval, not implementation authorization or delivery evidence. |

**2026-10-31 lifecycle note:** [ADR-0002](0002-required-nullable-persisted-references.md) supersedes the revision-6 optional/omission representation for actor owner and location parent fields. All unrelated graph/bootstrap/isolation decisions below remain historical accepted decisions and are carried forward by ADR-0002. Original approval, session authorization boundaries and implementation statements below are preserved as records of the 2026-10-30 decision, not current execution status.

## Context and drivers

EP-00 begins a retained real authorization foundation with two synthetic tenants, granular action/resource boundaries and later manufacturing capabilities. F01 includes access governance beyond the first executable increment. The backend currently contains package/build/compiler/test configuration but no implemented application, business records or authorization.

The approved first milestone must demonstrate a real protected operation while remaining understandable and incremental. Authentication is deferred; it must not force identity/status reads into every authorization request. Current permission must depend on persisted graph state rather than stale token entitlements or a SQL permission engine. Tenant isolation, independent memberships, identifiable authority sources and safe provider failure are required from the first increment.

## Decision

Record the following choices already defined in revision 6's M0 design:

1. **Keep one provider-neutral application boundary.** The controlled runner injects `IdentityContext {actorId, tenantId}` now. A later authentication feature will populate that same contract after token verification. Clients cannot replace identity, lifecycle gates, FGA relations or provider configuration.
2. **Authorize directly through OpenFGA.** The inherited `execute` calls the injected neutral authorization capability once. Its OpenFGA adapter performs a fresh pinned Check without an application SQL repository, entity resolver or SQL/JWT status facts. Only a complete allow enters the protected handler; denial or indeterminate outcomes perform no business SQL.
3. **Persist mutable authority in the graph.** Use a globally identified actor's enabled userset, a tenant-enabled gate, active membership and an independently identifiable direct permission source. Both grant and resource require membership through their own tenant. A tenant-enabled condition binds persisted `expected_tenant_id` to trusted `selected_tenant_id`, preventing cross-tenant source combination. These are application-defined relations, not built-in lifecycle CRUD. Future protected operational/admin paths must retain the gates.
4. **Keep PostgreSQL for business concerns.** Retain the five pure Tenant, Actor, TenantMembership, Location and Machine contracts, tenant-safe schema/mappings/seeds and required `Machine.locationId`. SQL directory status fields do not feed authorization. After allow, the validation handler reads the machine by trusted tenant/ID and returns an explicit validation-only result with no manufacturing mutation.
5. **Separate permission from execution result.** Graph refusal/unknown reference gives safe403 without SQL; an allowed graph address missing its SQL machine gives safe404 after the business read. Provider inability gives authority-unavailable503. Recognized business-store outage after allow gives a separate business-unavailable503, while generic repository/unexpected errors remain500. Correlated decision and business-outcome logs do not claim audit-history proof.
6. **Use explicit, reproducible provider binding.** Pin the approved `authorization-m0-v2` artifact, exact model ID/hash and store; retain the OpenFGA 1.22.0 / SDK 0.9.7 validation baseline. Initialize separately from normal startup, refuse partial/old bindings and preserve provider state across backend restarts. The provider's own PostgreSQL datastore is separate from application business storage.
7. **Deliver only the controlled foundation first.** Keep the validation route disabled by default and use loopback controlled fixtures. No authentication/Keycloak integration, runtime grant/revoke/lifecycle APIs, group/delegation administration, manufacturing writes, audit framework, broker or coordination engine is introduced by M0.

Native FGA writes are atomic inside FGA only. This decision does not solve or waive G01 effective-revocation ordering, G02 cross-system resource/lifecycle changes, G03 protected history or G04 concurrent group mutation. M1–M7 designs remain pending and full F01 remains incomplete.

## Alternatives and tradeoffs

| Alternative considered | Decision and consequence |
| --- | --- |
| Read actor/membership/machine SQL facts before every Check and supply status context. | Rejected for the authorization path. It adds application-database latency/availability coupling and duplicates current-state resolution. Required business reads remain behind the gate. |
| Treat token roles/status/membership claims as continuing permission. | Rejected. Identity remains trusted context; persisted graph gates govern mutable authority. Authentication implementation remains a later feature. |
| Put policy only in HTTP handlers or local role/scope comparisons. | Rejected. The shared application gate and provider-neutral port preserve the protected contract across future protocols. |
| Implement complete F01 governance, strong coordination or historical investigation in the first increment. | Deferred to the mapped feature milestones and explicit gates. Those requirements remain open; their limitations are not accepted product policy. |

The accepted design removes a compulsory application SQL lookup from authorization but still depends on OpenFGA availability, correct trusted tuple registration and later lifecycle ownership. Business bootstrap and allowed machine validation still require PostgreSQL. The model's per-tenant condition and userset links add graph traversal; no capacity/SLA claim is approved.

## Conformance, delivery and follow-up

The [ordered M0 checklist and case catalog](../specs/EP-00-F01-govern-scoped-access.tasks.md#m0-execution-checklist) are the execution contract. Current design QA includes strict compilation and document checks, not real-provider/model/application execution.

Conformance will be demonstrated by TC-M0-11/25/26/27 for graph gates and tenant/global lifecycle variants, TC-M0-14/15/16 for the provider boundary and inherited gate, TC-M0-17/28 for protected business reading, TC-M0-22/29 for distinct provider/business failures, and the remaining setup/schema/logging/E2E cases mapped to their tasks. The complete five entity contracts remain in Design; Backend must not substitute a permission graph in SQL or restore request-time status reads.

**Approval-only session boundary (user clarification, 2026-10-30):** this session covers specification approval and ADR recording only. No implementation stage is opened or currently authorized. Implementation will begin only after the user explicitly starts it in a new context window. **Proposed first stage for that future start: M0-01 — Validate runtime configuration.** Its implementation/evidence and review will follow the Backend stage protocol. The separate OpenFGA configuration/client stages M0-26a/M0-26b and other tasks remain later planned work. M0 design approval does not itself authorize implementation, bypass stage review or approve future feature designs.

Revise the same canonical specification and obtain approval before a substantive change to identity, entity shape, gates, failure semantics, provider binding or accepted scope. Preserve source IDs, tenant boundaries and the later compatibility obligations. No live model/data migration is required now because no earlier implementation exists.

## Relationships

This is the first accepted ADR in this repository; it supersedes no ADR. Revisions 1–5 are unapproved historical specification proposals, not earlier accepted decisions. This record applies only to revision 6's M0 foundation, not the remaining F01 or other epic features.
