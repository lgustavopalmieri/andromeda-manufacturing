# Access governance and operational authorization

## Product decision

This requirement turns the foundation principles into implementable rules for creating an
organizational account, establishing its Owner, and controlling who can view, decide on, or act on each asset
and process. It complements, without changing, the foundation
[00-andromeda-manufacturing-product-foundation](../00-andromeda-manufacturing-product-foundation/00-andromeda-manufacturing.md).

A permission is not a job title, and a role is not unrestricted access. Every power must have an operational
need, organizational/physical scope, validity period, state conditions, and traceable authorship.

## Expected outcome

A factory with multiple sites must be able, for example, to allow an operator to operate only the
E-03 Filler on shift B; an engineer to prepare a new recipe without publishing it; Quality to
release a batch without altering the original result; and the Owner to govern the account without gaining
automatic operational access. All of this must remain true through the screen, API, integration, HMI,
query, export, and future agent action.

## Scope of this requirement

- tenant onboarding, initial Owner, continuity, and ownership transfer;
- personas, base roles, operation catalog, and role/assignment-based access;
- scope by tenant, physical hierarchy, assets, functional objects, shift, and product;
- authorization by state, competence, asset assignment, and operational precondition;
- segregation of duties, temporary delegation, non-human identities, exception, and audit;
- real scenarios and verifiable criteria for the initial implementation.

It does not define visual identity, authentication protocol, screens, or technical architecture. It does not turn
Andromeda into a safety controller, PLC/DCS/SIS, or physical emergency authority.

## Binding assumptions inherited from the foundation

1. `tenantId` is the isolation boundary for every resource, signal, file, search, and integration.
2. The tenant → site → area → line → cell → asset hierarchy anchors permissions and context.
3. Configurations and HMI contracts are versioned; execution preserves the version that governed it.
4. Safety, quality, competence, and process state prevail over production targets.
5. The HMI action contract serves humans and agents, but an agent acts only through explicit delegation.

## Reading order and priority

| Artifact | Detailed decision |
|---|---|
| 01 | business personas and responsibilities |
| 02 | contextual decision rule and scope boundaries |
| 03 | tenant and Owner creation/activation |
| 04–05 | operations, roles, assignments, and assets |
| 06–07 | state, segregation, identities, delegation, and audit |
| 08 | Given/When/Then scenarios and criteria |
| 09–10 | employee daily lifecycle, responsibilities, and verifiable criteria |

The Foundation/MVP scope must support, at a minimum, tenant, Owner, member, role, scope
assignment, asset, and audit trail. Additional roles and sophisticated policies may evolve without
weakening the rules in this requirement.
