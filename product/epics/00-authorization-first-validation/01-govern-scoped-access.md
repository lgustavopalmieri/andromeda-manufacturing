# EP-00-F01 — Govern Scoped Access

## Description and Value

Tenant access administrators need to give people exactly the operational authority they are responsible for and remove it predictably. A delegated line administrator must not become a tenant owner, and revoking one grant must not be confused with removing every legitimate source of access. This feature makes access administration itself a protected capability and supplies real authority changes for the other nine features.

## Product References

- Epic: [Authorization-First Incremental Platform Foundation](00-epic.md).
- Requirement: [Organization isolation and contextual access](../../requirements/00-andromeda-manufacturing-product-foundation/12-security-access-auditing-and-change-control.md#organization-isolation-and-contextual-access).
- Requirement: [Physical and organizational context](../../requirements/00-andromeda-manufacturing-product-foundation/04-operating-model-and-master-data.md#physical-and-organizational-context).

This delivery exercises scoped grants, groups, temporary delegation, expiry, revocation and current membership using a small synthetic population. It does not deliver complete enterprise identity governance.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Needs review | 2026-10-26 | Confirmed incremental foundation and continuity; feature-specific policies below remain proposed. |
| Delivery | In progress | 2026-10-30 | [SPEC-EP-00-F01 revision 6](../../../architecture/specs/EP-00-F01-govern-scoped-access.requirements.md), [ADR-0001](../../../architecture/adrs/0001-m0-graph-authoritative-authorization-foundation.md). M0-01–16 accepted, including M0-16 schema/index correction on 2026-10-30, America/Sao_Paulo. Authorized M0-17 tenant SQL mapping is implemented and technically validated: 11 tenant mapping cases and 97 affected schema/connection/native-main checks passed; root lint, strict app typecheck and actual production build/native artifact checks passed. Tenant persistence mapping review pending. [F01 execution evidence](../../../architecture/specs/EP-00-F01-govern-scoped-access.tasks.md#execution-evidence). M0-18 and later F01 work have not started; F01 and the epic remain incomplete. |
| Business validation | Not reported | — | No scenario results supplied. |

## Scope and Boundaries

The [shared fixtures](00-epic.md#shared-validation-population) provide tenant membership, direct grants, groups and resource relationships. This feature establishes the platform’s real initial access-management behavior; the seeded environment exercises its actual authority changes. User creation, authentication, a role designer, an unrestricted group editor and a production administration interface are excluded. Resource relocation is a controlled fixture variation used to validate inherited authority, not a delivered location-management module.

Scoped access governance is the first retained access-management capability. Later administration features extend the same grants, groups, delegations and effective-change behavior under the [product continuity contract](00-epic.md#product-continuity-and-evolution); operational modules continue to use that authority.

## User Stories

### EP-00-F01-US01 — Delegate a Limited Line Responsibility

As a tenant access administrator, I want to delegate selected access administration for one line so that the line can manage routine staffing without obtaining plant-wide power. A-OWNER starts with an active A membership and assigns A-DELEGATE an explicit ceiling: operational summary reading, saving ordinary setup drafts and good-quantity reporting within A-L1. A-DELEGATE selects an active recipient, action, scope and optional validity window. A grant within that ceiling becomes effective and can be exercised immediately through the corresponding feature. An attempt to add order approval, access administration, a sibling line or a longer delegation period is refused without changing authority.

### EP-00-F01-US02 — Remove Effective Authority and Understand Remaining Paths

As an access administrator, I want to revoke a grant or membership and see what remains effective so that I can remove authority deliberately. A-OPERATOR can report good quantity through both a direct A-M1 grant and A-L1-OPERATORS membership. A-OWNER first removes one path and observes the remaining permitted scope, then removes the other and observes refusal. Removing active tenant membership blocks all current operational authority in that tenant, while historical activity remains attributable. Concurrent attempts have an explainable ordering against the effective change boundary.

## Permission and Scope Matrix

| Protected action | Proposed authorized actor and scope | What it does not imply |
| --- | --- | --- |
| Grant/revoke operational permission | A-OWNER in A; A-DELEGATE only within A-L1 and its delegated action ceiling. | Permission to execute the granted action. |
| Assign/remove group membership | A-OWNER; A-DELEGATE only for a group wholly inside its ceiling. | Authority to change a group's permissions, nest a broader group or appoint an access administrator. |
| Delegate access administration | A-OWNER for an explicit ceiling and validity window. | Delegated administrators may not delegate again in this package. |
| Suspend/remove tenant membership | A-OWNER for A members. | Deleting the user's independent B membership or audit history. |
| Inspect grant paths/history | A-OWNER in A; A-AUDITOR within A-P1; A-DELEGATE within its delegated boundary. | Visibility into B, or operational write authority. |

## Business Rules

### EP-00-F01-BR01 — Grants Have a Bounded Meaning

A grant identifies actor or group, tenant, action, scope, inheritance behavior and validity. Hierarchical inheritance descends only through the declared scope for that action. Group membership cannot create authority outside the group's existing grants. A group expansion is refused if its resulting effective authority exceeds the administrator's ceiling. Cyclic group relationships or unresolvable delegation cannot become an effective grant.

### EP-00-F01-BR02 — Administration Is Separate from Operations

A valid tenant membership is necessary but insufficient. A-OWNER and A-DELEGATE have no implicit manufacturing powers. A-DELEGATE cannot broaden its own ceiling, grant itself additional actions, extend the delegation, appoint another administrator or grant to another tenant. Any separately authorized grant still remains subject to operational restrictions such as independent approval. These are proposed business policies for this package, not assumed behavior supplied by a tool.

### EP-00-F01-BR03 — Multiple Paths and Effective Changes Are Explicit

Removing a direct grant, group path or delegation removes that source only. Authority persists if another valid path remains. A full removal must eliminate all applicable sources or deactivate the membership. Each change is reported as pending, failed or effective. After effectiveness is acknowledged, no newly accepted operation may rely on the removed source. Previously committed results are retained; a pending or failed change must not be represented as successful revocation.

### EP-00-F01-BR04 — Time and Status Bound Current Authority

A temporary permission is valid from its declared start instant up to, but not including, its end instant. Expired, not-yet-valid or revoked grants confer no authority. A delegated grant cannot outlive its governing delegation. Removing that delegation invalidates its dependent grants. Inactive tenant membership blocks direct, group and delegated paths regardless of broad grants. An independently active B membership remains independent.

### EP-00-F01-BR05 — Relationship Changes Follow Current Scope

When a controlled scenario reassigns A-M1 from A-L1 to A-L2, authority inherited exclusively from A-L1 stops applying after the reassignment is effective. An explicit grant on the stable A-M1 identity remains unless separately revoked; it does not spread to A-L2 siblings. For this proposed initial product policy, access to all machine-linked orders/events, including historical records, follows the machine's current hierarchy for the requested action. Records retain their original operational location as history; that captured location confers no current access. An independently valid object grant remains an additional path. Ambiguous or cross-tenant parentage must not create usable authority.

### EP-00-F01-BR06 — Governance Leaves Protected Evidence

Record initiator, recipient, action, source, scope, validity, reason, prior/resulting authority and effective outcome. Denied changes create no permission mutation. Full path explanations are available only to authorized administrators/auditors within scope. If authority cannot be established during an administrative change, no new grant or effective revocation is claimed.

## Acceptance Criteria

### EP-00-F01-AC01 — Grant Within the Delegated Ceiling

Story: US01. Rules: BR01–BR02. Given A-DELEGATE's active A-L1 ceiling, when it grants good-quantity reporting on A-M2 to A-NONE, then that action becomes permitted on A-M2 only; start, scrap, A-M3 and all B machines remain refused. A-DELEGATE gains no operational action from performing the grant.

### EP-00-F01-AC02 — Refuse Escalation Through Direct or Group Changes

Story: US01. Rules: BR01–BR02. When A-DELEGATE attempts self-expansion, approval authority, A-P1 scope, a B recipient, onward delegation or membership in a group containing broader rights, then the change is refused and subsequent protected checks show the original authority. A valid nested-group variant yields only the outer group's original action and scope.

### EP-00-F01-AC03 — Revoke One Path, Then All Paths

Story: US02. Rules: BR03, BR06. Given direct A-M1 and group A-L1 good-quantity paths for A-OPERATOR, when the direct path becomes effectively revoked, A-M1 reporting remains allowed through the group. When group membership is then effectively removed, the next A-M1 report is refused. Evidence names each source removed and the surviving source where applicable.

### EP-00-F01-AC04 — Expire Permission at the Declared Boundary

Story: US01–US02. Rule: BR04. Given the same action before, at and after a grant's end instant, only the pre-expiry request may rely on that grant. Not-yet-valid grants are refused. Ending the administrator's delegation also ends authority derived from it, even if a dependent grant originally requested a later end.

### EP-00-F01-AC05 — Suspend Membership Without Combining Tenants

Story: US02. Rule: BR04. When DUAL's A membership becomes inactive, A operations are refused despite surviving grant records; B-M1 operations remain subject solely to the active B membership and B grants. A-DISABLED and OUTSIDER cannot gain access through a known object identity or a group path.

### EP-00-F01-AC06 — Preserve Ordering Around Revocation

Story: US02. Rules: BR03, BR06. When repeated reporting attempts overlap a revocation, each accepted result has an explainable relationship to the effective boundary. An attempt accepted after all paths were acknowledged removed cannot succeed. A revocation that remains pending or fails is visibly not effective and is not reported as proof of removed access.

### EP-00-F01-AC07 — Reassign a Machine Without Extending Grants

Story: US02. Rule: BR05. Given an A-L1-only inherited reader, an A-L2-only inherited reader and a direct A-M1 reader, when the fixture reassignment to A-L2 becomes effective, the former loses current A-M1 access, including an old A-M1 order/event; the latter gains only its declared inherited reads for those records; and the direct reader keeps A-M1 only. The old record still displays its original A-L1 context to authorized readers. A foreign-parent attempt creates no cross-tenant authority.

### EP-00-F01-AC08 — Protect Administration and Evidence During Failure

Story: US01–US02. Rules: BR02, BR06. A-OPERATOR cannot grant its own permissions or inspect unrelated grant paths. During unavailable or indeterminate authorization, an administrative attempt yields no asserted effective change. Authorized reviewers can distinguish a denied change, a failed/pending change and an effective one without exposing evidence to unauthorized subjects.

## Dependencies and Pending Decisions

Every other feature depends on this authority lifecycle and the epic's effective-change boundary. The grant ceiling, absence of onward delegation and expiry convention are proposed initial product policies needing review, not unresolved implementation choices. There is no blocking product question for writing technical specs against this proposal; broader enterprise delegation and emergency access remain outside scope.

## Engineering Delivery Progress

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Delivery | In progress | 2026-10-30 | [SPEC-EP-00-F01 revision 6](../../../architecture/specs/EP-00-F01-govern-scoped-access.requirements.md), [ADR-0001](../../../architecture/adrs/0001-m0-graph-authoritative-authorization-foundation.md). M0-01–16 accepted, including M0-16 schema/index correction on 2026-10-30, America/Sao_Paulo. Authorized M0-17 tenant SQL mapping is implemented and technically validated: 11 tenant mapping cases and 97 affected schema/connection/native-main checks passed; root lint, strict app typecheck and actual production build/native artifact checks passed. Tenant persistence mapping review pending. [F01 execution evidence](../../../architecture/specs/EP-00-F01-govern-scoped-access.tasks.md#execution-evidence). M0-18 and later F01 work have not started; F01 and the epic remain incomplete. |

This engineering update records delivery only; product-definition and business-validation states are unchanged. Configuration and shared-support checks do not complete any F01 acceptance criterion.
