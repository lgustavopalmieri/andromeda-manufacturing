# One-Feature Spec-Driven Development: Investigation and Authoring

The spec is one reviewable, three-part technical contract for **exactly one numbered
feature file from an epic**. Its Requirements document maps every story, rule and
acceptance criterion; Design and Tasks describe the scope submitted for approval.
Save the linked `.requirements.md`, `.design.md` and `.tasks.md` siblings directly in
**`architecture/specs/`**, using the same source feature ID and basename.
Requirements and epics are Architect's read-only inputs, never its deliverables.
The spec explains the problem, proposed design, risks, complete entity
contracts where needed, steps and observable completion evidence. Architect owns
this design; Backend implements the approved version and records its execution. Read
[the modular architecture skill](../../backend-modular-feature-architecture/SKILL.md)
and relevant references before designing those steps. A task list alone is not SDD.

Use [specification-format.md](specification-format.md) for the repository model,
document structure, navigation and writing style. Keep one canonical package for the
entire selected product feature file. Its operations may need separate modular
use-case slices, each with its own layer plan, but cannot include a second product
feature. Contextual dependencies are read-only scope references.
If another feature must be delivered first, record that dependency and obtain a
scope decision instead of writing a second spec or hiding it in a foundation task.

## Discovery and delivery framing

Investigate before choosing the final flow or producing a complete task breakdown:

1. Read the assigned feature, overview, supporting product requirements, relevant
   accepted decisions and current implementation/tests. Identify retained state,
   implemented capabilities and gaps. Installed packages and reference examples do
   not establish a capability.
2. Read the modular skill and the references for the affected layers/topics. Use
   their dependency, entity, orchestration, persistence, authorization and verification
   rules to compare candidate designs throughout the investigation.
3. Clarify choices whose answers materially change the feature flow, architecture
   or delivery order. Questions before writing are encouraged; do not wait until a
   polished design makes an unresolved choice expensive to change.

Useful questions, selected for the actual uncertainty, include:

| Uncertainty | Question to clarify |
| --- | --- |
| Operational path | Who initiates the operation, on what resource/state, and what should they observe afterward? |
| First useful result | What should the first demonstration accomplish? Which state and effects must be real, and which may be controlled fixtures or simulations? |
| Ownership and flow | Which component owns the authoritative state/decision? What must happen before an operation is allowed or acknowledged as effective? |
| Failure and concurrency | If a dependency fails, a request repeats or a concurrent change arrives, what outcome and recovery does the product expect? |
| Delivery sequence | Should this review cover the whole feature design or an incremental delivery? What must remain usable and which prerequisites already exist? |

Ask only what repository evidence and existing conversation decisions cannot answer.
Prefer a few focused questions, explaining consequential options, over a generic
questionnaire. Continue independent research while waiting. Route missing business
policy/source scope to Product Owner; Architect clarifies and proposes technical
choices without editing product definitions. Record confirmed answers and explicit
assumptions in the relevant package section. Questions are discovery, separate from
the final approval checkpoint.

Normally design the complete source feature. When incremental planning is requested
or agreed, keep the complete source map in Requirements, fully specify the submitted
increment in Design and Tasks, and map later outcomes to explicit Architect design
tasks and blocking gates. Do not present future mechanisms as designed or approved.
Unresolved gates may remain only outside the submitted implementable scope: show the
source behavior they block and prevent claims of that behavior before closure. If a
gate prevents the current increment's promised outcome, resolve it before review.
The feature remains incomplete until all required deliveries and verification finish.

## Spec identity and review state

Use a stable identifier derived from the source, such as `SPEC-EP-00-F01`. Record:

- The actual source feature path and its feature ID, plus the epic overview link.
- Referenced requirement files, story/rule/acceptance IDs and relevant accepted ADRs.
- Shared package revision, update date, affected modules and approval scope/evidence.
- Independent implementation status, current operation/layer/step and next review gate.

Keep the authoritative review table in Requirements and compact matching summaries
in Design and Tasks. Record approval only for the revision and scope actually
approved by the user. Revised design with materially different behavior, entity
shape, risk acceptance or architecture returns to review; ordinary progress/evidence
updates do not invalidate approval.

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
For **every module entity created or changed in the submitted scope**, include its
complete proposed pure TypeScript contract in Design before requesting approval.
List the intended source path for each code block. Include dependent local interfaces,
const objects and derived types needed to understand the contract; a field list,
database schema, ellipsis or
instruction to define it later is insufficient. For changes, show the complete proposed
result and explain the changes and compatibility impact.

Before writing entity code, read
[entity.md](../../backend-modular-feature-architecture/references/entity.md) and consult
its examples whenever needed. Follow its pattern completely:
pure shape contracts, sibling-only imports, named interfaces and const-derived types,
without frameworks, ORM decorators, I/O or business methods. Explain identity, tenant
ownership, optionality/nullability, version/history fields and lifecycle meaning.
Tenant-owned entities cannot become cross-tenant through an optional tenant boundary;
justify truly platform-wide entities and their separate access rules explicitly.

