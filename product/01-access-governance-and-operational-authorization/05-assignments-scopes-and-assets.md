# Assignments, scopes, and assets

## What an assignment must declare

Every grant must record identity, tenant, role/permissions, scope, start, end or review rule, grantor, reason, and state. Where relevant, it also states shift/team, named assets, product family, required competency/certification, permitted HMI actions, and delegation origin. Without these elements, access is not activated.

| Assignment state | Meaning | Effect |
|---|---|---|
| Requested | need reported, not yet decided | grants no access |
| Scheduled approved | approved for a future period | active only at the scheduled start |
| Active | current conditions satisfied | participates in the authorization decision |
| Suspended | administrative, safety, or competency block | immediately denies dependent operations |
| Expired | validity end reached | preserves history, without power to act |
| Revoked | ended before expiry | preserves reason, revoker, and instant |

## Scope types

| Anchor | Covers | Typical use |
|---|---|---|
| Tenant | resources permitted by the permission | Owner, access policy, and branding |
| Legal entity/site | resources under selected organization/location | plant manager or local auditing |
| Area, line, cell, or center | physical children of that node | shift leader and local engineering |
| Named asset/station | only the specific machine/device | operator of Press P-12 or setup technician |
| Named functional object | specified nonphysical resource | SAP integration, product family, or report |
| Shift/team/period | additional boundary on the scope above | temporary night-shift coverage |

Broad scope does not grant a permission the role lacks. Narrow scope does not reveal neighbors: access to Press P-12 does not permit listing every press on Line 4. Queries by order, lot, event, alarm, KPI, or file filter by the person's inherited context and functional restrictions.

## Special rule for acting on an asset

To **operate** or perform setup/maintenance on an asset, the following are cumulative: operation permission, scope reaching the asset, explicit assignment to the asset or eligible group when policy requires, current competency/training, and order, safety, and quality prerequisites. Asset assignment does not grant user management, access to other assets, or technical approval.

The assignment identifies the operational reason: operate, setup, maintenance, inspection, supervision, or read. It can cover a named list or approved class; a change of model, criticality, location, or competency requirement triggers review, without presuming the skill remains suitable.

## Assignment administration

- Grantor needs authority for the granted scope and grants no more than delegation/policy permits.
- They provide reason, validity, and, for an exception, review date; the system shows impact before confirmation.
- Revocation/suspension immediately affects future acts; earlier facts preserve their authorship.
- Direct permission requires reason, an approver defined by policy, and expiry; no silent renewal.
- A change of asset scope preserves the location of the historical fact and reviews affected active assignments.

**Real situation:** Júlia operates E-02. To cover vacation, she receives the Operator role for asset E-03 for seven days, only on shift B, with certification verified. She remains without E-04 and loses E-03 when coverage ends, even if logged in.
