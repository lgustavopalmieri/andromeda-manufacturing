# EP-00-F03 — Create Draft Production Orders

## Description and Value

Planners need to create work in a permitted plant without using a readable machine or product as a route to broader authority. Creation is especially important to validate because the new order has no existing object grant: authority must come from its legitimate destination scope. This feature creates the platform’s initial minimal draft with real authorization, valid references and attributable ownership, while leaving scheduling and production planning calculations out of scope.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Plan and dispatch with explainable constraints](../../requirements/00-andromeda-manufacturing-product-foundation/07-production-and-orchestration-requirements.md#plan-and-dispatch-with-explainable-constraints).
- Requirement: [Master information and ownership](../../requirements/00-andromeda-manufacturing-product-foundation/04-operating-model-and-master-data.md#master-information-and-ownership).

The feature validates scoped order creation and reference use, not a full planning or dispatch module.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

A draft contains a tenant, destination location, assigned machine, product revision, quantity/unit and author. Accepted creation retains that actual minimal platform draft, its revision and authorship/history so that F02 can read it and F04 can review the same record. Seeds provide starting examples; a returned mock success alone cannot stand in for this accepted draft. Rich planning calculations and downstream planning effects may remain simplified or temporarily simulated. Approval, release and execution are separate features. No capacity optimizer, detailed routing, material reservation or enterprise planning integration is delivered.

This draft and its authorization are the initial order-creation capability of the platform. Later planning depth extends the same protected operation and retained draft identity/history under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F03-US01 — Create Work in My Planning Scope

As a planner, I want to create a draft order for an authorized plant and product so that a supervisor can review the proposed work. A-PLANNER starts with A-P1 create authority, permitted machine context and explicit use authority for published PROD-01 revision 1. The planner chooses A-M1, quantity and unit. The accepted result identifies a draft, its author, revision and scenario status. Changing the destination to A-P2, another tenant or a product outside the planner's use scope is refused without creating a partial draft.

### EP-00-F03-US02 — Revise a Draft Without Acquiring Execution Power

As a planner, I want to revise a draft within my allowed scope so that errors can be corrected before review. The planner opens a readable draft and uses separately granted draft-edit authority. A material change creates the next draft revision with prior values attributable. Editing cannot move the order to an unauthorized machine, replace a pinned definition with an inaccessible one or grant the author approval/start authority. A submitted or started order is not silently edited through the draft operation.

## Permission and Scope Matrix

| Action | Proposed baseline grant | Independent boundary |
| --- | --- | --- |
| Create order | A-PLANNER for descendant production resources of A-P1; B-PLANNER within B-P1. | Read alone, parent name supplied by caller and tenant membership are insufficient. |
| Use product revision in an order | A-PLANNER for published PROD-01 revisions valid in A-P1. | Composition-read, definition-edit or publish authority is not implied. |
| Edit draft | A-PLANNER for A-P1 drafts with a current edit grant. | Creator status alone is not permanent edit authority. |
| Read draft | F02 read scope. | Creation does not automatically grant approval, release or execution. |

## Business Rules

### EP-00-F03-BR01 — Authorize the Real Destination

Creation requires current create authority on the actual destination location and machine context in the active tenant. The machine's real parentage determines scope. Supplying A-L1 while referencing A-M4 cannot make A-M4 eligible. All references must belong to that same tenant; rights in separate memberships cannot be combined.

### EP-00-F03-BR02 — Reference Use Is Distinct from Confidential Read

The planner must be allowed to use the selected product revision for that plant and read the operational identity of the assigned machine. Product summary visibility alone does not grant use. Use does not grant composition read or editing. An unpublished, ineffective, obsolete-for-new-work or incompatible revision cannot be chosen for a new order even by a broadly authorized planner.

### EP-00-F03-BR03 — Drafts Retain Authorship and Version

An accepted draft records its original author, tenant, machine, product revision, quantity/unit and draft revision. Editing requires current edit authority and creates attributable revision history with immutable material-contributor identities. These identities remain associated across revisions so changing editors cannot manufacture an independent approver. A positive quantity and an allowed fixture unit are minimal prerequisites; invalid values yield no successful draft. The author cannot assign a different author or an approved/released state to bypass independent review.

### EP-00-F03-BR04 — Scope Changes Require the New Destination's Authority

Changing the machine or plant is a material draft revision and requires create authority at the new destination in addition to edit authority on the draft. The action cannot operate on submitted, released or running orders as if they were drafts. F04 governs return to review and subsequent approval.

### EP-00-F03-BR05 — Acceptance Is Current and All-or-Nothing

The effective membership, permissions, referenced versions and state are checked when accepting creation or editing. After effective permission removal the next attempt is refused. Missing authority is distinguished from an invalid prerequisite only when the actor may see the relevant facts. Unavailable authority yields no successful draft, reference binding or side effect. An accepted result identifies the actual retained draft/revision and any richer downstream effect still simulated.

## Acceptance Criteria

### EP-00-F03-AC01 — Create in a Permitted Parent Scope

Story: US01. Rules: BR01–BR03. A-PLANNER creates a draft for A-M1 using authorized PROD-01 revision 1, a positive quantity and permitted unit. The result identifies the retained platform draft with A tenant, actual machine context, author and revision; an authorized read and the next F04 step use that same record. No approve, release or start right is added.

### EP-00-F03-AC02 — Refuse Read-Only and Misstated Parent Attempts

Story: US01. Rule: BR01. A-OBSERVER reads A-M1 but cannot create an order there. A-PLANNER cannot create for A-M4 by presenting A-L1 as parent, nor for B-M1 using A-P1. No partial or differently scoped order is created, and foreign details remain undisclosed.

### EP-00-F03-AC03 — Restrict Product References Independently

Story: US01. Rule: BR02. A-PLANNER can use PROD-01 without reading its composition. A readable product lacking use permission, a B product or a draft/incompatible revision cannot be bound to the new order. A permitted planner receives a prerequisite refusal for a visible incompatible revision, not an authorization success mislabeled as creation.

### EP-00-F03-AC04 — Revise with Current Rights

Story: US02. Rules: BR03–BR04. A-PLANNER with edit authority changes a draft's quantity, producing a new attributable revision. After that edit authority becomes effectively removed, being the original author does not permit another edit. An attempted change of author, approval state or unauthorized destination is refused.

### EP-00-F03-AC05 — Prevent Editing Around Review

Story: US02. Rules: BR03–BR04. A submitted, released or running fixture cannot be changed through draft editing. A draft moved from A-P1 to A-P2 is refused without new-destination authority; the original draft revision remains the current version for that scenario.

### EP-00-F03-AC06 — Reject Invalid Values Without Inventing Authority

Story: US01. Rules: BR03, BR05. A permitted planner supplying zero/negative quantity or an unsupported fixture unit receives a visible prerequisite refusal and no draft success. An unauthorized subject does not learn the product's private validation rules through the same attempt.

### EP-00-F03-AC07 — Recheck After Access Changes or Interruption

Story: US01–US02. Rule: BR05. Opening a valid draft form and then losing membership or create/use authority causes a later submission to be refused. An indeterminate/unavailable decision creates no successful draft. A fresh authorized retry after recovery follows the current fixture state.

### EP-00-F03-AC08 — Keep Tenant B's Creation Independent

Story: US01. Rules: BR01, BR05. B-PLANNER creates a B draft with B references under B grants. DUAL's A read permission and B start permission cannot be combined into creation authority in either tenant. Shared readable order codes reveal no cross-tenant draft or author.

## Dependencies and Pending Decisions

Depends on F01 access governance, F02 visibility and the seeded published product versions also exercised by F09. F04 consumes the draft's authorship and revision. Product-use authority and new-destination checks are proposed initial product policies. There are no blocking scope questions; scheduling, order imports and post-start replanning are excluded.
