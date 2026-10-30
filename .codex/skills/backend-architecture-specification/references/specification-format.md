# Three-Part Specification Format and Writing Guide

Use this guide when authoring or reviewing a feature spec. It describes the final
artifact; [implementation-specs.md](implementation-specs.md) governs discovery and
technical completeness, with the modular skill governing the architecture itself.

## Repository model

Read the current parts in order when learning this format:

| Model artifact | What to learn from it |
| --- | --- |
| [EP-00-F01 Requirements](../../../../architecture/specs/EP-00-F01-govern-scoped-access.requirements.md) | Review table, concrete first demonstration, outcome/evidence map, delivery roadmap, open gates, complete source coverage and handoff. |
| [EP-00-F01 Design](../../../../architecture/specs/EP-00-F01-govern-scoped-access.design.md) | Reading guide, request sequence, responsibility/storage boundaries, negative outcomes, complete contracts with intended paths and native examples. Read the current main body; its historical appendix is superseded. |
| [EP-00-F01 Tasks](../../../../architecture/specs/EP-00-F01-govern-scoped-access.tasks.md) | Start-here stage map, small dependency-linked checkboxes, case catalog, later design work and separate planning/runtime evidence. |
| [Architecture context](../../../../architecture/00-authorization-platform-context.md) | Short orientation, sources/current reality, ownership, unresolved risks and next checkpoint. |
| [Accepted ADR](../../../../architecture/adrs/0001-m0-graph-authoritative-authorization-foundation.md) | Exact approved revision/scope, decisions, alternatives, consequences and conformance links. |

These artifacts model organization, teaching style and traceability. Their domain,
OpenFGA/PostgreSQL choices, fixture counts, M0/M1 naming, approval history and request
to start implementation in a new context window belong to that assignment. Do not
copy them into unrelated features. Consult applicable accepted decisions separately
when they constrain the new design. A new package does not need a historical appendix.

## Package identity and navigation

For source `EP-NN-FNN`, use one basename and these three siblings directly in
`architecture/specs/`:

```text
EP-NN-FNN-feature-name.requirements.md
EP-NN-FNN-feature-name.design.md
EP-NN-FNN-feature-name.tasks.md
```

Use titles `SPEC-EP-NN-FNN — Requirements and Delivery Map`, `— Design` and
`— Tasks`. Each document opens with sibling links in **Requirements → Design →
Tasks** order, marking the current part. Keep relative paths and meaningful anchor
links. Requirements contains the authoritative review table; Design and Tasks
carry a compact, consistent revision/date/approval-scope/implementation summary.

One package has one design revision. An approval identifies both that revision and
its scope. Track feature completion independently from approval and implementation
of an increment. Never maintain three competing approval histories or copy the
entire design into Requirements, Tasks, context or ADR.

## Requirements: what the delivery must demonstrate

This is an engineering interpretation and delivery map derived from the read-only
product feature. It is not a new product requirements document or permission to
rewrite its rules. Use this section order, adapting feature-specific headings:

1. **Review state.** A field/value table with package/revision, update date/timezone,
   source feature and overview, supporting requirement links, relevant context,
   approval status and exact scope, implementation/current step, whole-feature
   completion, approval evidence and ADR when one exists. Before ADR creation use
   `Not created`; never link an anticipated file as an accepted decision.
2. **What we will be able to demonstrate.** Describe a concrete actor, trigger,
   resource, expected effect and representative refusal/failure. State repository
   reality and what this delivery adds. Explain how retained behavior grows later.
3. **Required results and completion evidence.** A table of stable engineering result
   IDs, required behavior and observable evidence. Derive these from source behavior
   and necessary technical contracts, clearly identifying engineering milestones.
4. **Includes and defers.** Identify real state/effects, temporary simulations,
   exclusions and later work within the same feature. Deferred product criteria
   remain requirements; simplification does not waive them.
5. **Delivery roadmap.** Order, increment/operation, what becomes possible and design
   prerequisite/limit. A single delivery can have a short sequence; milestones are
   useful when the agreed delivery is incremental, not a required ceremony.
6. **Blocking requirements/open gates, when present.** Give each gate an ID, problem,
   required next design result and affected source IDs. Identify what it blocks.
   Distinguish future design gates from questions that prevent this review now.
7. **Complete source map.** Map every source story, rule and acceptance criterion to
   its required behavior and design/task or future delivery destination. Mark partial
   coverage honestly. A first demonstration is not complete feature acceptance.
8. **Review history and next checkpoint.** Record meaningful revisions, confirmed
   decisions and actual planning evidence without a transcript of the conversation.
9. **Backend handoff, after approval.** A compact table naming source/revision/scope,
   ADR, proposed first stage and its entry/completion conditions, subsequent sequence,
   modules/contracts, task/case references, critical boundaries, readiness/limits and
   ownership. Reflect existing implementation authorization separately from approval.

## Design: how the operation works and why

Lead with an understandable current flow. Put detailed reference material after the
flow so the reader can understand the design before inspecting type/model blocks.

1. **Reading guide and approval boundary.** State the main path in one sentence,
   what is proposed/approved and where the implementable scope ends.
2. **One operation from entry to outcome.** Explain identity/input → authorization →
   business rules/effects → persistence/integrations → response. Use a small Mermaid
   sequence diagram when ordering, failure branches or boundaries need it. Include
   separate flows for materially different operations within this same feature.
