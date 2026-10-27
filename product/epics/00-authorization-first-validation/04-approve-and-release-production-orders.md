# EP-00-F04 — Approve and Release Production Orders

## Description and Value

An order must not become executable merely because its author also has broad permissions. This feature validates independent approval and separate release of a specific order revision, including controlled withdrawal before execution. It exposes authority that depends on both organizational scope and the actor's relationship to the work.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Lifecycles and controlled change](../../requirements/00-andromeda-manufacturing-product-foundation/04-operating-model-and-master-data.md#lifecycles-and-controlled-change).
- Requirement: [Govern operational changes](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md#govern-operational-changes).

This delivery proposes one deliberately strict approval/release policy to stress independent authority; it is not a configurable workflow engine.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

Minimum retained platform states are draft, submitted, approved, released and running. Submission, approval, rejection/return, release and withdrawal change the actual minimal order state and retain decision history used by later reads and F06 start checks. That small amount of real state is sufficient; no notifications, electronic signatures, production planning engine or physical dispatch is included.

The minimal state transitions and decision history are the first order-governance capability. Later approval workflows build on the same protected actions and deliberately evolve their policies under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F04-US01 — Obtain Independent Approval of My Order Revision

As a planner, I want another authorized person to review my submitted order so that its release is independently accountable. A-PLANNER submits a valid draft revision. A-APPROVER opens the permitted order, reviews that revision and approves or returns it with a reason. If the approver authored that revision, even a separately seeded approval grant must not permit self-approval. Returning a revision permits authorized draft correction; the corrected revision requires fresh approval.

### EP-00-F04-US02 — Release or Withdraw Work Before It Starts

As a production releaser, I want to release only independently approved work and withdraw it when appropriate so that an operator cannot start an invalid order. A-RELEASER has release authority for A-L1, independently of A-APPROVER. Release refers to the approved revision. Explicit withdrawal of release or approval before start changes scenario eligibility without erasing the earlier decision. Revoking an approver's future permission is a different action and does not silently cancel their valid past approval.

## Permission and Scope Matrix

| Action | Proposed grant | Required relationship/state boundary |
| --- | --- | --- |
| Submit own draft / recall own submission | A-PLANNER within A-P1 with current draft authority. | Submit from draft; recall only from submitted back to draft; cannot alter author/contributor attribution. |
| Approve/return order | A-APPROVER on A-L1; B-APPROVER on B-L1. | Submitted current revision; approver is not its author. |
| Release order | A-RELEASER on A-L1; independent B-RELEASER on B-L1. | Independently approved current revision; releaser is not its author. |
| Withdraw approval | A-APPROVER with explicit withdrawal authority on A-L1. | Before running; reason required; prior approval history remains. |
| Withdraw release | A-RELEASER with explicit withdrawal authority on A-L1. | Before running; reason required. |

## Business Rules

### EP-00-F04-BR01 — Distinct Actions Require Distinct Grants

Submission, approval, return, release and each withdrawal are separate protected actions on the order's actual scope. Read, create, access administration or one approval-stage grant does not imply another. A broad tenant grant remains subject to the independent-author restriction. A single nonauthor may hold both approve and release grants in a specific variant; baseline fixtures keep them separate.

### EP-00-F04-BR02 — Approval Attaches to a Revision and Independent Actor

Only a submitted current revision can be approved. The original order author and any material contributor retained across its revisions cannot approve or release it. Changing editor or author labels is not a way to manufacture independence. Recall by the original author and return by an authorized reviewer apply only from submitted back to draft; a return requires a reason. Approved/released work first needs the corresponding explicit withdrawal before it can be recalled/returned and corrected through F03. Material revision changes invalidate the old revision's eligibility for release; its historical approval remains an attributable past decision.

### EP-00-F04-BR03 — Release Is Not Start

Release requires the same currently approved revision, valid product references and an active release grant. Release alone grants no operator rights and confirms no physical execution. F06 checks current order/machine authority and operational prerequisites when start is attempted.

### EP-00-F04-BR04 — Permission Revocation and Approval Withdrawal Differ

Removing an approver's future authority blocks their later approvals; it does not retroactively erase a valid committed approval. Explicit approval withdrawal before start requires its own current grant and reason, returns the revision to submitted status and invalidates its release. Release withdrawal returns the revision to approved-but-unreleased status. Neither action silently reverses running work; post-start intervention is outside this delivery.

### EP-00-F04-BR05 — Concurrent Decisions Have One Explainable Outcome

Each accepted transition refers to the revision and prior state it acted on. A late approval of an old revision, repeated release or approval racing with withdrawal cannot create two contradictory current states. An operation accepted after its required authority is effectively revoked is refused. Unavailable or indeterminate authority cannot create an approved/released result.

### EP-00-F04-BR06 — Reasons and Decision Evidence Are Protected

Approval, return, release and withdrawal identify tenant, order/revision, actor, prior/resulting state, reason where required and governing scenario policy. Ordinary subjects receive only permitted context. Cross-tenant order references or mismatched parent scopes produce no transition or foreign disclosure.

## Acceptance Criteria

### EP-00-F04-AC01 — Complete Independent Approval and Release

Story: US01–US02. Rules: BR01–BR03. A-PLANNER submits revision 1; A-APPROVER approves it; A-RELEASER releases it. Each step has its own authority and evidence. Approval alone leaves start unavailable because release is still absent; release does not grant either actor start rights.

### EP-00-F04-AC02 — Refuse Self-Approval Despite Broad Grants

Story: US01. Rules: BR01–BR02. In an isolated fixture, A-PLANNER also receives approval and release grants. Approving or releasing their own authored revision remains refused, while an independently authored in-scope submitted revision can be considered under those grants. A-OWNER cannot bypass independence through access-administrator status.

### EP-00-F04-AC03 — Restrict Scope and Stage

Story: US01–US02. Rules: BR01–BR03, BR06. A-APPROVER cannot release, approve an A-L2 order or act on B-ORDER-01. A-RELEASER cannot approve. A draft, cancelled or running order cannot be approved/released through a submitted-order transition, even with current grants.

### EP-00-F04-AC04 — Require Fresh Review After Revision

Story: US01. Rules: BR02, BR05. When an authorized return/recall and draft correction produce revision 2, approval of revision 1 cannot release revision 2. A late approval request naming revision 1 creates no current approval for revision 2. Evidence retains both the old decision and new revision.

### EP-00-F04-AC05 — Remove Future Authority Without Rewriting History

Story: US02. Rule: BR04. After A-APPROVER validly approves an order, revoking that actor's approve permission blocks their next approval but preserves the committed decision. An otherwise authorized releaser can release that unchanged approved revision. The permission change is not mislabeled as approval withdrawal.

### EP-00-F04-AC06 — Withdraw Explicitly Before Start

Story: US02. Rules: BR04–BR06. With the required withdrawal grant and reason, approval withdrawal makes a released but unstarted order ineligible for start. Release withdrawal alone leaves it approved but unreleased. A missing grant/reason or an already running order prevents the proposed withdrawal and preserves visible history.

### EP-00-F04-AC07 — Handle Races and Unavailable Authority

Story: US01–US02. Rules: BR05–BR06. Overlapping approval, revision, release and withdrawal attempts leave one explainable current revision/state. No transition succeeds after its grant is acknowledged effectively removed. During authorization interruption, no approval or release is asserted; authorized reviewers distinguish unavailable authority from a denied actor or invalid visible state.

### EP-00-F04-AC08 — Mirror the Independent Tenant B Flow

Story: US01–US02. Rules: BR01–BR03, BR06. B-PLANNER, B-APPROVER and B-RELEASER complete the corresponding B flow using separate grants and B references. Any A actor lacking B authority is refused even when readable order codes match. DUAL's B start authority grants neither B approval nor A release.

## Dependencies and Pending Decisions

Depends on F01–F03 and feeds F06. The independent author rule, separate baseline release role and pre-start withdrawal semantics are proposed initial product policy. These concrete proposals have no blocking undefined behavior for technical specification; configurable approval thresholds, regulated signatures and post-start withdrawal belong to later deliveries.
