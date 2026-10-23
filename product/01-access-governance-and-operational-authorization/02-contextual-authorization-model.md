# Contextual authorization model

## Access decision

A request is authorized only if **all** of the conditions below are true:

1. the identity is authenticated, active, and linked to the selected tenant;
2. it has the exact permission for the requested operation, through a role or exceptional grant;
3. the resource belongs to the same tenant and is within at least one active scope of the grant;
4. the resource state permits the operation and all operational preconditions have been met;
5. shift, time, competence, certification, asset assignment, and local policy, when required,
   are valid; and
6. there is no safety, quality, segregation-of-duties, expiry, or revocation block.

Absence of permission is denial. A screen, URL, direct identifier, export, integration, or HMI
action does not replace this decision. The same rule applies before revealing metadata that could
confirm the existence of a resource outside the scope.

## Structuring rules

- The tenant is the maximum boundary: an assignment never reaches another tenant, including for audit,
  support, integration, agent, or Owner.
- A person participating in more than one tenant has independent assignments and selects the active
  context; roles from one tenant do not combine with those from another.
- Permissions may accumulate; a suspension, revocation, state block, or mandatory segregation rule
  always prevails over the accumulation.
- View, list, search, export, create, edit draft, submit, approve, publish, operate,
  correct, administer, and delete/withdraw are different operations.
- A role is a reviewable preset. Effective authorization comes from the contextual assignment, not the role
  name nor the person's hierarchical position.
- Configurable objects use version, state, and validity. Editing a draft does not authorize changing a
  current version, an execution in progress, or historical evidence.

## Scope and inheritance

Physical scope follows the configured hierarchy: tenant → legal entity (when used) → site →
area → line/process → cell/work center → asset. A grant at a node covers its current children,
except for exclusions permitted by policy. A grant on an asset does not reveal the other assets at the
same location.

Every event and operational record preserves the tenant, location/asset, order, and context current when
the fact occurred. If a machine is transferred to another line, new facts use the new location; historical
queries respect the recorded context without rewriting evidence to expand access.

In addition to physical scope, a grant may limit an identified object (Brazil ERP Integration), product
family, shift, team, HMI action, or information type. The specific limit does not create implicit access
to siblings or similar objects.

## State, capability, and effect

Permission does not make an action possible: starting an order still requires a released/prepared order, a
fit asset, conforming material/quality/EHS, and an applicable HMI contract. A quality block is not
removed by a production permission. The response indicates success, policy refusal, pending
precondition, timeout, or failure, without exposing protected data.
