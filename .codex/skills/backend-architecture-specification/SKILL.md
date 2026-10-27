---
name: backend-architecture-specification
description: Create backend architecture context, one epic-feature Spec-Driven Development implementation spec at a time, and an ADR after spec approval. Use for engineering planning and decision records in architecture/, with modular-layer plans, entity contract code, technical risk analysis and delivery tracking. Does not define product requirements or authorize implementation.
---

# Backend Architecture and Spec-Driven Development

Use this skill with [backend-modular-feature-architecture](../backend-modular-feature-architecture/SKILL.md).
That skill remains authoritative for dependency direction, module/use-case boundaries,
entity purity, ports/adapters, layer ownership and verification. Read its relevant
references while designing the spec, not only during implementation. Follow the
Backend agent's stage review protocol.

## Product sources and working boundary

Requirements live in `product/requirements/`. Delivery epics live in
`product/epics/NN-epic-name/`: `00-epic.md` explains the integrated delivery and each
linked numbered feature file contains its stories, rules and acceptance criteria.
Read the entire selected epic, its referenced requirements and existing technical
artifacts before choosing the current feature. Inspect the actual repository;
reference examples and installed dependencies do not prove a capability exists.

Honor the user's selected feature. Otherwise state the first dependency-ready feature
chosen from the epic's order. **One source feature file, one canonical spec, one
approval checkpoint.** Context links to other features do not include their delivery
in the current spec. Do not use the overview as the sole source, combine feature files,
create per-layer specs or draft a batch of specs. Revise an existing canonical spec
instead of creating a competing one for the same source feature.

A product capability may contain several use-case operations. Keep their planning
inside that source feature's one spec, with a separate modular implementation slice
for each operation. Never turn this into a generic dispatcher or include a second
product feature. If a prerequisite belongs to another feature, record the dependency;
do not silently implement it or write its spec.

Write documents in English. Preserve tenant isolation, granular authorization,
configuration versioning, per-tenant behavior and the shared human/agent action
contract. Honor the epic's incremental continuity: retain and evolve existing
authority, protected operations, minimum real state and regression scenarios while
making any temporary business simulations explicit.

## Document types and storage

| Artifact | Purpose | Guide |
| --- | --- | --- |
| Architecture context | Shared problem, boundaries, proposed technical direction and constraints. | [Architecture context](references/architecture-context.md) |
| Implementation spec | Executable SDD plan for exactly one epic feature file. | [Implementation specs](references/implementation-specs.md) |
| ADR | Durable record of the decisions in an explicitly approved spec revision. | [Architecture decision records](references/architecture-decisions.md) |

Use the established directory mapped to the epic. When none exists, choose the next
available two-digit topic prefix under `architecture/` and a kebab-case epic name;
record the product epic's actual path so independently numbered directories remain
traceable. Do not create empty architecture folders or placeholder documents.

```text
architecture/NN-epic-name/
  00-architecture.md
  specs/
    01-feature-name.md
  adrs/
    01-decision-name.md
```

Mirror the source feature's numeric prefix/name in its spec filename where possible.
Number ADRs consecutively within the topic. Preserve existing paths and identifiers.
Keep a spec cohesive in one file; there is no artificial line limit. Architecture
context can summarize several dependencies but cannot contain a batch of feature specs.

## Approval and execution lifecycle

1. Understand the epic and inspect current code, decisions and technical constraints.
   Create/update architecture context only as needed to explain the selected scope.
2. Read [implementation-specs.md](references/implementation-specs.md) and the relevant
   modular architecture references. Complete one feature's spec, including entity
   code when applicable, risk-driven choices and ordered implementation/verification steps.
3. Mark its approval state `Awaiting approval`, record the exact revision and pending
   questions, link it in the source feature's delivery evidence, and **stop/end the
   turn for explicit user approval**. Do not create an ADR, code or another spec.
4. When that revision is explicitly approved, record the approval evidence and create
   the corresponding ADR using [architecture-decisions.md](references/architecture-decisions.md).
   That approval authorizes this record; no separate permission request is needed.
   An accepted ADR records a decision, not proof of implementation.
5. Follow existing authorization to implement only the next permitted layer/area.
   Maintain the selected spec's steps and epic delivery status as work advances.
   Spec approval does not authorize all stages, another feature or another spec.
6. At each stage review, record actual results/limits and stop under the Backend
   agent's protocol. Do not progress to another feature after completing this one
   without the required user direction. Substantive spec/decision changes return
   to approval; supersede the ADR when an approved decision changes.

Approval is tied to the source feature and spec revision. Silence, time, passing
checks or approval of a different artifact are not substitutes. Reuse existing
session authorization; do not ask again for an action already authorized.

## Tracking and evidence ownership

Specs distinguish approval (`Draft`, `Awaiting approval`, `Changes requested`,
`Approved`, `Superseded`) from implementation (`not started`, `in progress`, `blocked`,
`implemented`, `validated`). Record dates in the user's timezone, current step/layer,
affected modules, dependencies, remaining work, checks run and evidence/limits.
Approval cannot mark code implemented, and document validation cannot mark business
acceptance validated.

The Backend agent may update only the selected feature's delivery row/evidence and
the overview's aggregate delivery row/evidence in `product/epics/`. It may add a compact
engineering progress table with spec/ADR links if the existing tracking table cannot
express the current stage; keep business text, product definition and business-validation
states under Product Owner ownership. Do not edit another feature's status or source
requirements as a side effect. Preserve the product guide's
[tracking semantics](../product-requirements-documentation/references/epics.md#maintaining-the-status-table).

| Actual evidence | Spec implementation | Epic feature delivery |
| --- | --- | --- |
| Planning only; implementation inspected and confirmed absent. | `not started` | `Not started`; retain `Not reported` if implementation state is unknown. |
| A layer is being implemented, or required stages/checks remain. | `in progress` | `In progress` |
| A named dependency prevents continuation. | `blocked` | `Blocked`, with cause and next unblock action. |
| Code complete; required verification still outstanding. | `implemented` | `In progress`, with the unverified work identified. |
| All scoped code and required verification have supporting evidence. | `validated` | `Completed`; do not infer stakeholder business validation. |

Update tracking at stage transitions, before review pauses and final responses. Do
not complete the overview while any included feature remains incomplete. Report only
known aggregate state; a single completed feature does not complete the epic.
