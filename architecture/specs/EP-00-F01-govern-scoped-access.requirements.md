# SPEC-EP-00-F01 — Requirements and Delivery Map

**Read in order:** Requirements (this document) → [Design](EP-00-F01-govern-scoped-access.design.md) → [Tasks](EP-00-F01-govern-scoped-access.tasks.md).

## Review state

| Field | Value |
| --- | --- |
| Package / revision | `SPEC-EP-00-F01` / **6** |
| Updated | 2026-10-30, America/Sao_Paulo |
| Source feature | [EP-00-F01 — Govern scoped access](../../product/epics/00-authorization-first-validation/01-govern-scoped-access.md) |
| Supporting sources | [EP-00 overview](../../product/epics/00-authorization-first-validation/00-epic.md), [security/access requirements](../../product/requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md), [operating model](../../product/requirements/00-andromeda-manufacturing-product-foundation/04-operating-model-and-master-data.md) |
| Architecture context | [Authorization platform context](../00-authorization-platform-context.md) |
| Approval status | **Approved — revision 6, M0 executable foundation only** |
| Implementation / current step | **in progress** / M0-01–10 accepted. M0-11 tenant entity contract is implemented and technically validated on 2026-10-30, America/Sao_Paulo; tenant entity review pending. M0-12 and later tasks not started. |
| F01 completion | **incomplete**; later milestones require design before implementation |
| Approval record / ADR | User approval on 2026-10-30, America/Sao_Paulo / [ADR-0001 — Accepted](../adrs/0001-m0-graph-authoritative-authorization-foundation.md) |

The requester explicitly chose three linked documents and incremental approval, with a complete design for the foundation and the remaining F01 mapped afterward. These are three parts of **one feature specification**, with one package revision. The user explicitly approved revision 6's M0 design on 2026-10-30 (“perfeito. spec aprovada”). This approval does not approve future milestone designs or complete F01. The accepted ADR records that approved scope. On 2026-10-30 the user clarified that this session is approval and ADR only: implementation remains not started, with no stage opened or currently authorized. Implementation will begin only after an explicit instruction in a new context window.

## What we will be able to demonstrate first

The backend now has runtime configuration source and unit checks from M0-01, the pure shared HTTP envelope from M0-02, shared repository failure categories from M0-03 and the observability port/mock from M0-04, alongside its package, compiler, build and test configuration. M0-05 adds the tested concrete Pino adapter; M0-10 now adds tested generic application bootstrap, while authorization remains pending. **Milestone 0 — Executable foundation (M0)** makes one real authorization path executable.

An operator selected by a controlled fixture runner requests a good-quantity permission validation for A-M1. The application sends its trusted identity context, fixed action and machine reference directly to OpenFGA. The graph requires an enabled global actor, enabled tenant, active membership and a valid permission source. Only after an allow does the protected operation read the machine from PostgreSQL using the trusted tenant and machine ID, then return an explicitly labelled validation result. It does not record a quantity or start a machine.

With the same action, A-M2 without a direct grant is refused without querying business SQL. B-M1 remains inaccessible from the A context, even though both tenants use the display code `M1`. If OpenFGA is unavailable or cannot provide a valid decision, the handler does not run. If authorization allows but the machine is missing or its business database is unavailable, the operation fails separately; the authorization decision is not relabelled as a denial.

This path, its records and its permission sources are retained. Later milestones extend them rather than replacing the foundation with another authorization mechanism.

## M0 requirements and completion evidence

These are engineering milestones within F01, not replacements for its product acceptance criteria.

