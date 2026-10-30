# Authorization Platform Context

Updated: **2026-10-30, America/Sao_Paulo**. Approved M0 package: **SPEC-EP-00-F01, revision 6**. M0 design is **Approved**; current implementation state and stage evidence live in [Tasks](specs/EP-00-F01-govern-scoped-access.tasks.md#execution-evidence). F01 is **incomplete** at this approval checkpoint. The user approved M0 on 2026-10-30; [ADR-0001](adrs/0001-m0-graph-authoritative-authorization-foundation.md) is Accepted.

## Start with the three-part specification

| Read | Purpose |
| --- | --- |
| [Requirements and delivery map](specs/EP-00-F01-govern-scoped-access.requirements.md) | First executable demonstration, complete F01 source coverage and future blocking gates. |
| [Design](specs/EP-00-F01-govern-scoped-access.design.md) | Direct graph authorization, post-allow business reading, current contracts/model and safe failures. The historical appendix is optional and superseded. |
| [Tasks](specs/EP-00-F01-govern-scoped-access.tasks.md) | Atomic M0 implementation/check sequence and later design outputs, each with dependencies and review points. |

The three documents form one canonical specification with a shared revision. The approval covers revision 6 M0 only; future designs remain pending and F01 is incomplete. The accepted ADR records design approval, not implementation or runtime verification. On 2026-10-30 the user clarified that this session covers approval/ADR only: no implementation stage is opened or currently authorized, and implementation requires an explicit start in a new context window.

## Sources and repository reality

[EP-00](../product/epics/00-authorization-first-validation/00-epic.md) establishes retained real authorization across ten protected manufacturing capabilities. The selected complete source is [F01 — Govern scoped access](../product/epics/00-authorization-first-validation/01-govern-scoped-access.md), supported by [security/access](../product/requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md) and the [operating model](../product/requirements/00-andromeda-manufacturing-product-foundation/04-operating-model-and-master-data.md).

Approval-time snapshot (2026-10-30, before M0-01): the backend had package/compiler/build/test configuration and `.env.example`, with no application source, business records or authorization implementation. Installed libraries/reference examples were not implementation evidence. Runtime cases were planned and product documents/status unchanged. Backend maintains subsequent implementation progress in the [spec execution evidence](specs/EP-00-F01-govern-scoped-access.tasks.md#execution-evidence); this context is not a live delivery tracker.

## Approved M0 request and ownership boundary

**Trusted IdentityContext → inherited execute → OpenFGA Check → protected handle → business SQL only if needed.**

Now the controlled runner injects actorId/tenantId server-side. A later authentication feature will validate a token and populate the same neutral context. Neither a request nor stale token entitlement/status claims can replace current persisted graph authority. No authentication/Keycloak implementation is added to M0.

| Owner | Approved M0 responsibility |
| --- | --- |
| Shared application/base | Neutral identity and authorization capability, one fresh allow-before-handle gate and safe decision log. |
| OpenFGA outbound adapter/platform | Translate global actor, selected tenant and fixed action/resource into the privately pinned Check. No application SQL repository or entity/status lookup. |
| Graph model/tuples | Enabled global actor AND enabled selected tenant AND active membership AND matching identifiable permission source. Guard every future protected operational/admin path. |
| Protected validation operation | After allow, read its machine by trusted tenant/ID and return validation-only success or safe business failure. No manufacturing mutation. |
| Business PostgreSQL | Retained tenant, global actor directory, membership directory, location and machine records with tenant-safe constraints. Directory status fields do not feed authorization. |
| Structured logger | Correlated authorization decision and subsequent business outcome; allow does not imply business success. |
| Controlled initializer | Reproducible business/graph fixtures and exact v2 binding before readiness; no runtime lifecycle/admin endpoints. |

OpenFGA uses its own PostgreSQL-backed datastore in the proposed controlled environment. That provider implementation detail is separate from application PostgreSQL's business role and does not add a SQL lookup to the application authorization path. Tests can interrupt business storage while the provider/datastore remain available.

## Lifecycle and model evolution

The minimum model uses global `actor:<id>` identity and an enabled userset, tenant enabled/member relations and a trusted selected-tenant binding. A global actor disable affects all memberships; removing only A membership leaves B independent; disabling tenant A leaves B intact. Membership alone grants no manufacturing action. These are application-defined native FGA relations, not built-in user/tenant lifecycle CRUD.

A future lifecycle feature must authorize its initiator and then use native FGA Write/delete, preserving safe known/unknown outcomes. There is no automatic SQL or identity-provider synchronization. F01 retains tenant-membership administration; global-actor and whole-tenant lifecycle workflows require separately scoped future features. M0 models/tests the gates through isolated fixtures only.

Pin **authorization-m0-v2**, the exact model ID/hash and the explicit store. Reject an older binding and do not silently choose latest/reset on startup. No live migration is needed because no implementation exists; later deployed models need compatibility planning. Approved validation provider versions remain OpenFGA 1.22.0 and SDK 0.9.7.

## Risks, future work and next checkpoint

The [full delivery map and open gates](specs/EP-00-F01-govern-scoped-access.requirements.md#blocking-requirements-that-remain-open) remain visible:

- **G01:** Check→handle/Write still lacks the required effective-revocation acceptance ordering (BR03/AC06).
- **G02:** Resource/lifecycle business mutations or directory projections and FGA relations need safe effectiveness/failure/recovery design; request-time SQL fact reads are not the solution (BR05/AC07 and affected lifecycle guarantees).
- **G03:** Plain logs/current tuples do not provide full protected prior/resulting path history (BR06/full AC03/AC08).
- **G04:** Sequential group checks do not establish concurrent graph-mutation invariants (BR01/BR02/AC02).

Future milestones proceed through direct grant/revoke, hierarchy/independent sources, delegation/expiry, group administration, membership/relocation, remaining correctness gates and full verification. Resolve a gate before claiming its affected behavior. Superseded revision-4/5 SQL-status proposals are historical material, not current implementation instructions.

Provider failure prevents handle and business SQL. A graph denial remains valid during a business DB outage; a graph allow followed by a failed business read is a separate operation failure. Only known storage unavailability maps to business503; generic repository/unexpected errors stay500. There is no stale allow fallback, production SLA/capacity claim, audit framework or hidden coordination engine.

**Future implementation handoff:** after the user explicitly starts implementation in a new context window, **M0-01 configuration** is the proposed first stage, followed by evidence and stage review under the [approved handoff](specs/EP-00-F01-govern-scoped-access.requirements.md#backend-handoff--approved-revision-6-m0). Future F01 designs/implementations and F02–F10 specs remain pending. Documentation/compiler QA and M0 completion cannot establish full F01 or stakeholder business validation.
