# EP-00 — Authorization-First Incremental Platform Foundation

## Starting Proposal and Confirmed Direction

Begin the real Andromeda platform with the smallest useful authorization foundation, then expand its business capabilities incrementally. Use database seeds for exactly two synthetic tenants and minimal platform entities for users, tenant memberships, locations, machines, orders, product definitions and inventory. Implement real authorization using **OpenFGA**, selected by the requester, through ten recognizable manufacturing capabilities. The authorization, relationships, security-relevant state and decision history established here remain part of the platform as those capabilities grow. Temporary simplified or simulated downstream effects allow the team to concentrate first on the difficult permission boundaries.

The user confirmed this incremental construction of the real platform, continued reuse and evolution of its authorization, the two-tenant starting point, seeds, simplified entities, omission of authentication implementation in this delivery, OpenFGA and a package of seven to ten realistic use cases. This epic proposes ten. Its specific actors, permissions, hierarchy, separation rules, expiry behavior and scenario populations remain Product Owner proposals for review; the confirmed continuity direction does not mean those detailed policies have been approved or implemented.

This first delivery establishes a retained product foundation together with evidence that granular decisions remain correct across normal use, malicious combinations, access changes, operational state changes, concurrent attempts and authorization unavailability. Subsequent deliveries deepen these same protected capabilities and may refine or extend their authorization through explicit product decisions. Backend engineering will define the architecture and implementation for this first increment and its subsequent evolution.

## Problem, Beneficiaries and Expected Value

Previous attempts to advance the platform stalled over permission granularity, authorization volume and availability. Broad roles and a few permitted examples would not resolve that uncertainty. Operators, supervisors, process engineers, planners, stock handlers and tenant access administrators need narrowly scoped authority that remains understandable as people, machines, locations and responsibilities change.

The intended outcome is the platform's working minimum authorization foundation, exercised by an executable body of business examples and retained for later feature delivery. Operators and administrators gain the first narrowly scoped product operations; engineering gains a behavioral baseline for extending them. A positive response must demonstrate current authority for the requested action and scope. A refusal must prevent both operational effect and unintended disclosure. A temporary downstream simulation must preserve the real authorization decision, its governing relationships, the required business prerequisites and the evidence needed to explain the result.

## Product References

All sources belong to [Product Foundation](../../requirements/00-andromeda-manufacturing-product-foundation/00-andromeda-manufacturing.md).

| Source | Contribution to this package |
| --- | --- |
| [Access, accountability and controlled change](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md) | Action and scope, tenant isolation, temporary delegation, revocation, accountable changes and independent authority. |
| [Shared operating model](../../requirements/00-andromeda-manufacturing-product-foundation/04-operating-model-and-master-data.md) | Stable resource identity, organizational hierarchy, lifecycle and version relationships. |
| [Production and process engineering](../../requirements/00-andromeda-manufacturing-product-foundation/07-production-and-orchestration-requirements.md) | Product definitions, setup compatibility, order planning and execution, quantities and reasons. |
| [Operator interface and connectivity](../../requirements/00-andromeda-manufacturing-product-foundation/08-scada-connectivity-and-hmi-requirements.md) | Action meaning, prerequisites, effects and a common contract for humans and future agents. |
| [Materials, quality and logistics](../../requirements/00-andromeda-manufacturing-product-foundation/09-materials-quality-and-logistics-requirements.md) | Inventory movement, quality restrictions and distinct origin/destination responsibilities. |
| [Operational evidence and governance](../../requirements/00-andromeda-manufacturing-product-foundation/11-data-kpis-integrations-and-governance-requirements.md) | Attributable observations, corrections and scoped information access. |

## Delivery Scope and Limits

The package delivers the first minimal versions of ten protected platform capabilities, a repeatable two-tenant seed population and evidence from their authorization scenarios. Each capability uses real authorization for its stated object, action, actor, tenant and operational context. Authorization-changing operations must actually change the authority used by later decisions. Grants, memberships, groups, delegated ceilings, expiry, revocation and their effective outcomes are retained product behavior.

Minimal entities and the state needed for the integrated journey are real platform records populated initially by seeds. Accepted draft creation, order approval/release, software execution state, setup references, quantity/correction records, downtime classification, definition revisions and stock movement/balance changes retain the small amount of authoritative state and history required by the existing feature criteria. A later action must observe the actual accepted state and versions. Returning a mock success without creating the record or transition needed by later authorization and prerequisites does not satisfy this scope.