3. **Responsibilities and ownership.** A table of module/layer/port/adapter/storage
   owner and responsibility. Show trusted versus caller-controlled facts, tenant
   boundaries, authority, dependency direction and transaction ownership.
4. **Behavior and failure contracts.** Explain invariants and state/version
   transitions, concurrency/idempotency, safe rejection/error mapping, partial or
   unknown outcomes and recovery where applicable. A condition/result/effect table
   makes negative paths reviewable. Separate authorization decisions from business
   outcomes whenever that distinction matters.
5. **Data, lifecycle and integration.** Describe access patterns, constraints,
   indexes, mappings, migration/compatibility, version/history, startup/binding and
   external delivery semantics as relevant. Explain alternatives and consequences
   near the choice. Omit subjects with no bearing on this feature.
6. **Risks and failure behavior.** Stable risk IDs, trigger/consequence, evidence or
   assumption, mitigation/residual limit and linked tasks/cases. Apply the authoring
   guide's risk assessment rather than copying the sample's risk list.
7. **Complete contracts.** Show every new/changed entity as complete pure TypeScript,
   preceded by its intended source path. Include dependent local types/constants;
   explain identity, ownership, optionality and lifecycle meaning. Include other
   complete port/I/O contracts when they resolve an important boundary. Link unchanged
   contracts. Full implementation code for all layers is unnecessary.
8. **Exact technical examples and sources, when useful.** Provide consistent request,
   response, event, model or native API examples where prose leaves ambiguity.
   Distinguish illustrative IDs from deployed bindings and researched provider
   behavior from proposed integration behavior. Record primary sources/versions for
   uncertain external behavior. Examples must match the current contracts.

If superseded material must be retained, put it behind an explicit reading boundary,
label its revision/status and explain which choices are obsolete. It must never be
confused with the current implementation target. Prefer links to history when they
provide enough traceability; do not accumulate old proposals by default.

## Tasks: what Backend builds and verifies

Use this order so the next implementer can identify the next reviewable result:

1. **Start here and stage map.** Name the first result, current readiness and a short
   area/task-range/result table when it helps navigation. Stage groups do not merge
   individual review checkpoints or authorize implementation.
2. **Execution/review rules and guides.** Define the source-path base, dependency
   semantics, default unchecked status, evidence fields and review protocol. Map
   affected areas to the modular references; runtime checks require common testing
   rules plus the current layer, with E2E as a separate assembled stage.
3. **Ordered implementation checklist.** Stable task IDs; one bounded output per
   checkbox. Split unrelated contracts, configuration, adapters, persistence or
   layer changes when they produce separate reviewable results. Avoid both a single
   "implement the feature" task and arbitrary per-line/file fragmentation.
4. **Technical case catalog.** Stable case IDs, level/owning tasks, starting state and
   stimulus, observable expected behavior, and source/risk rationale (directly or
   through task trace fields). Include product acceptance and complementary technical
   cases; state that cases are planned until actually executed.
5. **Later design work, only for agreed incremental planning.** Distinct Architect
   planning tasks with entry dependencies, required design output, source coverage,
   blocking gate and review. These are not Backend coding tasks. Future work remains
   in this feature package and receives implementation tasks after design approval.
6. **Documentation verification.** Actual planning checks, their scope and limits.
7. **Execution evidence.** Current implementation stage/status, tests/results,
   limitations, remaining work and next checkpoint, owned by Backend.

Use the existing compact checkbox pattern, adapted to this feature:

```markdown
- [ ] **T01 — Verb and concrete result**
  - **Area / paths:** intended source and test paths. **Depends on:** task IDs or none.
  - **Deliver:** behavior/contract and boundary to preserve; link Design as needed.
  - **Verify:** case IDs and required check. **Trace:** source/result/risk IDs. **Review:** area/layer checkpoint.
```

Before implementation, declare common defaults once: status `not started`, execution
evidence `none`, known limitations and the task's next review checkpoint. Backend
replaces those defaults with actual progress and results, retaining stable IDs.
Order tasks so dependencies exist and are ready earlier; include support work only
when required by this feature. A checkbox cannot hide a second product feature.

## Writing style and detail budget

Write all artifacts in English. Match the model's two reading speeds:

- **Teach consequential boundaries.** Explain the operational reason for a decision,
  then walk one concrete example through it. Spend detail on authority, effect
  timing, ownership, concurrency, versions and failure/recovery when readers could
  otherwise implement different behavior. Introduce unfamiliar terms at first use.
- **Be direct for routine work.** Use short paragraphs and compact tables for state,
  responsibilities, mappings, dependencies and evidence. Tasks use verbs and
  observable results. Avoid generic architecture lectures and repeated disclaimers.
- **Keep one source of detail.** Link contracts, gates, tasks and cases by stable
  IDs/anchors. Summarize only what the current reader needs. Requirements explains
  outcomes, Design explains mechanisms, Tasks explains execution/verification.
- **Use examples to remove ambiguity.** Keep fixture identities consistent across
  documents and show a representative negative path. Do not copy the sample's
  volume, field-by-field comments or native payloads when they add no clarity.
  Code comments follow the project baseline: meaningful non-obvious intent or an
  explicit user request; ordinary explanations belong in nearby prose.
- **Make claims proportional to evidence.** Separate facts, proposals, assumptions,
  design approval, document/compiler QA and executed runtime/business validation.
  A long design, successful empty suite or accepted ADR cannot prove delivery.
