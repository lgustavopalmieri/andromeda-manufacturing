---
name: backend-architecture-specification
description: Guide Architect-owned backend architecture, one-feature SDD specs with entity code, technical risks and complementary test scenarios, and ADRs after approval. Also guides Backend consumption of approved specs and execution tracking. Use for technical documents in architecture/; does not define product requirements or authorize implementation.
---

# Backend Architecture and Spec-Driven Development

Use this skill with [backend-modular-feature-architecture](../backend-modular-feature-architecture/SKILL.md).
That skill remains authoritative for dependency direction, module/use-case boundaries,
entity purity, ports/adapters, layer ownership and verification. Read its relevant
references while designing the spec, not only during implementation. Follow the
Backend agent's stage review protocol during implementation.

## Role ownership and context loading

The **Architect agent** owns architecture context, entity design, spec authoring and
ADRs. It uses the references for the artifact being designed and all modular topics
needed by that feature. It does not write production code or implementation tests.
Requirements and epics pointed out for the assignment are read-only inputs for
Architect: it never creates/edits epics, requirements or their status/tracking.
Its outputs are technical documents, with specs in `architecture/specs/` and ADRs
in `architecture/adrs/`.
The **Backend agent** consumes the approved spec/ADR and owns code, tests, step status,
execution evidence and discovered findings. It reads this entrypoint and only the
approved feature and current layer's relevant sources; it need not load all authoring
guides or repeat epic-wide design analysis.

Backend returns material design gaps to Architect with reproducible evidence. Architect
revises the same canonical spec, obtains approval when the change is substantive and
updates/supersedes the ADR as appropriate. Routine implementation choices and added
tests within approved behavior stay with Backend. Neither role silently takes over
the other's substantive work.

## Product sources and working boundary

Requirements live in `product/requirements/`. Delivery epics live in
`product/epics/NN-epic-name/`: `00-epic.md` explains the integrated delivery and each
linked numbered feature file contains its stories, rules and acceptance criteria.
Architect reads the assigned epic overview, selected feature file and pointed/referenced
requirements, using adjacent files only when dependencies require them. These are
product inputs, not technical outputs. Backend reads the overview,
selected feature, applicable requirements and approved spec/ADR, loading adjacent
context only when a dependency requires it. Inspect the actual repository;
reference examples and installed dependencies do not prove a capability exists.

Honor the user's selected feature. Otherwise state the first dependency-ready feature
chosen from the epic's order. **One source feature file, one canonical spec, one
approval checkpoint.** The spec covers that source file in full: every story, rule
and acceptance criterion. Never merge feature files, cover only a fraction of one,
or write a spec with no source feature file. Context links do not include another
feature's delivery. Do not use requirements or the overview as substitutes, create
per-operation/per-layer/per-phase specs or draft a batch of specs. Revise the canonical spec
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
| Implementation spec | SDD plan for exactly one complete epic feature file, in `architecture/specs/`. | [Implementation specs](references/implementation-specs.md) |
| ADR | Decisions in an approved spec revision, in `architecture/adrs/`. | [Architecture decision records](references/architecture-decisions.md) |

Use these output locations directly. Keep product sources under `product/` read-only
for Architect. Do not create an enclosing directory per epic, empty folders or
placeholder documents. Additional technical context may live under `architecture/`
when needed for the requested design.

```text
architecture/
  00-context-name.md
  specs/
    EP-00-F01-feature-name.md
  adrs/
    0001-decision-name.md
```

Include the source feature ID in the spec filename to distinguish different epics.
Number ADRs consecutively across `architecture/adrs/`. Preserve existing identifiers;
if legacy documents use different locations, report the discrepancy rather than
moving them without an explicit assignment.
Keep a spec cohesive in one file; there is no artificial line limit. Architecture
context can summarize several dependencies but cannot contain a batch of feature specs.

## Approval and execution lifecycle

1. Architect understands the epic and inspects current code, decisions and technical
   constraints. It creates/updates architecture context only as needed for the scope.
2. Architect reads [implementation-specs.md](references/implementation-specs.md) and
   the relevant modular references. It completes one feature's spec, including entity
   code where needed, risk-driven choices, complementary technical test cases and
   ordered implementation/verification steps.
3. Architect marks the spec `Awaiting approval` in `architecture/specs/`, records
   the revision, pending questions and source feature link inside that spec, and
   **stops/ends the turn for explicit user approval**. It creates no ADR, code or
   another spec while approval is pending.
4. After explicit revision approval, Architect records the approval and creates the
   corresponding ADR in `architecture/adrs/` using [architecture-decisions.md](references/architecture-decisions.md).
   That approval authorizes this record without another permission request. Architect
   adds the compact Backend handoff to the approved spec; it does not implement it.
   An accepted ADR records a decision, not proof of implementation.
5. Backend follows existing authorization to implement only the next permitted
   layer/area. It maintains the selected spec's steps and epic delivery status.
   Spec approval does not authorize all stages, another feature or another spec.
6. At each stage review, Backend records actual results/limits and stops under its
   protocol. It does not progress to another feature without the required user
   direction. Material design findings return to Architect for the same spec's
   revision/approval and, when needed, a superseding ADR.

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

Architect owns the spec's design/approval fields; Backend owns implementation steps,
test execution, evidence and findings. Architect maintains planning/handoff evidence
exclusively in technical documents; it has no write permission in `product/`.
Backend maintains execution evidence during implementation. Backend alone may update
the selected feature's delivery row/evidence and the overview's aggregate delivery
row/evidence in `product/epics/`. It may add a compact
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