Business depth and downstream effects may remain temporarily simplified or simulated: equipment commands, complete production accounting, enterprise inventory posting, complex formula calculations and external integrations are deferred. Each result identifies the real platform record/state changed and any external or richer business effect still simulated. A software order can become running without claiming a physical machine started; a synthetic-tenant quantity or stock movement can be recorded without claiming official production or financial posting. This minimum state supports incremental delivery of the same platform features without requiring complete manufacturing modules now.

Authentication, credential handling, account onboarding, password flows and identity-provider integration are excluded. A controlled validation context selects an existing seeded identity and an active tenant membership. It does not prove who a real external person is and is not a production login mechanism. The evaluated membership, relationships and business facts cannot be replaced by assertions supplied by the acting subject. No complete user interface, machine connectivity, telemetry pipeline, rule editor, formula calculation engine, enterprise resource planning integration, cost accounting or production availability claim is included.

## Feature Package

| Feature | Contribution to the outcome | Dependencies and suggested order |
| --- | --- | --- |
| [EP-00-F01 — Govern scoped access](01-govern-scoped-access.md) | Real grants, limited delegation, expiry and revocation, including multiple access paths. | First; supplies authority changes used across all scenarios. |
| [EP-00-F02 — Discover and read operational information](02-discover-and-read-operational-information.md) | Scoped lists, direct reads, sensitive fields and protected action descriptions. | F01 and seeded hierarchy; applies across every module. |
| [EP-00-F03 — Create draft production orders](03-create-draft-production-orders.md) | Creation rights on a parent scope and authorized cross-object references. | F01–F02; precedes order approval. |
| [EP-00-F04 — Approve and release production orders](04-approve-and-release-production-orders.md) | Independent approval, release authority, revision integrity and self-approval refusal. | F03; released fixtures also permit isolated validation. |
| [EP-00-F05 — Prepare and apply machine setup](05-prepare-and-apply-machine-setup.md) | Machine-specific authority, parameter granularity and version compatibility. | F01–F02 and seeded definition versions. |
| [EP-00-F06 — Start an approved production order](06-start-an-approved-production-order.md) | Combined authority on order and machine plus current execution prerequisites. | F04–F05; no physical command. |
| [EP-00-F07 — Report and correct production quantities](07-report-and-correct-production-quantities.md) | Distinct good/scrap actions and controlled corrections on execution records. | F06; running fixtures allow isolated validation. |
| [EP-00-F08 — Justify and reclassify downtime](08-justify-and-reclassify-downtime.md) | Record ownership, reason scope and separate supervisory reclassification. | F02 and seeded downtime events. |
| [EP-00-F09 — Govern product definition revisions](09-govern-product-definition-revisions.md) | Product-level BOM/formula confidentiality and separate draft/approve/publish authority. | F01–F02; supplies version references to F03–F06. |
| [EP-00-F10 — Transfer inventory between locations](10-transfer-inventory-between-locations.md) | Origin and destination permissions together, lot context and quality restrictions. | F01–F02 and seeded inventory. |

Suggested increments are the retained access foundation (F01–F02), minimal protected order preparation and software execution (F03–F06), and production evidence plus cross-module boundaries (F07–F10). Each increment extends the same platform and preserves the authority and behavioral baseline already established. All ten remain part of this package; this sequence assigns neither dates nor team capacity. Later epics enrich these capabilities behind their existing protected operations, replacing temporary downstream simulations as their real business effects are delivered.

## Product Continuity and Evolution

The confirmed direction is to carry this authorization foundation forward into the real platform. Actions, scopes, tenant boundaries, hierarchy inheritance, group and delegation relationships, effective revocation, versioned configurable policies and decision evidence begin as product contracts in this delivery. The simplified entities are the initial product entities; seeds populate them with synthetic examples. Resetting an isolated fixture run does not make the product behavior, authorization work or acceptance baseline disposable.

| Retained foundation in this delivery | Incremental continuation |
| --- | --- |
| Real memberships, authority sources, scoped decisions and effective access changes. | Expanded features use these same protected capabilities and governing authority rather than creating a parallel authorization path. |
| Minimal actual records, relationships, versions and transitions required by the integrated journey. | Business entities gain detail while the meaning of the existing protected operations and their history remains traceable. |
| Action-specific read/write boundaries, independent approval, sensitive-field protection and explainable decisions. | New channels, interfaces and richer outcomes keep those boundaries; replacing a downstream simulation does not bypass a protected operation. |
| Behavioral acceptance scenarios and scoped decision evidence. | They remain a regression baseline for later increments, including tenant isolation, refusals and changed-access cases. |

