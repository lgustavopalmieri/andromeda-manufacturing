# EP-00-F10 — Transfer Inventory Between Locations

## Description and Value

A stock handler allowed to withdraw from one location is not necessarily allowed to receive into every destination or move every lot. This feature validates simultaneous authority over origin, destination and the actual lot, with quality restrictions remaining binding. It makes a cross-object operational action succeed or fail as a whole rather than exploiting a permission on only one side.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Operational material and inventory](../../requirements/00-andromeda-manufacturing-product-foundation/09-materials-quality-and-logistics-requirements.md#operational-material-and-inventory).
- Requirement: [Quality decisions linked to the operation](../../requirements/00-andromeda-manufacturing-product-foundation/09-materials-quality-and-logistics-requirements.md#quality-decisions-linked-to-the-operation).

This feature establishes the platform’s minimal protected intra-tenant transfer. Complete warehouse management and quality-disposition workflows remain deferred.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

An available A-LOT-01 begins in A-W1; A-LOT-HOLD is quality-held; an additional visible lot lacks transfer-use permission. A-W2 is the ordinary destination and A-W3 a second-plant negative case. A transfer contains origin, destination, lot, quantity/unit, reason and actor. Accepted movement retains actual minimal platform balances, lot/location relationships and movement history for these seeded records, sufficient for later reads, origin checks, retries and concurrent-balance checks. Richer inventory and external posting effects may remain simplified or temporarily simulated. No official financial inventory, logistics integration, picking, shipping, reservation or hold-release operation is delivered.

The minimal movement, balances and combined location/lot authority are the first inventory-transfer capability. Later warehouse and posting effects continue the same protected operation under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F10-US01 — Move an Authorized Lot Between My Locations

As a stock handler, I want to transfer a permitted lot from my authorized origin to my authorized destination so that material movement respects both location responsibilities. A-STOCK starts with A-W1 withdrawal, A-W2 receipt and A-LOT-01 transfer-use authority. The lot is actually present in A-W1, available and sufficient in the fixture balance. A positive permitted quantity creates one retained platform movement and matching origin/destination balance changes for the seeded lot. Visibility of A-W3 or another lot, if separately granted, does not confer movement rights.

### EP-00-F10-US02 — Refuse Partial Authority and Restricted Material

As a material owner, I want a transfer blocked when any required authority or material condition is missing so that stock cannot escape restrictions through a permitted warehouse. Isolated runs remove origin, destination or lot authority one at a time, then place the lot on hold. Each attempt must leave no accepted withdrawal, receipt or successful movement. Granting broader warehouse authority cannot release the hold, and an access administrator cannot use administration rights as transfer power.

## Permission and Scope Matrix

| Action component | Proposed baseline grant | Independent boundary |
| --- | --- | --- |
| Read origin/destination/lot summary | A-STOCK on A-W1/A-W2 and permitted lot summaries under F02. | Read alone permits no transfer. |
| Withdraw for transfer | A-STOCK on A-W1. | No receipt right in A-W2/A-W3 by implication. |
| Receive transfer | A-STOCK on A-W2. | No withdrawal from A-W2 or receipt into A-W3 by implication. |
| Use lot in transfer | A-STOCK on A-LOT-01. | Another lot, quality release and commercial details remain separate. |
| Equivalent Tenant B transfer | B-STOCK on B-W1, B-W2 and B-LOT-01 with independent component grants. | No cross-tenant movement or reuse of A grants. |

## Business Rules

### EP-00-F10-BR01 — All Three Authorities Apply to the Same Transfer

Current origin-withdrawal, destination-receipt and lot-transfer authority are all required in one active tenant. The subject also needs the permitted operational identities needed to form the request. Rights may come from legitimate direct/group/hierarchy paths but must jointly cover the actual objects in this transfer. A production-line grant does not reach sibling warehouses unless a separate applicable location grant states it does.

### EP-00-F10-BR02 — Real Relationships Cannot Be Replaced by Labels

The lot must actually be held at the stated origin and eligible for the stated destination in its tenant. A-W1 authority cannot be used by presenting A-W1 as the parent of a lot held in A-W3. Neither a B destination nor a B lot is eligible for an A transfer, even for DUAL or an administrator with independent memberships. Cross-tenant movement is outside this delivery.

### EP-00-F10-BR03 — Quality and Quantity Remain Hard Prerequisites

Only available, unheld material can move in this scenario. Quality-held, expired or otherwise restricted seeded lots are blocked even if all action grants exist. A transfer grant cannot release quality restrictions or imply a concession. Quantity must be positive, not exceed the current scenario origin balance and use the lot's fixture unit; destination suitability must hold. Unit conversions and formal concessions are excluded.

### EP-00-F10-BR04 — Transfer Is One Protected Outcome

No accepted withdrawal, receipt or success record may remain when any authority or prerequisite fails. An accepted operation retains one movement, matching balance changes and quantity/unit on both sides, actor, lot and reason. Concurrent or repeated attempts cannot produce a negative scenario balance or duplicate accepted movement for the same accepted attempt. The result identifies these actual minimal platform changes and distinguishes any official inventory or financial posting still deferred or simulated.

### EP-00-F10-BR05 — Recheck All Authority at Acceptance

An earlier list or preview cannot reserve permission. Effective revocation of any required component blocks later transfer unless another valid source still supplies that component. Indeterminate/unavailable authorization yields no accepted movement or partial side. Authorized reviewers distinguish missing authority, invalid visible material state and unavailable authority without disclosing foreign stock or restricted lot information.

## Acceptance Criteria

### EP-00-F10-AC01 — Accept a Complete Permitted Transfer

Story: US01. Rules: BR01–BR04. A-STOCK transfers a permitted quantity of available A-LOT-01 from its actual A-W1 origin to A-W2 with all three grants. The result identifies one actual retained platform movement and matching origin/destination balance/quantity/unit changes that subsequent authorized reads and origin checks observe; official inventory integration/posting remains deferred.

### EP-00-F10-AC02 — Remove Each Permission Component Separately

Story: US02. Rules: BR01, BR04–BR05. Three isolated variants remove origin-withdrawal, destination-receipt or lot-transfer authority while retaining the other two and valid material. Each attempt is refused with no accepted side of the movement. Warehouse/lot summary read does not replace the missing action.

### EP-00-F10-AC03 — Refuse Unauthorized Locations and False Parentage

Story: US01–US02. Rules: BR01–BR02. A-STOCK cannot receive into A-W3 or withdraw from A-W2 using A-W1's grant. A lot actually held at A-W3 cannot be moved by naming A-W1 as origin. A-L1 machine/line permissions provide no warehouse authority.

### EP-00-F10-AC04 — Preserve Quality Restrictions Despite Broad Grants

Story: US02. Rule: BR03. An isolated actor with every required transfer grant still cannot move quality-held A-LOT-HOLD, expired material or a lot unsuitable for the destination. The result is a visible prerequisite refusal only for an actor permitted to inspect that lot; it does not release the hold or create a movement.

### EP-00-F10-AC05 — Validate Quantity and All-or-Nothing State

Story: US01–US02. Rules: BR03–BR04. Zero/negative quantity, an unsupported unit or quantity above the current scenario balance produces no accepted withdrawal/receipt. Concurrent permitted attempts cannot overdraw the scenario lot, and a retry of an already accepted attempt is recognizable without duplicating the movement.

### EP-00-F10-AC06 — Revoke One Required Component During Activity

Story: US02. Rule: BR05. After a destination preview, effective removal of every destination-receipt path prevents the later transfer. If one alternative legitimate receipt path remains, that component remains satisfied but origin and lot authority must still pass. Evidence relates the accepted/refused attempt to the effective change boundary.

### EP-00-F10-AC07 — Refuse Unverifiable Authority Without Partial Effects

Story: US02. Rules: BR04–BR05. During interruption or an indeterminate check of any component, no side of the transfer is accepted and no success is asserted. A retry after recovery uses current rights and balances. A previously accepted movement retains its history after later revocation.

### EP-00-F10-AC08 — Keep Both Tenants and Their Stock Independent

Story: US01–US02. Rules: BR01–BR02, BR05. B-STOCK completes the equivalent B-W1→B-W2 movement for B-LOT-01 with B grants. A/B cross-combinations, including DUAL's two memberships, create no movement and disclose no foreign balance, quality state, lot detail or branding. A-OWNER has no transfer power from access administration alone.

## Dependencies and Pending Decisions

Depends on F01–F02 and seeded lot/location/status/balance facts. The three-object authority rule, no quality concession and all-or-nothing minimum platform movement are proposed initial product policy. There is no blocking product question for this bounded proposal; official stock valuation, quality hold release and cross-tenant logistics remain excluded.
