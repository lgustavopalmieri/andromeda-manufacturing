# EP-00-F07 — Report and Correct Production Quantities

## Description and Value

An operator may be authorized to report good output without being allowed to declare scrap or alter another person's production record. This feature validates action-level quantity permissions, record ownership and scoped supervisory corrections, preserving the original observation. It stresses frequent operational writes without requiring a complete production ledger or KPI calculation engine.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Follow execution and responsibility](../../requirements/00-andromeda-manufacturing-product-foundation/07-production-and-orchestration-requirements.md#follow-execution-and-responsibility).
- Requirement: [Facts, history and data quality](../../requirements/00-andromeda-manufacturing-product-foundation/11-data-kpis-integrations-and-governance-requirements.md#facts-history-and-data-quality).

The feature establishes minimal actual production observations and corrections on the platform’s seeded orders. Full production accounting and financial valuation remain deferred.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

A quantity record references tenant, machine, running order, author, quantity type, value/unit and governing action version. Good quantity and scrap are separate types; rework, yield calculations, stock consumption and KPI recomputation are excluded. Accepted reporting/correction retains the actual minimal observation, current revision and original/correction chain used by later reads, ownership checks and correction attempts. Broader ledger or KPI effects may remain simplified or temporarily simulated.

These records and correction permissions are the first production-reporting capability. Later accounting and indicator effects extend the same protected reports and attributable history under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F07-US01 — Report Good Quantity Within My Assignment

As an operator, I want to report good output for my running order so that my work is attributable without gaining unrelated loss-reporting powers. A-OPERATOR has good-quantity authority on A-M1 from both a direct grant and an inherited group path. The operator selects the assigned running order, enters a positive quantity and fixture unit and submits. Recording scrap or substituting an order from another machine is refused unless the appropriate distinct authority exists.

### EP-00-F07-US02 — Correct a Mistake Without Erasing the Original

As a supervisor, I want to correct a quantity record within my line so that mistakes can be explained while preserving the original fact. A-SUPERVISOR reads an A-L1 record, has the relevant correction authority and supplies a replacement value and reason. The result links the correction to the original. A separately seeded own-record correction variant lets A-OPERATOR correct their own good quantity, but never another author's record merely because it belongs to A-M1.

## Permission and Scope Matrix

| Action | Proposed grant | Independent boundary |
| --- | --- | --- |
| Record good quantity | A-OPERATOR directly on A-M1 and through an inheritable A-L1 group path covering A-M1/A-M2. | Does not include read/start/scrap/correction, another line or a mismatched machine/order pair. |
| Record scrap | A-SUPERVISOR on A-L1. | Requires a permitted scrap reason; no good-quantity permission is implied. |
| Correct own good quantity | Isolated A-OPERATOR grant on A-M1. | Original author must match; no correction of another actor's record. |
| Correct any good/scrap record | Separate A-SUPERVISOR grants for each type within A-L1. | No A-L2/A-P2/B authority; type cannot be changed to bypass permissions. |
| Read observations/history | F02 within current resource scope. | Read or original authorship does not imply edit. |

## Business Rules

### EP-00-F07-BR01 — Authority Matches Quantity Type and Real Execution Context

The action, quantity type, actual order/machine relationship and active tenant must all match current authority. The order must be running on the stated machine in the scenario. A readable record, order-start grant or current operator label alone is insufficient. A group grant applies only to its declared action and scope.

### EP-00-F07-BR02 — Corrections Are Separately Protected and Attributable

Correction needs a current type-specific correction grant. Own-only correction also requires the immutable original author identity; a supervisor's correct-any grant permits another author's record only inside its scope. A reason is mandatory. The original value, author and occurrence remain visible to authorized readers, and the correction records its actor/time and replacement. Changing quantity type requires the corresponding separate authorities and is excluded from this minimal correction operation.

### EP-00-F07-BR03 — Minimal Operational Prerequisites Still Apply

Values must be positive, use the order's fixture unit and identify the current scenario order. Scrap requires a permitted reason from the tenant's catalog. This package permits reporting/correction only while the order is running; closed-order adjustments and unit conversions are excluded. Correction of an already corrected value must refer to the current correction revision so a stale request cannot silently replace a newer result.

### EP-00-F07-BR04 — Current Access Paths Determine Acceptance

Removing a direct permission does not block the action while a valid group path remains. Once all relevant paths are acknowledged effectively removed, later reports/corrections are refused, including forms opened earlier. Inactive membership blocks all paths. Revoking authority leaves committed observations and corrections in history and does not convert them into unauthorized past actions.

### EP-00-F07-BR05 — Outcomes Are Honest and Protected

Every accepted report/correction identifies its actual retained record/revision and any downstream accounting or indicator effect still deferred or simulated. The synthetic seed values and minimal record do not claim official ledger, stock or KPI posting. Denied or unavailable authority creates no accepted observation or correction. An authorized subject can distinguish an invalid visible order/unit/reason from missing authority; unauthorized subjects receive no foreign record, value or author details.

## Acceptance Criteria

### EP-00-F07-AC01 — Report Good Quantity and Refuse Scrap

Story: US01. Rules: BR01, BR03, BR05. A-OPERATOR records positive good quantity for the running A-M1 order using its fixture unit. The result identifies the actual retained observation and its versions, available to an authorized read and subsequent correction check. Attempting scrap with the same grant is refused; no loss record is created.

### EP-00-F07-AC02 — Match Order, Machine and Tenant Together

Story: US01. Rule: BR01. A-OPERATOR cannot report against A-M2's order by supplying A-M1, nor against a B order with an A membership. In an isolated fixture with readable running A-M2 context, the valid A-L1 group path does permit good reporting against the actual A-M2/order pair, without granting start, scrap or another line. Knowing the record identity or being able to start A-ORDER-01 does not independently grant quantity-report authority.

### EP-00-F07-AC03 — Correct Own Records Only When Granted

Story: US02. Rule: BR02. Without the isolated correct-own grant, A-OPERATOR cannot correct even their own record. With that grant effective, their own good-quantity correction succeeds with a reason and links to the original. A second author's A-M1 record remains protected.

### EP-00-F07-AC04 — Bound Supervisory Correction and Type

Story: US02. Rules: BR02–BR03. A-SUPERVISOR with the relevant correct-any grants corrects another actor's A-L1 record and preserves the original. The same attempt on A-M3/A-M4/B is refused. A good-quantity correction cannot be used to relabel the record as scrap or evade scrap authority.

### EP-00-F07-AC05 — Refuse Invalid State, Unit and Reason

Story: US01–US02. Rules: BR02–BR03. Otherwise permitted subjects cannot report/correct on completed or cancelled orders, use an unsupported unit, submit nonpositive quantity, omit a required correction/scrap reason or use another tenant's reason. No successful report or partial correction is asserted.

### EP-00-F07-AC06 — Exercise Single-Path and Full Revocation

Story: US01. Rule: BR04. Removing A-OPERATOR's direct good-quantity path leaves group-authorized reporting valid. Effective removal of the group path then blocks the next report. Effective membership suspension also blocks all paths while retaining the earlier observations as historical evidence.

### EP-00-F07-AC07 — Protect Concurrent Corrections and Interruption

Story: US02. Rules: BR03–BR05. Two corrections based on the same prior revision cannot silently overwrite each other; the outcome identifies the accepted current revision. During unavailable authority, no observation/correction is accepted and no old positive decision supplies a fallback. A later retry uses current rights and revision.

### EP-00-F07-AC08 — Mirror Reporting Without Tenant Leakage

Story: US01–US02. Rules: BR01, BR05. B-OPERATOR reports only its separately authorized B-M1 good quantity, and B-SUPERVISOR exercises separately granted B corrections/scrap. A and B records with the same readable codes remain independent; neither tenant's quantities, authors or reasons appear in the other's refusal.

## Dependencies and Pending Decisions

Depends on F01–F02 and a running F06 order or equivalent seeded running fixture. The type-specific correction rights and running-only adjustment window are proposed initial product policy. No blocking product question remains for this proposal; official production accounting, rework and closed-order corrections are excluded.