Authorization may be adjusted, extended or refactored as the platform grows. New permissions, changed scopes, different hierarchy/delegation rules or revised business restrictions need an explicit, reviewable product change, an identifiable governing policy version where configuration changes, and updated acceptance scenarios. The impact on existing grants, active work and historical evidence must be stated. Existing behavior remains the baseline unless a deliberate revision changes it; the initial model is not frozen forever. Internal code, model representation and interfaces may be refactored or migrated while applicable authority remains effective, unless an explicit authorized change revises it. Synthetic seed identities do not require permanent production compatibility.

Each later feature expansion must identify the protected operation it continues, the authorization rules reused or deliberately revised, and the temporary effect it makes real. Its regression evidence must cover both the richer business result and the inherited authorization boundaries. Implementing an unprotected version of an existing capability or discarding its authorization in favor of a duplicate path would break this continuity contract.

## Shared Validation Population

### Tenant and Resource Context

All labels below identify synthetic records seeded into the minimal platform entities; they do not prescribe tenant-specific product behavior. Tenants A and B each have their own branding, local reason catalog and definition versions. Both deliberately reuse readable codes such as `P1`, `L1`, `M1`, `ORDER-01` and `LOT-01`; their stable identities and ownership differ. Tenant A also has a second plant to expose overbroad tenant-wide access.

| Tenant | Seeded physical and operational scope |
| --- | --- |
| A | Plant A-P1 → Area A-AREA1 → Line A-L1 → Machines A-M1 and A-M2; sibling Line A-L2 → Machine A-M3. Plant A-P2 → Area A-AREA2 → Line A-L3 → Machine A-M4. Warehouses A-W1 and A-W2 belong to A-P1; A-W3 belongs to A-P2. |
| B | Plant B-P1 → Area B-AREA1 → Line B-L1 → Machines B-M1 and B-M2. Warehouses B-W1 and B-W2 belong to B-P1. |
| Both | Draft, submitted, released, running, completed and cancelled order examples; published and draft setup/form/HMI versions; product definitions with BOM or formula variants; ordinary and sensitive fields; downtime with open and classified examples; available and quality-held lots. |

A warehouse is a location in the plant hierarchy, not a descendant of a production line. Orders reference one assigned machine, their tenant and product revision. Downtime, setup and quantity records reference their originating machine and, when relevant, order. Product definitions are tenant-owned with explicit permitted plant scope; machine access does not automatically reveal their composition. Inventory holds refer to a lot and its location. These relationships are business facts used to expose incorrect scope combinations.

### Actors and Authority Sources

An actor label identifies a user in the fixture set, not an all-powerful role. Permissions are assigned explicitly per feature. A role name alone never grants an unlisted capability.

| Actor | Intended baseline responsibility and boundary |
| --- | --- |
| A-OWNER | Tenant A access administration and access-history review; no implicit order approval, machine operation or formula access. |
| A-DELEGATE | Delegated access administrator for A-L1, limited to a stated grant ceiling and temporary period. |
| A-PLANNER | Read planning summaries and create/edit draft orders for A-P1; no independent order approval or execution. |
| A-APPROVER | Review and approve orders for A-L1; does not release them or approve an order they authored. |
| A-RELEASER | Release independently approved orders for A-L1; no implicit approval or start authority. |
| A-ENGINEER | Draft setup for A-M1 and draft product definition PROD-01; cannot publish their own definition revision. |
| A-SETUP | Apply compatible setup on A-M1 and change ordinary parameters; no critical-parameter override. |
| A-OPERATOR | Read/start/justify own downtime on A-M1. Good-quantity reporting has a direct A-M1 grant and an inheritable A-L1 group path, so that action can also cover A-M2 without granting its other actions. |
| A-SUPERVISOR | Read A-L1; correct quantities, record scrap and reclassify downtime there; special parameter override only where separately granted. |
| A-DEFINITION-APPROVER | Read restricted composition and approve PROD-01 revisions they did not author; no publish power. |
| A-PUBLISHER | Publish approved PROD-01 revisions; no composition editing or approval by implication. |
| A-STOCK | Read A-W1/A-W2, withdraw from A-W1 and receive into A-W2; no A-W3 movement authority. |
| A-AUDITOR | Read authorized decision/history evidence for A-P1; no modification or execution authority. |
| A-OBSERVER | Summary visibility for A-M1 and its orders; no sensitive composition, access-history or write rights. |
| A-NONE | Active Tenant A member with no protected action grants. |
| A-DISABLED | Inactive Tenant A membership retaining old historical grants, which must confer no current authority. |
| DUAL | One user with independent A and B memberships: read-only in A-M1; operational start authority only in B-M1. Rights never combine across tenant contexts. |
| A-AGENT | Distinct delegated service/agent principal owned by A-OWNER, with active A membership and temporary start authority only on A-M1 and A-ORDER-AGENT; the owner has no implicit start authority. |
| B counterparts | B-OWNER, B-PLANNER, B-APPROVER, B-RELEASER, B-ENGINEER, B-SETUP, B-OPERATOR, B-SUPERVISOR, B-DEFINITION-APPROVER, B-PUBLISHER, B-STOCK, B-AUDITOR and B-OBSERVER mirror the named A responsibilities within B scopes with independent memberships and grants. |
| OUTSIDER | No active membership in either tenant; knowing object identities confers no authority. |