| ID | Required result | Observable completion evidence |
| --- | --- | --- |
| M0-R01 | A real backend starts and stops with validated configuration, HTTP, PostgreSQL and structured logging. | Liveness and lifecycle checks; startup failures are safe and release acquired resources. |
| M0-R02 | Exactly two synthetic tenants own minimal location/machine records; actors have independent tenant memberships. | Real migrations, constraints and tenant-filtered reads; A/B `M1` identities cannot be confused. |
| M0-R03 | OpenFGA holds enabled-global-actor, enabled-tenant and active-membership gates plus identifiable direct permission sources in the versioned model. | Each gate independently blocks permission; global disable affects every tenant, while a membership change affects only that membership. |
| M0-R04 | One inherited `execute` gate authorizes without a SQL repository or entity/status lookup. | One fresh Check per invocation; only allow enters the handler and its business reader. Deny and indeterminate perform no business read. |
| M0-R05 | A provider-neutral `IdentityContext` supplies actor/tenant; the application declares the action. Mutable authorization state is persisted in the graph. | Server fixture injection now, verified-token context later; body/header/token-status assertions cannot override graph gates or persisted revocation. |
| M0-R06 | The protected validation reads a tenant-owned machine after allow and has no manufacturing effect. | Graph-unknown/foreign reference: safe 403 with no SQL. Allowed but absent business row: safe 404. Provider inability and subsequent business-storage failure remain distinguishable; rows are unchanged. |
| M0-R07 | Safe authorization-decision events and subsequent business-outcome events distinguish permission from operation success. | An allowed decision can be followed by business failure; no event claims manufacturing effects or exposes credentials, raw errors or foreign content. |
| M0-R08 | The demonstration is repeatable with real SQL and OpenFGA and explicitly bounded claims. | Named executed tests and counts, fixture/policy versions and actual results. Empty suites and planning checks are not runtime proof. |

