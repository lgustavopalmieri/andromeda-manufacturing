# EP-00-F02 — Discover and Read Operational Information

## Description and Value

An operator must see their assigned work without learning another line's orders or another tenant's identity. A planner may read an order summary without seeing a confidential formula, and an auditor may inspect decisions without operating equipment. This feature makes list, search, direct detail and sensitive-field access consistent across the simplified modules.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Organization isolation and contextual access](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md#organization-isolation-and-contextual-access).
- Requirement: [A configurable HMI and a shared action contract](../../requirements/00-andromeda-manufacturing-product-foundation/08-scada-connectivity-and-hmi-requirements.md#a-configurable-hmi-and-a-shared-action-contract).

This delivery supplies the business visibility boundary for all seeded operational objects and action definitions. A complete dashboard, reporting engine and export subsystem are excluded.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

The feature reads the epic's seeded locations, machines, orders, setup/HMI versions, product summaries, inventory summaries and scoped decision history. It includes collection discovery, direct identity access and protected action descriptions. Other feature files govern each action's execution. Sensitive composition, commercial values and access-history explanations are separately controlled; a summary view does not contain them.

These visibility and field-protection boundaries remain the read contract as lists, interfaces and reporting grow. Later views use the same current authority and scoped decision history under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F02-US01 — Find Only the Work I May See

As an operator, I want lists and direct reads to show the same permitted resources so that I can find my work without gaining broader visibility through search. A-OPERATOR enters active Tenant A context and searches readable code M1 or orders for A-M1. The result contains authorized A objects only, even though Tenant B uses the same readable codes. Opening a permitted item shows its authorized fields and context. Changing a requested parent, search filter, page or object identity does not expand scope.

### EP-00-F02-US02 — Share Summaries Without Disclosing Restricted Detail

As a process owner, I want colleagues to read operational summaries without exposing formula composition or granting execution. A-OBSERVER can read the order's product name and revision but not the restricted composition or commercial value. A-DEFINITION-APPROVER has separate composition-read authority for PROD-01. Both can read an authorized action description where permitted; neither gains permission to execute an action from reading it. A scoped auditor can inspect permitted evidence without changing it.

## Permission and Scope Matrix

| Read action | Baseline grant | Separate authority required |
| --- | --- | --- |
| Operational summary/list | A-OPERATOR and A-OBSERVER on A-M1; A-SUPERVISOR on inheritable A-L1; A-PLANNER on A-P1 planning objects. | Sibling plant/line, another tenant or confidential fields. |
| Order/setup/detail | Explicit object read or corresponding inheritable operational scope. | Permission on a referenced definition's protected content. |
| Product composition/commercial detail | A-ENGINEER and A-DEFINITION-APPROVER on PROD-01 composition; commercial values withheld unless separately granted in a scenario. | Ordinary summary read is insufficient. |
| Decision/access history | A-OWNER for A; A-AUDITOR for A-P1. | Operational read does not imply history or grant-path read. |
| Action definition | Within readable object's authorized action-description scope. | Execution requires the action-specific authority in its feature. |

## Business Rules

### EP-00-F02-BR01 — Scope Constrains Discovery and Detail

An active membership and current read grant are required for every returned object. Lists, searches, totals, grouped summaries and page navigation reflect only authorized objects. A filter narrows authorized results; it cannot assert new scope. A requested parent must genuinely contain the object. Foreign names, branding, counts and existence cannot be inferred through an otherwise refused request.

### EP-00-F02-BR02 — Sensitive Data and Relationships Have Their Own Boundary

Reading a machine, order or product summary does not reveal a linked formula's ingredients, commercial values, unrelated stock, other actors' identities or full permission explanations. The response omits restricted fields and derived summaries that disclose them. A direct request for those protected details requires the corresponding authority. Related-object navigation applies the same checks as a direct read.

### EP-00-F02-BR03 — Read Does Not Mean Execute

An action description states context, governing version, prerequisite, actual platform effect, any downstream effect still simulated and possible outcomes consistently for a human or future agent. Reading it does not confer execute, edit, approve or grant powers. Actions currently offered as available require current authority, and execution checks again at acceptance; the earlier view is not a grant.

### EP-00-F02-BR04 — Context and Freshness Remain Explicit

DUAL's A and B memberships are evaluated independently in the selected tenant. Revocation, group removal, inactive membership and hierarchy changes alter subsequent discovery and detail under F01's effective boundary. During unavailable or indeterminate authorization, no protected content, stale positive result or cross-tenant fallback is supplied.

### EP-00-F02-BR05 — Evidence Is Scoped and Non-Mutating

Authorized reviewers may read the decision evidence for their scope, including allowed, denied and unavailable outcomes. They cannot erase or modify it. The ordinary subject receives an appropriately limited result, and a foreign-object refusal cannot confirm whether the guessed object exists.

## Acceptance Criteria

### EP-00-F02-AC01 — Align List, Search and Direct Access

Story: US01. Rule: BR01. A-OPERATOR can discover and open authorized A-M1 objects. Searching for the shared readable code M1 reveals no B-M1 record. Direct A-M3, A-M4 and B-M1 attempts disclose no protected detail or existence; altered location filters do not change that boundary.

### EP-00-F02-AC02 — Limit Inherited Visibility

Story: US01. Rules: BR01, BR04. A-SUPERVISOR's declared A-L1 read grant includes A-M1 and A-M2 but excludes sibling A-M3, parent-wide scope, A-W1 and B objects. A direct A-M1-only observer receives no additional descendants of A-L1 by implication.

### EP-00-F02-AC03 — Protect Fields and Derived Information

Story: US02. Rule: BR02. A-OBSERVER reads a permitted order summary and product revision without composition or commercial values. Following the linked composition identity, requesting a field explicitly or asking for a derived composition summary does not reveal it. A-DEFINITION-APPROVER can read PROD-01 composition but no other product or tenant by implication.

### EP-00-F02-AC04 — Keep Collection Metadata Within Scope

Story: US01. Rule: BR01. With mixed authorized and unauthorized records, visible totals, filters and pages describe only the authorized population. Empty results do not announce hidden records or foreign tenant branding. Repeating the query through a related machine/order view yields the same visibility boundary.

### EP-00-F02-AC05 — Separate Description from Execution

Story: US02. Rule: BR03. A-OBSERVER reads the authorized description of starting an order, including its actual software effect, any deferred equipment effect and governing version. Attempting that start is refused. After A-OPERATOR opens a permitted action and its execution grant is effectively revoked, submitting that action is refused without relying on the previously displayed availability.

### EP-00-F02-AC06 — Switch Tenant Without Combining Rights

Story: US01. Rule: BR04. DUAL sees only A-M1 read scope in A and its independently granted B scope in B. Supplying A as the active tenant with a B object, or combining an A machine with a B order, reveals no B information. A-NONE, A-DISABLED and OUTSIDER receive no protected collection or detail.

### EP-00-F02-AC07 — Remove Visibility After Effective Changes

Story: US01. Rules: BR01, BR04. After all applicable read paths are effectively removed, a fresh list omits the object and a direct read refuses disclosure. After A-M1 moves to A-L2, the A-L1-only reader also loses its historical machine-linked order/event reads unless an independent grant remains; the A-L2 reader receives only its declared actions. Original operational location remains historical content rather than an access path, as specified by F01.

### EP-00-F02-AC08 — Protect Evidence and Refuse Unverifiable Reads

Story: US02. Rules: BR04–BR05. A-AUDITOR reads A-P1 evidence but cannot alter it or view B/A-P2 evidence. During authorization interruption, protected reads yield an unavailable-authority outcome without content; recovery restores current checks and does not replay stale data as if newly authorized.

## Dependencies and Pending Decisions

Depends on F01 for current authority and access changes. Every operational feature reuses this visibility boundary and must preserve its own execution checks. Field classifications are proposed fixture policy, not a final corporate classification taxonomy. There are no blocking product questions for this bounded proposal; exports, analytics and global cross-tenant administration are excluded.