Tenant A's `A-L1-OPERATORS` group grants good-quantity reporting to A-OPERATOR within A-L1. A direct A-M1 grant supplies a second path. An initially empty nested group may be used for a separate group-expansion variant without increasing rights beyond the outer group's stated scope. Fixtures also include an unexpired and an expired temporary grant for distinct isolated runs. No expiry duration or staffing schedule is represented as an organization-wide policy.

The fixture population is resettable and identified by a scenario version. Each run declares its starting memberships, groups, direct grants, delegated ceilings, resource relationships, version references and relevant business states. A scenario-specific permission addition, removal or state variation is explicit and isolated; it is not silently added to the baseline. DUAL's positive B start uses a separately released B-ORDER-DUAL, compatible B setup and both B order-start and machine-start grants. A-AGENT uses A-ORDER-AGENT in a separate run so starts do not compete with the operator's baseline. Expected outcomes come from the feature criteria, not the outcome returned by the authorization service. Negative scenarios deliberately vary one boundary at a time and include combined attempts with mismatched tenant, object, parent location and action.

## Cross-Cutting Product Boundaries

Tenant membership, current actor status and the requested action's scope constrain every feature. Hierarchy inheritance is action-specific: an explicitly inheritable grant on A-L1 may cover descendants for that action; it does not reach A-L2, a parent plant, warehouses, another action or another tenant. A machine grant does not become tenant-wide through an order or template relationship. No missing grant is treated as a universal explicit prohibition: removing one grant may leave another legitimate access path. Hard business restrictions, such as independent approval, inactive membership or a quality hold, remain binding despite broad grants.

Every protected outcome has a current decision at the point the operation is accepted. An earlier list, action description, form opening or successful attempt is not continuing authority. A revocation has a distinguishable requested/pending, failed or effective outcome. Only an acknowledged effective change establishes the boundary after which new protected operations must respect it. Already committed operations retain their history. Races around changes must produce explainable ordering and no successful action attributable to authority removed before that action's acceptance.

When authorization is unavailable or indeterminate, protected reads and writes do not succeed. The subject can distinguish inability to establish authority from an ordinary denied action without receiving foreign object details. A previous positive decision is not business permission to continue during an outage. This delivery includes no emergency bypass, offline operation or physical safety control.

All outcomes retain an authorized evidence view identifying actor, active tenant, action, requested object/scope, relevant scenario and configuration versions, result, reason category and time. Access changes also identify initiator, recipient, effective scope and source or removal path. The ordinary subject sees only information they may read; a scoped access administrator or auditor may inspect the fuller justification. Real platform records and access history remain distinguishable from any downstream business effect still simulated. Denied or indeterminate attempts create no protected business result and reveal no foreign content, names, counts, sensitive fields or branding.

Human and future agent consumers have the same action meaning, prerequisites and authority boundary. The seeded A-AGENT identity exercises an explicit owner, delegation ceiling, validity and revocation; no agent runtime or autonomous execution is delivered. Once the controlled validation context selects a subject, naming another identity in action inputs cannot replace that subject. Reading an action definition never grants execution rights.

## Volume, Availability and Confidence Evidence

