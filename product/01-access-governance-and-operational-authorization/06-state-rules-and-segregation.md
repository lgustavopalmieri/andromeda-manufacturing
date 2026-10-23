# State and segregation rules

## Access depends on the lifecycle

An operation is permitted only in the state for which it was designed. An engineer edits a draft, a reviewer analyzes a submitted version, an approver approves, and a publisher makes it current; an operator starts a released/prepared order; Quality decides a pending batch; Maintenance attests return after service is completed. Changing the URL, repeating a request, or using an integration does not change state.

A fact already recorded is evidence: a correction creates an adjustment linked to the original, with a reason and approver when applicable. Correction permission does not authorize overwriting authorship, instant, raw value, process version, or initially observed result.

## Minimum tenant-configurable segregation

| Context | Acts that cannot be accumulated by the same identity on the same object/version | Minimum control |
|---|---|---|
| Recipe, routing, form, rule, or HMI | create/edit or request approval × approve/publish own version | distinct approver; policy may require two levels |
| Critical configuration change | assess impact/propose × approve validity/reversal | approver with appropriate scope and competence |
| Inspection and quality | record result/request disposition × release/grant to oneself | segregated decision when policy/classification requires it |
| Nonconformance | open/record deviation × approve own closure/effectiveness | distinct decision maker for defined criticality |
| Production and adjustment | record production/loss/downtime × approve own critical correction | adjustment preserves fact and independent approval |
| Inventory | count or enter adjustment × approve own inventory adjustment | value/risk limit defined by the tenant |
| Critical maintenance | perform service × attest return to production | second responsible party according to asset criticality |
| Access | request/receive privilege × approve its exceptional review | distinct administrator/reviewer according to policy |
| Ownership | request/accept becoming Owner × complete own transfer | prior Owner or distinct recovery authority |
| Agent | define delegation × confirm critical act performed by the agent | distinct sponsor and human approver when required |

The rule compares the effective person/identity, not the role label. Having two roles, using another screen, or operating on a different shift does not satisfy separation. A permitted exception records justification, risk, authorizer, term, and subsequent review; it never erases the conflict.

## Particularly sensitive acts

Transferring/suspending an Owner; elevating access outside a role; changing access policy; publishing/reverting a rule, HMI, or form; granting quality; releasing blocked material; adjusting inventory; correcting a fact that changes a KPI; returning a critical asset; managing an integration/device credential; and any contracted physical command require specific permission, reason, and enhanced audit.

For a sensitive act, the decision revalidates state and scope immediately before effect. A prior confirmation is invalid if the order, asset, certification, quality/EHS block, or assignment changed. A required signature/attestation identifies meaning, content, version, identity, and instant; a simple login does not replace it.

## Operational priority

Production target, order priority, and Owner title never suspend a safety, quality, or competence block. A person authorized to report risk may open/escalate a record; this does not imply a safety command or permission to ignore local procedure.

**Real situation:** Marcos created version 8 of the cleaning checklist and submitted it. Even with the Engineer and Plant Manager roles, he neither approves nor publishes it. Renata, an authorized reviewer for the line, approves it; only then can the designated publisher apply it to new executions.
