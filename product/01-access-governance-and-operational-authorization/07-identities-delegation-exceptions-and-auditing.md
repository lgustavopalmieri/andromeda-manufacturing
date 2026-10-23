# Identities, delegation, exceptions, and auditing

## Identity types

| Type | Purpose | Mandatory limit |
|---|---|---|
| Human | perform work and approve decisions | individual; not shared; accountable for their acts |
| Service/integration | exchange data under a defined contract | only contracted operations, data, and flow; does not inherit a person |
| Device | publish/receive identified asset context | limited to assigned asset/source; does not become an operational user |
| AI agent | read, propose, or fulfill delegated task | own identity, least privilege, and immediate revocation |

An integration or device does not use a human role to bypass scope. An agent does not silently represent a person: every response and act shows agent, sponsor, delegation, and result. A credential has owner, state, scope, validity, rotation/review according to policy, and a usage record.

## Delegation and temporary coverage

Delegating is allowing another identity to perform a **finite list of delegable acts**; it is neither sharing credentials nor copying every role. A delegation states delegator, recipient, tenant, resource/asset, actions, start/end, reason, conditions, approver when necessary, and revocation capability.

- A delegator only delegates an active assignment marked delegable; the recipient never receives more scope/power.
- Policy may require recipient acceptance and leader/reviewer approval before activation.
- Owner, ownership transfer, approval of own conflict, access policy, credential, and nondelegable acts defined by the tenant are not granted by this mechanism.
- Expiry, revocation, suspension, loss of certification, or relevant state change blocks/ends delegation.
- The action records executor and delegation; accountability does not disappear or become falsely attributed to the delegator.

For an AI agent, delegation also states whether it only proposes, executes with human confirmation, or automatically executes a low-risk action. HMI actions obey the same versioned contract, prerequisites, and evidence as human actions. An agent never administers identities, elevates access, transfers Owner, releases quality, or issues a physical command without explicit future policy and human confirmation when required.

## Emergency and exception

Emergency access restores governance or handles a digital/operational incident when the normal flow is unfeasible; it is not a shortcut for physical safety, interlocking, quality, or production target. It is exceptional, minimal, short-lived, with reason, scope, owner, notice to Owner/reviewer, and mandatory subsequent analysis. It expires automatically and is not silently renewed. The local emergency procedure remains independent of the product.

## Auditing and access review

The following must be auditable: tenant creation/activation/suspension, invitation, acceptance, role change, scope, competency, asset assignment, delegation, relevant denial, approval, exception use, HMI action, integration, and credential. An event contains at least effective identity, tenant, action, resource/scope, decision, instant, origin, correlation, reason, and before/after or outcome.

The tenant defines review frequency and owners. A review lists active, near-expiry, unused, privileged, delegated, and exceptional assignments, allowing confirmation, suspension, or revocation with a trail. An auditor reads immutable evidence only within authorized scope.

**Real situation:** during the supervisor's absence, an agent suggests downtime classification for Line 2 and fills in a draft. It does not confirm the justification: the assigned shift leader checks the context, confirms the action, and the trail records both identities.