The two-tenant population is the correctness baseline, not proof of production scale. Engineering must also run repeatable scale variants within those same tenants, preserving distinct identity and relationship boundaries. The eventual technical plan must state the populations, concurrent subjects, hierarchy depth, group expansion, grant paths, protected-action rate, access-change rate, run duration and environment for each measured result. No production population, latency target, throughput target, recovery time or service-level agreement has been supplied by the requester.

The proposed evidence progression starts with every deterministic allow/refuse scenario, continues with mixed concurrent reads and writes at growing populations, and introduces grants, expiries, revocations and membership/group removals while activity continues. It then exercises dependency interruption, slow or indeterminate decisions, recovery, repeated attempts and hierarchy/group changes. Read-heavy operational discovery, execution-heavy reporting and access-change bursts must be reported separately so averages do not hide a failure mode.

Results distinguish allowed, denied and indeterminate decisions, incorrect outcomes, time to an effective access change, action latency distributions, completed workload and behavior during interruption/recovery. A warm run and a fresh run must be identifiable. Numeric load steps and a candidate acceptance envelope are pending engineering capacity assumptions; correctness and refusal to proceed without authority are requirements at every tested size. Evidence may support only the measured envelope, never a general claim of unlimited volume or continuous availability.

## Integrated Outcome and Handoff

The package delivers one retained minimum product journey: scoped planning, independent approval and release, compatible setup, software order start, production evidence, controlled product revision and an inventory movement, while another tenant follows a similar journey with separate authority. Its actual minimal records, states and versions must support the next protected operation. Reviewers can then remove grants, group memberships and tenant membership, introduce conflicting contexts and interrupt authorization, and observe the revised authority boundary on those same capabilities.

Completion requires the working product foundation and its authorization evidence. The ten capabilities, effective access changes, minimum authoritative state and protected decision history must remain usable as the starting point for subsequent increments. Evidence alone, disconnected from retained platform behavior, does not complete the delivery. The handoff identifies temporary downstream simulations, the real records and authority already established, and the acceptance baseline future expansions must preserve or deliberately revise. Complete manufacturing functionality, authentication implementation and production readiness remain outside this package.

The backend handoff uses these fixtures and feature criteria as the business oracle and follows the [continuity contract](#product-continuity-and-evolution). Engineering owns architecture, OpenFGA modeling, persistence, consistency choices, concurrency handling, instrumentation, performance experiments and technical specifications. Internal implementation can evolve while the retained product behavior and history stay explainable. Any engineering choice that cannot satisfy the effective-change boundary or protected-read boundary requires a visible product decision before the limitation is treated as accepted behavior.

## Dependencies, Risks and Decisions to Review

Existing source requirements support the bounded package. The specific seed records and proposed policies need product review before being treated as enterprise-wide defaults; they do not block defining this first platform increment. Initial review should focus on independent order approval, separate release, parameter sensitivity, who may correct another person's record, composition confidentiality and dual-location stock authority. The features state concrete proposed behavior for each.

The main delivery risks are an overbroad inherited grant, unintended combination of cross-tenant rights, stale authority after a change, disagreement between list/detail/action decisions, and a temporary simulation hiding a missing business restriction or required platform state. Full manufacturing functionality and production readiness remain separate decisions. Authentication will be necessary before exposing these protected capabilities to real external users; its implementation remains outside this delivery.

Numeric scale and availability objectives must be agreed from engineering measurements and intended deployment assumptions before any production readiness claim. No sprint date, capacity or implementation progress is asserted here.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Requester-confirmed incremental platform foundation and continuity; ten proposed feature policies linked above. |
| Delivery | In progress | 2026-10-30 | F01 M0-01–10 accepted. Authorized M0-10 service startup/shutdown, including the user-requested reusable graceful shutdown extraction, is implemented and technically validated: 20 M0-10 unit cases and 10 real PostgreSQL/HTTP/native Node cases have passing evidence; revised full unit suite 109 passed, affected native-entrypoint suite 6 passed, strict typecheck/build passed. User bootstrap support review accepted on 2026-10-30, America/Sao_Paulo. [F01 execution evidence](../../../architecture/specs/EP-00-F01-govern-scoped-access.tasks.md#execution-evidence). M0-11 and later F01 work have not started; F01 and the epic remain incomplete. |
| Business validation | Not reported | — | No scenario execution or stakeholder approval recorded. |
