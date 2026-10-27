# EP-00-F09 — Govern Product Definition Revisions

## Description and Value

A process engineer may prepare a product definition without being authorized to approve it, publish it or disclose its composition to every operator who runs the product. This feature validates one product-definition lifecycle with two seeded variants: a bill of materials (BOM), which lists component quantities, and a formula, which specifies a batch composition. Their business calculations are simplified; their confidentiality, version and authority boundaries are real.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Define and govern how a product is made](../../requirements/00-andromeda-manufacturing-product-foundation/07-production-and-orchestration-requirements.md#define-and-govern-how-a-product-is-made).
- Requirement: [Govern operational changes](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md#govern-operational-changes).

The feature delivers a minimal revision-governance scenario for both representation variants, not a full engineering, recipe or formula calculation module.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

PROD-01 is a formula example; PROD-02 is a BOM example. Each tenant has independent product identities with the same readable codes. Fixtures include effective revision 1 and draft revision 2. Revision 2 contains a short composition and allowed plant/machine-model context, with public operational summary separated from confidential composition. The actual minimal revision lifecycle retains composition, authorship, approval and publication references used by later reads and order-version checks; no balancing, optimization, allergen engine, material costing or recipe execution is required.

These minimal product revisions and distinct edit/approve/publish powers are the first engineering-definition capability. Later BOM/formula depth extends these protected actions and immutable review evidence under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F09-US01 — Prepare a Confidential Product Revision

As a process engineer, I want to revise a product's BOM or formula within my product scope so that the next production definition can be reviewed without changing existing work. A-ENGINEER can read composition and draft revision 2 for PROD-01. The engineer edits only that permitted definition and submits it for review. Operators can continue to read the allowed summary of effective revision 1 without gaining ingredient or component detail. PROD-02 editing requires a separate product grant in its isolated BOM variant.

### EP-00-F09-US02 — Approve and Publish Without Expanding Operational Rights

As a definition approver and a separately authorized publisher, we want to approve an independently authored revision and make that exact revision effective so that new orders use a controlled definition. A-DEFINITION-APPROVER reviews permitted composition and approves revision 2 they did not create or materially edit. A-PUBLISHER publishes that approved revision. Neither stage implicitly grants machine operation, inventory movement or unrestricted definition access. Orders already started remain pinned to revision 1.

## Permission and Scope Matrix

| Action | Proposed baseline grant | Independent boundary |
| --- | --- | --- |
| Read summary/use revision | Explicit operational read/use grant for effective PROD-01 in A-P1, as in F02/F03. | Confidential composition is separate. |
| Read confidential composition | A-ENGINEER and A-DEFINITION-APPROVER on PROD-01. | Does not grant draft editing or approval; PROD-02 needs a separate isolated grant. |
| Create/edit a draft revision and submit it | Separate A-ENGINEER draft-edit and submit grants on PROD-01, with composition-read authority. | No edit of an effective revision; no approve/publish authority. |
| Approve revision | A-DEFINITION-APPROVER on PROD-01 with composition-read authority. | Cannot approve a revision they created or materially edited; no publish power. |
| Publish approved revision | A-PUBLISHER on PROD-01 with summary/review-outcome read. | No composition editing or approval by implication. |
| Mirror BOM variant | Separately granted product-specific editor, approver and publisher on PROD-02. | Formula rights do not silently include BOM rights or every product. |

## Business Rules

### EP-00-F09-BR01 — Product and Field Scopes Are Independent of Machine Access

The action requires a current grant on the product/revision in the active tenant. A machine, order or product-summary grant does not disclose composition or permit editing. Editing requires composition-read authority and draft-edit authority for that product. A subject cannot widen scope by changing the displayed plant, product family or product type.

### EP-00-F09-BR02 — Versions and Authors Are Immutable Evidence

Effective revision 1 is not edited in place. Draft revision 2 records its original author and material contributors, composition, applicability and changes. A material edit after review creates a new identifiable draft iteration with unapproved content; the previously reviewed content and approval remain separately identifiable and immutable. The new content requires new approval before publication. Author/contributor records cannot be changed through a publication request to manufacture independence.

### EP-00-F09-BR03 — Approval and Publication Are Separate Decisions

Approval needs a current product-approval grant, readable composition and a submitted current revision. Its author or any material contributor cannot approve it, including after receiving a broad grant. Publication needs its own grant and an approval of the unchanged revision. The publisher cannot publish a draft/unapproved or different revision. No general policy engine is delivered; these are proposed fixture rules.

### EP-00-F09-BR04 — Publication Governs New Work Without Rewriting Started Work

Publication makes the approved revision effective for its declared plant/machine context and identifies which earlier revision it replaces for new work. It does not extend the publisher's scope or the product's declared applicability. F03's new orders use an allowed effective revision. Started orders retain their product, setup and HMI version references; this feature cannot perform a live migration. Unstarted orders pinned to a replaced revision require authorized revision/reapproval before a new start under this proposed initial product policy.

### EP-00-F09-BR05 — All Transitions Need Current Authority and Attributable Results

Drafting, approval and publication are rechecked at acceptance against current membership, grants, revision and state. Revoking an approver's future permission does not erase a valid past approval; a changed revision still requires new review. Overlapping publication attempts yield one explainable current effective version. Unavailable or indeterminate authority creates no successful transition or confidential disclosure. Results identify the actual retained revision, approval or publication state and any deferred engineering calculation or integration effect.

## Acceptance Criteria

### EP-00-F09-AC01 — Draft Only the Permitted Product

Story: US01. Rules: BR01–BR02. A-ENGINEER edits PROD-01 draft revision 2 while revision 1 remains unchanged and effective. Editing PROD-02, a B product or effective revision 1 is refused without a partial composition change. The BOM variant succeeds only with its separately declared PROD-02 grants.

### EP-00-F09-AC02 — Protect Composition from Operational Consumers

Story: US01. Rule: BR01. A-OBSERVER/A-OPERATOR can read the authorized effective product summary and order references without formula ingredients, BOM components or commercial values. Knowing the draft/revision identity or following a machine link does not reveal composition. A permitted editor/approver reads only their scoped product's composition.

### EP-00-F09-AC03 — Prevent Self-Approval and Implicit Publication

Story: US02. Rules: BR02–BR03. In an isolated broad-grant variant, a revision's original author or material contributor still cannot approve it. A-DEFINITION-APPROVER may approve an independently authored submitted revision but cannot publish it. A-PUBLISHER cannot edit or approve through publish authority.

### EP-00-F09-AC04 — Publish Only the Unchanged Approved Revision

Story: US02. Rules: BR02–BR03, BR05. A-PUBLISHER publishes the exact approved PROD-01 revision 2 within its applicability. A late request for a different, draft or materially changed revision is refused. Concurrent attempts leave one effective revision and attributable prior state, without broadening plant scope.

### EP-00-F09-AC05 — Keep Running Orders Pinned

Story: US02. Rule: BR04. Publishing revision 2 leaves the running revision-1 order, setup and action versions unchanged. New drafts may use revision 2 where they have use authority. An unstarted old-revision order cannot silently migrate or start under the replacement; authorized revision and fresh order approval are required.

### EP-00-F09-AC06 — Recheck Authority Without Erasing Valid History

Story: US01–US02. Rule: BR05. Effective editor/approver/publisher revocation blocks the actor's next corresponding action despite an earlier open view. A valid committed approval remains historical and usable for unchanged publication unless a separate state/revision change invalidates it. Inactive membership blocks all new transitions.

### EP-00-F09-AC07 — Refuse Unverifiable or Mismatched Tenant Transitions

Story: US01–US02. Rules: BR01, BR05. During authorization interruption, no draft success, approval, publication or composition read is asserted. Combining an A product with a B revision or DUAL's unrelated B start grant produces no transition and no foreign composition or branding disclosure.

### EP-00-F09-AC08 — Exercise Both Definition Variants in Both Tenants

Story: US01–US02. Rules: BR01–BR05. Isolated formula and BOM runs declare their product-specific grants. A and B each demonstrate drafting, independent approval and publication under separate identities/references. The representation variant changes the sample composition, not the action, confidentiality or independence boundaries.

## Dependencies and Pending Decisions

Depends on F01–F02; F03–F06 use seeded effective versions and later consume the publication variation. Composition confidentiality, contributor-based independence and replaced-revision behavior for unstarted orders are proposed initial product policies. No blocking product question remains; complete recipe modeling, formula calculations and enterprise change control are excluded.
