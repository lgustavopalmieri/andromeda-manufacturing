# EP-00-F06 — Start an Approved Production Order

## Description and Value

An operator must be authorized for both the requested order and the machine that will execute it. A readable released order, machine ownership or a previous successful check is insufficient on its own. This feature combines object relationships, current authority and execution prerequisites in the platform’s first minimal software order-start action.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Follow execution and responsibility](../../requirements/00-andromeda-manufacturing-product-foundation/07-production-and-orchestration-requirements.md#follow-execution-and-responsibility).
- Requirement: [A configurable HMI and a shared action contract](../../requirements/00-andromeda-manufacturing-product-foundation/08-scada-connectivity-and-hmi-requirements.md#a-configurable-hmi-and-a-shared-action-contract).
- Requirement: [Organization isolation and contextual access](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md#organization-isolation-and-contextual-access).

The feature validates the action contract for a human and a separately seeded delegated agent identity. It does not enable autonomous production or physical commands.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

An accepted start changes the actual minimal platform order from released to running, retains its responsible identity and pinned versions, and updates the software occupancy state needed by later start/report checks. A mock accepted response cannot replace that state transition. The recorded running state describes software order execution; equipment confirmation remains a deferred downstream effect. No PLC, machine connection, safety system or actual production is controlled. Pause, resume, close and cancellation are excluded. A-AGENT is a distinct seeded principal owned by A-OWNER with a revocable delegation ceiling, not a running AI system or a substitute for authentication.

This protected software transition is the first order-start capability. Later equipment interaction adds its stated effect behind the same order/machine authority and versioned action meaning under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F06-US01 — Start Only My Released Work on My Machine

As an operator, I want to start a released order assigned to my authorized machine so that execution begins under the intended instructions. A-OPERATOR starts in A context with separate start authority on A-M1 and A-ORDER-01. The order is independently approved/released and has compatible applied setup. The accepted transition retains the running order, machine and governing versions for subsequent reads and quantity reporting. Supplying a different order or machine, or losing either permission before acceptance, prevents start.

### EP-00-F06-US02 — Exercise a Revocable Delegated Actor

As a tenant owner, I want a separately identified delegated agent to perform only an explicitly bounded software order start so that future automated consumers face the same authority constraints as humans. A-AGENT has active A membership, explicit A-M1/A-ORDER-AGENT start grants, a named owner and a valid delegation window. Its action uses the same prerequisite and effect description. The owner has access administration but no implicit operational rights; neither side can borrow the other's permissions. Ending the delegation prevents the agent's next action.

## Permission and Scope Matrix

| Action | Proposed baseline grant | Independent requirement |
| --- | --- | --- |
| Start machine context | A-OPERATOR on A-M1; B-OPERATOR and DUAL on B-M1. | Start authority on the requested order. |
| Start order | A-OPERATOR on A-ORDER-01; B-OPERATOR on B-ORDER-01; DUAL on separately released B-ORDER-DUAL. | Order belongs to and is assigned to the permitted machine. |
| Delegated software order start | A-AGENT on A-M1 and A-ORDER-AGENT under an active delegation. | Owner, validity and scope ceiling; no approval/setup/grant authority. |
| Read action contract | F02 within readable scope. | Execute authority is never inferred from description access. |

## Business Rules

### EP-00-F06-BR01 — Combine Permissions for the Same Context

Start requires an active tenant membership, current order-start authority and current machine-start authority in that same tenant. The order's actual assigned machine must equal the requested machine. A-M1 authority plus an A-M2 order is insufficient; A authority and B authority never combine. A broader inheritable grant may provide one or both actions only when each is explicitly included in that grant.

### EP-00-F06-BR02 — Authority Does Not Replace Operational Eligibility

The order must be released for its current independently approved revision, unstarted, assigned to the machine and linked to a compatible applied setup/product revision. A withdrawn release or approval, missing setup, cancelled/completed state or another running scenario order on the machine prevents start. Under F09's proposed policy, an unstarted order referencing a product revision replaced for new work needs an authorized order revision and fresh approval/release before start; only already started work keeps using its pinned prior definition. Broad permissions or an access-administrator role do not waive these gates.

### EP-00-F06-BR03 — Delegated Principals Have Their Own Authority

A-AGENT is separate from its owner and from A-OPERATOR. It needs active membership, current scoped grants and an active delegation whose ceiling permits this action. Ending or expiring that delegation invalidates the derived authority. Once the controlled validation context selects A-OWNER or another subject, naming A-AGENT in action inputs cannot switch the acting principal. The validation runner may deliberately select the seeded agent for its isolated scenario; that selection does not constitute production authentication. Reading the contract is insufficient for either identity.

### EP-00-F06-BR04 — Accepted Execution Pins Its Versions

The result identifies order revision, product revision, applied setup/form version and operator-interface version. These remain the versions of that accepted start after later publications. Starting creates no approval or setup privilege and no broad access to confidential product composition. Evidence identifies the actual software transition and the deferred equipment effect; no physical machine-running confirmation is invented.

### EP-00-F06-BR05 — Acceptance Rechecks and Has One Outcome

Effective authority removal before acceptance prevents a start, including a form/action opened earlier. Concurrent attempts cannot create two accepted starts for the same scenario order or conflicting occupancy. Already committed software starts are not erased by later permission revocation. Denied, invalid-prerequisite and unavailable-authority outcomes are distinct for authorized observers; no foreign data is revealed.

## Acceptance Criteria

### EP-00-F06-AC01 — Accept the Complete Permitted Start

Story: US01. Rules: BR01–BR02, BR04. A-OPERATOR starts released A-ORDER-01 on A-M1 with matching current grants and setup. The result records one actual software start, responsible identity and pinned versions; later reads and F07 reporting use that same running order. It confirms neither physical motion nor machine-controller acceptance.

### EP-00-F06-AC02 — Refuse Missing One Side of Authority

Story: US01. Rule: BR01. Isolated variants remove machine-start or order-start authority in turn while keeping all operational prerequisites valid. Each attempt is refused. Reading the order, applying setup or approving it supplies no missing start grant.

### EP-00-F06-AC03 — Refuse Mismatched Resource Relationships

Story: US01. Rule: BR01. A permitted A-M1 starter cannot start an order assigned to A-M2 by naming A-M1 as context. Combining a B order with A-M1 or A tenant context produces no start and no B details. Correct readable codes do not override stable ownership and assignment.

### EP-00-F06-AC04 — Enforce State and Revision Prerequisites

Story: US01. Rule: BR02. An otherwise authorized actor cannot start an unreleased, withdrawn, completed/cancelled, already running or revision-mismatched order, nor one lacking compatible setup. A replaced product revision on an unstarted order requires authorized revision and fresh approval/release rather than silent migration. For an actor authorized to inspect it, the result identifies the failed prerequisite rather than claiming authorization itself supplied readiness.

### EP-00-F06-AC05 — Verify Asymmetric Dual-Tenant Membership

Story: US01. Rule: BR01. The B-ORDER-DUAL fixture is independently released, assigned to B-M1, has compatible B setup and no competing running order. DUAL's separately seeded B order/machine start grants permit that B-context start. The same person remains read-only in A and cannot start A-ORDER-01 or transplant B permissions into A context.

### EP-00-F06-AC06 — Bound and Revoke the Independent Agent

Story: US02. Rule: BR03. With A-ORDER-AGENT independently released and A-M1 available in an isolated run, A-AGENT can perform only its delegated software order start. It cannot approve, change setup, grant permissions or use A-M2. After effective delegation revocation/expiry its next start is refused; A-OWNER cannot start through owner status or borrow the agent identity's permissions.

### EP-00-F06-AC07 — Prevent Stale and Duplicate Acceptance

Story: US01–US02. Rule: BR05. Two concurrent valid start attempts leave one accepted software start and one visible nonaccepted result. If a required grant or release becomes effectively removed before acceptance, the later start cannot succeed. A start committed earlier remains attributable rather than being silently undone.

### EP-00-F06-AC08 — Preserve Versions and Refuse Unverifiable Starts

Story: US01–US02. Rules: BR04–BR05. Publishing product/setup/HMI version 2 leaves a started order linked to version 1. During authorization interruption, no successful start is asserted. Recovery reevaluates current grants, delegation and state, and supplies no stale positive fallback.

## Dependencies and Pending Decisions

Depends on F01–F05 and seeded versioned action definitions; F09 supplies product versions. F07 consumes running-order context. The dual object checks, agent delegation ceiling and single active software order per machine rule are proposed initial product policy. There are no blocking product questions; actual device commands, physical safety confirmation and an agent runtime are excluded.
