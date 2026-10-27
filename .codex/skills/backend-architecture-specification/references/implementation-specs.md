# One-Feature Spec-Driven Development

The spec is the reviewable technical contract for implementing **one numbered feature
file from an epic**. It explains the problem, proposed design, risks, complete entity
contracts where needed, steps and observable completion evidence. Read
[the modular architecture skill](../../backend-modular-feature-architecture/SKILL.md)
and relevant references before designing those steps. A task list alone is not SDD.

Keep one canonical spec file for the selected product feature. Its operations may
need separate modular use-case slices, each with its own layer plan, but cannot include
a second product feature. Contextual dependencies are read-only scope references.
If another feature must be delivered first, record that dependency and obtain a
scope decision instead of writing a second spec or hiding it in a foundation task.

## Spec identity and review state

Use a stable identifier derived from the source, such as `SPEC-EP-00-F01`. Record:

- The actual source feature path and its feature ID, plus the epic overview link.
- Referenced requirement files, story/rule/acceptance IDs and relevant accepted ADRs.
- Current spec revision, update date, affected modules and approval state/evidence.
- Independent implementation status, current operation/layer/step and next review gate.

Record approval only for the revision actually approved by the user. Revised design
with materially different behavior, entity shape, risk acceptance or architecture
returns to review; ordinary progress/evidence updates do not invalidate approval.

## Required narrative and design

### Problem, outcomes and boundaries

Explain who experiences the problem, the concrete operational trigger, the desired
outcome and why this feature matters. Identify the authorization/data-integrity point
of truth, main path, negative paths, state/version prerequisites and scope exclusions.
State what is real in this increment, what business effects are temporarily simplified,
and how existing authority and behavior continue when the feature grows.

Map the source feature's stories, rules and every acceptance criterion to technical
behavior and planned verification. Cite adjacent features only as dependencies.
Do not silently change business policy to make a technical approach easier.

### Domain and complete entity contracts

Identify owning modules, aggregates, invariants, relationships and value objects.
For **every module entity created or changed**, include its complete proposed pure
TypeScript contract in the spec before requesting approval. List the intended source
path for each code block. Include dependent local interfaces, const objects and derived
types needed to understand the contract; a field list, database schema, ellipsis or
instruction to define it later is insufficient. For changes, show the complete proposed
result and explain the changes and compatibility impact.

Follow [entity.md](../../backend-modular-feature-architecture/references/entity.md):
pure shape contracts, sibling-only imports, named interfaces and const-derived types,
without frameworks, ORM decorators, I/O or business methods. Explain identity, tenant
ownership, optionality/nullability, version/history fields and lifecycle meaning.
Tenant-owned entities cannot become cross-tenant through an optional tenant boundary;
justify truly platform-wide entities and their separate access rules explicitly.

For unchanged entities, link existing contracts and explain their use; do not invent
new entity code unnecessarily. Canonical entity code in the approved spec is the
documented implementation target, updated through reviewed revisions when it changes.
Other layers need precise responsibilities, inputs/outputs, invariants and collaboration
contracts in prose/tables; full implementation code for those layers is not required.

### Modular flow and technical choices

Explain the flow across the layers actually needed: entity, domain, application,
outbound, inbound, wire and supporting platform/shared areas. Name operation boundaries,
ports, persistence/transaction ownership, error categories, protocol behavior and
authorization placement. Keep the dependency rule intact. Use the relevant reference
for each proposed area; do not create layers or abstractions with no responsibility.

Identify proposed decisions, realistic alternatives and consequences. The spec may
propose a modular-skill deviation with explicit rationale and impact, but cannot treat
it as approved. Research uncertain technology behavior through primary documentation
and record relevant versions/sources; do not force a technology already excluded by
the epic or treat sample code as repository capability.

### Technical risk assessment

Tie risks to this feature's actual operations, state and dependencies. Distinguish
facts, estimates, unknowns and assumptions. Use a table with risk, trigger/consequence,
evidence or assumption, design mitigation, residual risk and verification task.
Address the following with a concrete rationale or a justified `Not applicable`:

