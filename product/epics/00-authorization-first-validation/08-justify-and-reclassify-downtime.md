# EP-00-F08 — Justify and Reclassify Downtime

## Description and Value

A machine operator may explain their downtime without being authorized to overwrite another person's classification or use restricted engineering reasons. This feature validates record relationship, reason hierarchy and independent reclassification rights. It preserves the observed event while allowing a small, attributable classification history.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Follow execution and responsibility](../../requirements/00-andromeda-manufacturing-product-foundation/07-production-and-orchestration-requirements.md#follow-execution-and-responsibility).
- Requirement: [An understandable audit history](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md#an-understandable-audit-history).

The feature exercises authorization for explanation and correction. Automatic downtime detection, KPI recalculation and a reason-catalog editor are excluded.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | Not reported | — | No execution evidence supplied. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

Seeded downtime events identify tenant, machine, occurrence interval and responsible operator. Each tenant has a distinct versioned reason catalog with a general operational branch and a restricted engineering branch. Accepted justification/reclassification retains the actual minimal classification, reason version and history on the seeded observed event; it does not change the measured interval, start/stop a machine or approve a quality decision.

Classification and its reason/ownership permissions are the first downtime-explanation capability. Later event collection and indicator effects continue the same protected records and versioned history under the [product continuity contract](00-epic.md#product-continuity-and-evolution).

## User Stories

### EP-00-F08-US01 — Explain My Own Downtime with an Allowed Reason

As an operator, I want to classify an event for which I am responsible using the reasons permitted to me so that my explanation is useful without assigning blame or restricted classifications outside my remit. A-OPERATOR opens an unclassified A-M1 event assigned to that actor. The permitted operational reason list is visible, with its governing version. Selecting a permitted leaf and providing required notes creates the platform classification record. An event owned by another operator or a restricted reason requires additional authority.

### EP-00-F08-US02 — Correct a Classification as a Scoped Supervisor

As a line supervisor, I want to reclassify a downtime event within my line with a reason for the change so that review improves the explanation without rewriting the original observation. A-SUPERVISOR reads a classified A-L1 event and has explicit reclassify-any authority. The supervisor selects an allowed replacement reason and states why it changed. The prior classification, author and event interval remain attributable. Engineering reasons need an additional reason-branch grant even for the supervisor.

## Permission and Scope Matrix

| Action | Proposed grant | Independent boundary |
| --- | --- | --- |
| Justify own event | A-OPERATOR on A-M1 events with matching responsible actor. | Machine read or quantity reporting alone is insufficient. |
| Reclassify any event | A-SUPERVISOR within A-L1. | Does not grant another line or every reason category. |
| Use operational reason branch | A-OPERATOR/A-SUPERVISOR in the tenant's applicable catalog version. | Restricted engineering reasons are separate. |
| Use restricted engineering branch | Isolated additional A-SUPERVISOR grant for the applicable branch. | Cannot alter observed duration or approve product/material disposition. |
| Read classification history | F02 within current machine scope. | No editing rights implied. |

## Business Rules

### EP-00-F08-BR01 — Event Scope and Responsibility Are Both Required

Own-event justification requires current justify-own authority on the actual machine and a match with the event's recorded responsible actor. Being the current machine operator does not replace that relationship for another person's earlier event. Reclassification of another actor's event requires reclassify-any authority in its scope. Author/responsible identity is not editable through this operation.

### EP-00-F08-BR02 — Reason Authority Is Hierarchical but Bounded

The selected reason must be an allowed leaf of an applicable, effective tenant catalog version. An operational-branch grant may cover its declared descendant reasons but cannot reach a sibling engineering branch or a B catalog. Knowing a protected reason identity or supplying a category label does not confer use or visibility. Reason visibility follows F02; unauthorized categories are not exposed as available choices.

### EP-00-F08-BR03 — Classification Does Not Replace the Fact

The event's interval, machine and observed origin remain unchanged. Initial justification applies only to an unclassified event. Subsequent changes use reclassification authority, record the prior/replacement reason and require an explanation. Reclassifying with a restricted engineering reason needs both event reclassification and reason-use authority. The feature does not release a machine, alter a quality hold or recalculate an official KPI.

### EP-00-F08-BR04 — Catalog Versions and State Are Explicit

A classification retains the reason/catalog version used. A replacement catalog governs new choices; it does not silently relabel historical classifications. The proposed fixture permits classification and reclassification of seeded open-for-classification events, including recorded events from an earlier shift, but excludes administratively locked events. Broad permissions cannot bypass the locked-event prerequisite.

### EP-00-F08-BR05 — Check at Acceptance and Preserve History

Current membership, grants, event responsibility, catalog eligibility and event state are checked when accepting. A stale classification revision cannot overwrite a newer one without an explicit current attempt. Effective revocation blocks later changes. Denied/unavailable attempts create no accepted classification, and foreign attempts reveal no reason, author or event interval.

## Acceptance Criteria

### EP-00-F08-AC01 — Classify a Permitted Own Event

Story: US01. Rules: BR01–BR04. A-OPERATOR selects an allowed operational leaf for an unclassified A-M1 event assigned to that actor. The retained classification identifies event, actor, catalog/reason version and required explanation for subsequent reads/reclassification, without modifying the observed interval.

### EP-00-F08-AC02 — Refuse Ownership and Scope Substitution

Story: US01. Rule: BR01. A-OPERATOR cannot justify another responsible actor's A-M1 event or an A-M2/A-M3/B event. Changing the supplied responsible actor or machine label does not change the underlying relationship. Machine read and good-quantity grants do not satisfy justification authority.

### EP-00-F08-AC03 — Protect Reason Branches and Tenant Catalogs

Story: US01–US02. Rule: BR02. Operational-branch authority permits its declared descendants only. Directly naming an engineering reason, selecting its parent category or copying a B reason is refused without disclosing protected catalog contents. Granting event reclassification alone leaves restricted engineering reasons unavailable.

### EP-00-F08-AC04 — Reclassify with Both Required Authorities

Story: US02. Rules: BR01–BR03. A-SUPERVISOR reclassifies an A-L1 event using an operational reason and a mandatory explanation, preserving the prior classification. The engineering-reason variant succeeds only after separately adding its applicable branch-use grant. A-M3/B remains outside scope.

### EP-00-F08-AC05 — Prevent Rewriting Observations or Bypassing State

Story: US01–US02. Rules: BR03–BR04. Initial justification cannot overwrite an already classified event. Reclassification cannot change duration, machine or origin; a locked event cannot be changed despite broad grants. The classification record is not presented as quality release or machine-control confirmation.

### EP-00-F08-AC06 — Keep Old Versions Explainable

Story: US02. Rule: BR04. Publishing reason catalog version 2 leaves version 1 classifications unchanged. A permitted new classification selects an effective version 2 reason. An older open-for-classification event is allowed under the stated policy, while an administratively locked event remains refused.

### EP-00-F08-AC07 — Recheck Changes and Concurrent Attempts

Story: US01–US02. Rule: BR05. An event opened before effective justify/reclassify or reason-use revocation cannot later be changed using that removed path. Concurrent changes retain one current classification and attributable prior versions. Unavailable authority creates no accepted result and no fallback based on a prior successful read.

### EP-00-F08-AC08 — Mirror Tenant B Without Sharing Reasons

Story: US01–US02. Rules: BR01–BR02, BR05. B-OPERATOR and B-SUPERVISOR exercise equivalent separately granted B event/reason paths. Reused reason names do not permit A catalog identities in B, and a refused cross-tenant request reveals no foreign event, classification or author.

## Dependencies and Pending Decisions

Depends on F01–F02 and seeded event responsibility/catalog versions; no actual downtime collection is required. Own-event justification, additional reason-branch authority and locked-event refusal are proposed initial product policy. No blocking product question remains; reason authoring, dual quality approval and official indicator recalculation are excluded.