For unchanged entities, link existing contracts and explain their use; do not invent
new entity code unnecessarily. Canonical entity code in the approved Design is the
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

## Complementary technical test cases

The epic's acceptance criteria establish business outcomes; they are not the entire
verification plan. Architect must identify additional implementation and behavior
cases needed to prove the selected technical contracts and mitigate its risks. These
cases live in this feature package's Tasks catalog and do not invent new product
requirements. Link their source outcomes in Requirements and technical risks in Design.

Read [testing.md](../../backend-modular-feature-architecture/references/testing.md)
and each affected layer's testing section while planning cases. Use
[e2e.md](../../backend-modular-feature-architecture/references/e2e.md) for assembled
contracts. Cover applicable rollback/atomicity, stale writes, concurrent attempts,
duplicate requests/events, idempotent retries, ordering, recovery, repository mappings,
database constraints, tenant/query filtering, error translation and adapter failures.
For relevant hot paths or query/index risks, specify a suitable experiment with its
dataset/load assumptions and observable success evidence. Do not invent production
targets or brittle assertions about an incidental query plan.

Give each case a stable local ID, such as `TC01`, and identify:

| Case information | Required detail |
| --- | --- |
| Scope and rationale | Operation plus source acceptance criterion or explicit technical risk/contract. |
| Verification level | Compiler check, unit, integration, E2E or justified performance/recovery experiment. |
| Starting conditions | Relevant fixture, prior state, dependency behavior and concurrent/duplicate stimulus. |
| Observable expectation | Actual behavior or invariant to prove, including prohibited partial effects or disclosure. |
| Delivery mapping | Implementation step/layer responsible, dependencies and later execution evidence. |

Pure entity contracts use compiler validation, not artificial runtime tests. Verify
public behavior and boundary contracts; avoid cases that merely mirror private code.
Where no extra technical case is needed, explain why the existing planned verification
already covers the risk. Backend may add meaningful cases within approved behavior
as implementation reveals them; a material design change returns to Architect.

## Ordered implementation and verification plan

Use stable, numbered checkbox tasks in Tasks, ordered by actual dependencies and
the modular skill's inside-out workflow. Identify shared/platform prerequisites
explicitly, without hiding another product feature's implementation in a support step.
Preserve a separate review gate for each changed layer/supporting area and E2E stage.

Every task states:

- The operation, layer/area and intended source/test paths.
- Entry dependencies and the relevant modular skill reference(s).
- Behavior/contracts and source acceptance/risk items addressed.
- Required verification, technical case IDs and observable completion evidence.
- Status, evidence, remaining limitations and the next review checkpoint.

For entity tasks, link the complete entity code in Design and plan
compiler validation. For behavior, use the modular skill's common testing rules and
current layer's testing section. Use the E2E guide for assembled flows. Avoid superficial
tests that merely repeat code structure. Plans must cover applicable tenant/permission
denials, business-state boundaries, failure/recovery, version history and concurrency.

Define the submitted scope's done conditions and the whole feature's completion
conditions, including required stages, checks, retained behavior and known limits.
When later increments still need design, identify their required outcomes without
pretending their implementation plan is ready. Passing one layer or completing an
increment does not complete the feature. Keep planning approval, code completion,
technical verification and stakeholder business validation distinct.

## Package verification and review

Use the three document structures in
[specification-format.md](specification-format.md). Before submitting the package:

- Resolve local links/anchors and check Markdown fences/diagrams; parse structured
  examples where appropriate. Check that package IDs, revision/scope summaries,
  contracts and fixture names agree across all three parts.
- Compare the source feature with the complete source map, including deferred
  destinations. Check that each task dependency and case reference exists, the
  execution order has no readiness cycles, and gates block the affected claims.
- Compile new/changed TypeScript contracts in an isolated temporary workspace using
  the project's strict settings when they can be validated independently. Record
  actual results and limits; do not write app code or implementation tests as QA.
- Verify technical boundaries against the relevant modular references. Identify
  external behavior researched versus integration behavior still awaiting runtime
  proof. Do not invent approval, execution results or completion from document QA.

Record planning evidence in Tasks and meaningful revision history in Requirements.
Keep runtime cases planned and execution evidence separate until Backend performs
them. Do not leave template instructions in the submitted documents.

Complete the package for the proposed scope, mark `Awaiting approval` with its shared
revision and exact scope, and **stop/end the turn**. Do not create an ADR, a second
feature package or implementation code before approval. After explicit approval,
Architect records the matching ADR and adds the Requirements handoff, linking Design
contracts and Tasks/cases. Follow the main skill's execution/status protocol; Backend
implements only authorized stages and records their actual evidence.