M0 is complete only after all [M0 tasks and cases](EP-00-F01-govern-scoped-access.tasks.md#m0-execution-checklist) have execution evidence and their required review checkpoints are satisfied. M0 does not satisfy any complete F01 acceptance criterion by itself: those criteria include administrative changes or later capabilities.

## What M0 includes and defers

M0 includes retained `Tenant`, `Actor`, `TenantMembership`, `Location` and `Machine` business contracts, migrations and seeds; the minimum graph model and lifecycle-gate fixtures; a replaceable authorization port; a tenant-scoped machine reader used after allow; controlled identity injection; and safe logging. `Machine.locationId` remains required. SQL actor/membership status fields are business-directory projections, not inputs to authorization. Inherited authorization is deferred.

Authentication, account onboarding, Keycloak integration, AWS services, public identity selection, user interfaces, manufacturing writes and F02–F10 delivery are excluded. Runtime grant/revoke APIs, groups, delegation, expiry, tenant-membership administration, relocation and protected historical investigation are **later F01 work**, not removed requirements. Global-actor and whole-tenant lifecycle workflows belong to separately scoped future features; M0 models their gates and exercises them through controlled fixtures only. Full enterprise governance and production-readiness claims remain outside this epic.

## Delivery roadmap

The sequence below explains the journey. Detailed implementation checkboxes currently exist **only for M0**. A later milestone cannot start coding until its own design and applicable blocking decisions have been reviewed.

| Order | Milestone | What becomes possible | Design prerequisite / limit |
| --- | --- | --- | --- |
| 0 | **M0 — Executable foundation** | Authorize directly through OpenFGA, then read the business machine behind the execution gate. | Revision 6 M0 design approved; implementation in progress; M0-01–10 accepted; M0-11 technically validated, tenant entity review pending on 2026-10-30, America/Sao_Paulo. |
| 1 | **M1 — Direct grant and revoke** | An owner creates/removes one identifiable permission source in controlled sequential scenarios. | Specify grant/revoke slices and uncertain-write outcomes. No claim of the AC06 cutoff before G01. |
| 2 | **M2 — Hierarchy and independent paths** | Direct and line/group fixture paths coexist; removing one leaves another valid path. | Specify action-specific inheritance, source identity and scoped current-source inspection. |
| 3 | **M3 — Delegation and time** | Delegate within action/scope/time ceilings; expire and end dependent authority. | Specify create/end-delegation and delegated grant/revoke; forbid self-expansion and onward delegation. |
| 4 | **M4 — Group administration** | Add/remove members and bounded nesting without broadening authority. | Resolve G04 before claiming correctness for concurrent group changes. |
| 5 | **M5 — Membership and location changes** | Suspend one tenant membership; reassign a machine while preserving identity and original record context. | Resolve G02 before acknowledging reassignment as effective; include controlled old-order/event fixtures. |
| 6 | **M6 — Close remaining correctness gaps** | Establish effective-change ordering and protected path/history evidence. | Resolve G01/G03 and any remaining G02/G04 work; earlier milestones cannot bypass these gates. |
| 7 | **M7 — Complete F01 verification** | Demonstrate all F01 criteria, failures/recovery and the measured operating envelope. | All required designs and blocking gaps closed; no unmeasured scale/availability promise. |

## Blocking requirements that remain open

The simplified graph-authoritative decision path does not make Check→handle or SQL/FGA mutations atomic. Earlier revisions did not satisfy the guarantees below. They remain future design gates, not accepted product exclusions.

| Gate | Unresolved problem | Required next design result | Blocks |
| --- | --- | --- | --- |
| G01 | A request can pass Check, then a revocation is acknowledged, then the protected handler executes. | Define and verify the acceptance/effective-change ordering and safe pending/failed/effective outcomes. | BR03, AC06; full effective-revocation claims. |
| G02 | Resource registration/relocation or lifecycle business projections and FGA relations can disagree after a partial update. | Define mutation ownership, safe effectiveness and failure/recovery; authorization does not resolve this by reading SQL per request. | BR05, AC07 and affected lifecycle-change guarantees. |
| G03 | Structured logs and current tuple reads do not supply full protected prior/resulting path history. | Define retained evidence, scoped investigation and disclosure protection. | BR06 and full AC03/AC08 evidence. |
| G04 | Sequential bounded group checks do not establish invariants under concurrent graph changes. | Define supported mutation ordering and anti-escalation/cycle guarantees. | BR01/BR02, AC02 under concurrent changes. |

The [future design tasks](EP-00-F01-govern-scoped-access.tasks.md#after-m0-design-work-in-order) identify the owner and output of each gate. No snapshot, fence, audit database, coordination or reconciliation framework is silently reintroduced. The future reviewed design must justify whatever solution is selected.

## Complete F01 source map

The linked product feature remains the business source of truth. Every story, rule and criterion has a destination; **none is marked implemented or validated**.

| Source ID | Required behavior retained | Delivery destination |
| --- | --- | --- |
| EP-00-F01-US01 | Delegate a limited line responsibility. | M3–M4; foundation M0, owner primitives M1. |
| EP-00-F01-US02 | Remove authority deliberately and explain remaining paths. | M1–M2, M5–M7; G01–G03. |
| EP-00-F01-BR01 | Bounded action/scope/inheritance, safe groups and no cycles. | M1–M4; G04. |
| EP-00-F01-BR02 | Administration is separate; no self/tenant/onward escalation. | M0 membership/direct-action baseline; full M1/M3/M4. |
| EP-00-F01-BR03 | Independent sources; explicit pending/failed/effective change boundary. | M1–M2/M6; G01. |
| EP-00-F01-BR04 | Inclusive start/exclusive end, dependent authority and active membership. | M0 status baseline; full M3/M5. |
| EP-00-F01-BR05 | Current machine hierarchy governs access; original location remains history. | M2/M5; G02. |
| EP-00-F01-BR06 | Protected, attributable changes and prior/resulting authority evidence. | M0 safe-log baseline; full M1–M6; G03. |
| EP-00-F01-AC01 | Delegated M2-only good-report grant without implicit execution powers. | M1/M3; regression M7. |
| EP-00-F01-AC02 | Refuse direct/group escalation; support safe bounded nesting. | M3/M4; G04; regression M7. |
| EP-00-F01-AC03 | Remove direct, retain group, then remove group; explain sources. | M1/M2/M4/M6; G03; regression M7. |
| EP-00-F01-AC04 | Test exact expiry boundaries and governing-delegation removal. | M3; regression M7. |
| EP-00-F01-AC05 | Suspend DUAL in A only; disabled/outsider paths refuse. | M0 isolation/status baseline; full M5; regression M7. |
| EP-00-F01-AC06 | Explain concurrent acceptance against effective revocation. | M6; G01; regression M7. |
| EP-00-F01-AC07 | Move M1; update inherited old-record access, retain direct grant/history. | M2/M5; G02; regression M7. |
| EP-00-F01-AC08 | Protect administration/evidence; no asserted change during failure. | M0 dependency-failure baseline; full M1–M6; G03; regression M7. |

## Review history and next checkpoint

| Revision | Planning evidence and status |
| --- | --- |
| 1, historical | Unapproved generation/snapshot proposal. Its entity compilation/link QA applied only to that revision. |
| 2, historical | Unapproved gate/session/fence proposal. Three entity blocks compiled in `/tmp/andromeda-f01-r2-review-v59_fvd9`; that evidence is superseded. |
| 3, historical | Unapproved commented-records/simple Check→handle proposal. Thirteen contracts compiled in `/tmp/andromeda-f01-r3-review-al_c4ed8`; that QA applies only to that revision. |
| 4, historical | Dated 2026-10-28. Provider-decided management/condition proposal. Thirteen contracts compiled with strict optional/index settings in `/tmp/andromeda-f01-r4-review-7u_yawnu`; nine JSON examples parsed, 16 local links resolved, fences/whitespace checked and AC01–AC08 mapped. Model/authority/cycle semantics were reviewed conceptually. No provider/application/performance execution, approval, ADR or implementation. The detailed proposal is retained as [historical reference](EP-00-F01-govern-scoped-access.design.md#historical-revision-4-reference). |
| 5, historical | Unapproved three-document foundation design with a SQL fact reader and request-supplied status context. Superseded by revision 6. Planning QA: 41 local links, 12 JSON examples, 16 source IDs, 45 task dependencies and 24 case families; 11 M0 and 13 historical contract files compiled in `/tmp/andromeda-f01-r5-contracts-p6zicbpc`. No runtime/model execution or implementation. |
| 6 | Dated 2026-10-30. User-requested direct graph authorization with trusted identity context, persisted actor/tenant/membership gates and business SQL only after allow. The user explicitly approved this M0 design on 2026-10-30 (“perfeito. spec aprovada”); [ADR-0001](../adrs/0001-m0-graph-authoritative-authorization-foundation.md) is Accepted. Implementation remains not started; future milestone designs remain pending. Current planning QA is recorded in [Tasks](EP-00-F01-govern-scoped-access.tasks.md#documentation-verification). |

**Current execution update — 2026-10-30, America/Sao_Paulo:** M0-01–10 are accepted. The user explicitly authorized M0-11. `src/modules/tenant/entity/tenant.entity.ts` now contains the complete approved pure `TenantEntityInterface` with required string `id` and `code`: stable identity scopes tenant-owned records, and display code is not authority. The source exactly matches the current M0 Design block. `npm run typecheck` passed for the tenant portion of TC-M0-06; no runtime test or build was needed for this type-only contract. M0-11 is technically validated with tenant entity review pending; M0-12 and later tasks have not started. [Execution evidence](EP-00-F01-govern-scoped-access.tasks.md#execution-evidence) preserves earlier checks. M0/F01 remain in progress.

**Next checkpoint:** review M0-11 tenant entity. User acceptance is pending; M0-12 and later tasks have not started. M0/F01 remain in progress and business validation remains unreported.

## Backend handoff — approved revision 6 M0

| Handoff item | Execution contract |
| --- | --- |
| Source and approval | Complete EP-00-F01 source linked above; SPEC-EP-00-F01 revision 6 approved **for M0 only** on 2026-10-30. [ADR-0001](../adrs/0001-m0-graph-authoritative-authorization-foundation.md) records the decision. |
| Completed first stage | **M0-01 — runtime configuration** started by the user's explicit instruction on 2026-10-30 in a new context. Following the user's organization revision, outputs are `src/configs/database/{schema,interface}.ts`, `src/configs/runtimeconfig/{schema,error,interface,load-runtime-config,load-runtime-config.test}.ts` and a configuration-only `src/main.ts`. OpenFGA-specific configuration remains M0-26a. |
| M0-01 entry and completion | No task dependency. Configuration code/checks are complete: 33 unit tests, strict typecheck, build and two built-entrypoint smoke scenarios passed for the applicable TC-M0-01 HTTP/business DB/validation flag scope. User configuration review was accepted on 2026-10-30, America/Sao_Paulo. |
| Completed shared HTTP stage | **M0-02 — shared HTTP response contract** exports pure success/error interfaces and their discriminated union from `src/modules/@shared/http/http-response.ts`. TC-M0-02 compiler verification passed; the user's instruction to continue to task 3 accepted the M0-02 review on 2026-10-30. |
| Completed shared errors stage | **M0-03 — shared repository failure categories** adds `RepositoryError` and `RepositoryUnavailableError` with native optional `ErrorOptions` in `src/modules/@shared/errors/repository.error.ts`. Strict typecheck and focused temporary runtime checks passed; user shared errors review was accepted on 2026-10-30, America/Sao_Paulo. |
| Completed observability port stage | **M0-04 — observability port and mock** explicitly authorized on 2026-10-30; no task dependency. `src/modules/@shared/observability/observability.ts` defines structured event/capture operations and readonly context entries; `observability.mock.ts` provides fresh typed Vitest spies. TC-M0-02 compiler verification passed for this task; user observability review was accepted on 2026-10-30, America/Sao_Paulo. Its later logger implementation is recorded separately below. |
| Accepted logger stage | **M0-05 — observability organization correction**, explicitly requested during review on 2026-10-30. Shared interfaces, field list, selection and builders have separate files; Pino imports builders directly and only emits prepared payloads. The mapper and M0-04 port/mock are unchanged. All 77 tests in six files and strict typecheck passed; final user review accepted on 2026-10-30, America/Sao_Paulo, including both corrections. |
| Accepted HTTP stage | **M0-06 — HTTP server lifecycle**, explicitly started on 2026-10-30. `src/platform/http/server.ts` exposes async start/stop with injected routes, JSON parsing and minimal `/health` on the validated loopback host. Twelve real HTTP cases and all existing unit cases passed: 89 tests in seven files; strict typecheck/build passed. User HTTP review accepted on 2026-10-30, America/Sao_Paulo. M0-07 is recorded separately below. |
| Accepted SQL test infrastructure stage | **M0-07 — disposable PostgreSQL test setup**, explicitly started on 2026-10-30. `src/modules/@shared/tests/testcontainers/setup-postgres.ts` returns container/settings/async teardown without datasource, migrations or business imports. Eight real PostgreSQL integration cases, strict typecheck and build passed; no containers from the run remained. User SQL test infrastructure review accepted on 2026-10-30, America/Sao_Paulo. M0-08 is recorded separately below. |
| Accepted PostgreSQL connection stage | **M0-08 — PostgreSQL connection lifecycle**, authorized by the M0-07 approval under the preceding review question on 2026-10-30. `src/platform/database/postgres/data-source.ts` creates/initializes/closes the configured datasource with schema automation disabled and safe, code-specific failure translation. Thirty-eight focused cases passed (10 lifecycle/configuration cases using real PostgreSQL plus 28 injected classification variations), strict typecheck/build passed, and no test-owned containers remained. User database connection review accepted on 2026-10-30, America/Sao_Paulo. M0-09 is recorded separately below. |
| Accepted migration stage | **M0-09 — migration runner and SQL packaging**, explicitly authorized after M0-08 acceptance on 2026-10-30. Runtime support lives in `migrate.ts` / `read-migration-sql.ts`; app-local tsup emits clean independent wrapper entries and colocated SQL. Six real PostgreSQL/build cases, strict typecheck and build passed; no test-owned containers remained. User migration support review accepted on 2026-10-30, America/Sao_Paulo. |
| Completed bootstrap stage | **M0-10 — service startup and shutdown**, explicitly authorized on 2026-10-30. `src/platform/bootstrap.ts` orchestrates injected database/HTTP lifecycles; `src/platform/graceful-shutdown/register-graceful-shutdown.ts` registers generic shutdown/error callbacks and returns a listener disposer; `src/main.ts` composes the accepted adapters, runtime migration flag and shutdown invocation. Twenty M0-10 unit cases and ten real PostgreSQL/HTTP/native Node cases have passing evidence; revised full unit suite: 109 passing tests, affected native-entrypoint suite: 6 passing tests; strict typecheck/build passed. User bootstrap support review accepted on 2026-10-30, America/Sao_Paulo. |
| Current stage | **M0-11 — tenant entity contract**, explicitly authorized on 2026-10-30. `src/modules/tenant/entity/tenant.entity.ts` copies the complete current M0 Design contract exactly; both fields are required strings, with no imports or behavior. TC-M0-06 tenant compiler verification and strict app typecheck passed. Tenant entity review pending; M0-12 and later tasks have not started. |
| Subsequent sequence | Once implementation is explicitly started, follow Tasks: support → five entity contracts/schema/mappings/seeds → neutral ports and separate business reader → provider model/binding/adapter → shared gate/protected operation → HTTP/wire → E2E. Each changed area/layer retains its own review gate. |
| Modules/contracts | `tenant`, `identity`, `location`, `machine`, `authorization` and required shared/platform support. Implement the [complete M0 contracts](EP-00-F01-govern-scoped-access.design.md#complete-m0-contracts) and [five business entities](EP-00-F01-govern-scoped-access.design.md#complete-m0-business-entity-contracts), not superseded historical alternatives. |
| Critical boundaries | No application SQL dependency/status facts in authorization; same trusted actor/tenant context; all graph gates; business machine read only after allow; explicit v2 binding; safe separate decision/business outcomes. |
| Verification | Task-linked TC-M0-01–29 cover compiler/unit/real SQL/real FGA/assembled flows at their assigned stages. Documentation QA is not execution evidence; empty test-suite success is not verification. |
| Readiness and limits | M0 design/ADR are ready. M0-01–04 are technically validated and accepted; M0-05 is technically validated and accepted on 2026-10-30, America/Sao_Paulo, including the final responsibility and file-organization corrections. Shared observability metadata must come from trusted producers; its payload builders do not infer tenant ownership or detect secrets disguised as valid identifiers. Pino owns no application payload/category policy. Authorization/business event producers and assembled behavior remain later tasks. Business-repository driver classification, HTTP error mapping, provider binding/timeout, business schema/persistence/FGA integration and E2E remain pending. M0-10 verifies generic service startup/shutdown only; user bootstrap support review was accepted on 2026-10-30, America/Sao_Paulo. Routes remain empty until M0-41, and no production migration exists until M0-16. No forced shutdown timeout or automatic process-level cleanup retry is introduced. M0-08 verifies only generic connection lifecycle and its error translation; user database connection review was accepted on 2026-10-30, America/Sao_Paulo. M0-09 verifies transactional migrations and packaging with temporary generic probes only; user migration support review was accepted on 2026-10-30, America/Sao_Paulo. M0-06 HTTP review is accepted; M0-07 verifies generic test PostgreSQL only; its user review was accepted on 2026-10-30, America/Sao_Paulo. G01–G04 and M1–M7 remain open; F01 is incomplete. |
| Ownership | Backend owns current execution status/evidence and stage review. Material design changes return to Architect for revision/approval; routine implementation choices remain with Backend. |