| Concern | Questions the spec must resolve |
| --- | --- |
| Hot path | Which frequently executed path is latency-sensitive, and what work/dependency fan-out sits on it? |
| Contention hot spot | Which tenant, group, object, row, lock, partition or shared resource could concentrate concurrent work? |
| Traffic and scale | What read/write mix, cardinality, bursts, payload/list sizes or growth matter? What is unknown and how will it be measured? |
| Criticality and authority | What happens if this operation is delayed, duplicated, wrongly allowed or unavailable? Which tenant/permission/version boundaries must hold? |
| Consistency and concurrency | Which state transitions must be atomic? How are races, stale decisions, revocation, retries and idempotency handled? |
| Dependency reliability | What are the timeout, failure, recovery, backpressure and observability requirements for relevant dependencies? |
| Events and delivery | Does this need synchronous processing, deferred work or cross-module events? Is event loss acceptable, and must a business write and event intent commit atomically? |
| Data lifecycle | Which indexes/query access patterns, migration, compatibility, retention/history or rollback issues affect this operation? |

Criticality does not automatically require event-driven architecture or outbox.
Choose patterns from the required consistency and failure behavior. When events are
proposed, read [events.md](../../backend-modular-feature-architecture/references/events.md)
and distinguish actual infrastructure from its reference examples. Explain the chosen
publish/DLQ or transactional-outbox pattern and its failure window. If outbox is needed,
plan atomic business-write/event-intent persistence, relay ownership, idempotent
consumption, retry/ordering, monitoring and recovery as applicable. Do not assume a
relay or durable broker exists, or bypass the protected decision through asynchronous work.

Do not invent throughput, latency or availability commitments. Record confirmed targets
or explicitly proposed experiment parameters and what result will resolve uncertainty.
Material unknowns that prevent a viable design must be resolved before seeking approval.

## Ordered implementation and verification plan

Use numbered checklist steps inside this same spec, ordered by actual dependencies
and the modular skill's inside-out workflow. Identify shared/platform prerequisites
explicitly, without hiding another product feature's implementation in a support step.
Preserve a separate review gate for each changed layer/supporting area and E2E stage.

Every step states:

- The operation, layer/area and intended source/test paths.
- Entry dependencies and the relevant modular skill reference(s).
- Behavior/contracts and source acceptance/risk items addressed.
- Required verification and observable completion evidence.
- Status, evidence, remaining limitations and the next review checkpoint.

For entity steps, reference the complete entity code already in this spec and plan
compiler validation. For behavior, use the modular skill's common testing rules and
current layer's testing section. Use the E2E guide for assembled flows. Avoid superficial
tests that merely repeat code structure. Plans must cover applicable tenant/permission
denials, business-state boundaries, failure/recovery, version history and concurrency.

Define the whole source feature's done conditions, including all required stages,
checks, retained behavior and known limits. Passing one layer does not complete the
feature. Keep planning approval, code completion, technical verification and stakeholder
business validation distinct.

## Suggested document structure

Use these sections with actual feature-specific content; do not leave template
instructions in a submitted spec:

1. Identity, source feature, revision and tracking.
2. Operational problem, outcomes, scope and exclusions.
3. Stories/rules/acceptance traceability.
4. Domain boundaries and complete new/changed entity code.
5. Layer flow, contracts, data/consistency and proposed decisions.
6. Technical risk assessment and validation experiments.
7. Ordered implementation/verification checklist and review checkpoints.
8. Done conditions, dependencies, limits and unresolved decisions.
9. Approval history and, only after approval, the associated ADR link.

Complete this one spec, update its source feature's delivery evidence, mark
`Awaiting approval` and **stop/end the turn**. Do not create an ADR, a second spec or
implementation code before approval. Follow the main skill's execution/status protocol
after approval and ADR recording.
