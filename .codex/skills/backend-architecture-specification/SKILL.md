---
name: backend-architecture-specification
description: Guide Architect-owned backend discovery and three-part feature specs (requirements, design, tasks) modeled on architecture/, with ADRs after approval. Uses the modular architecture skill for technical design; also guides Backend handoff and execution evidence. Does not define product requirements or authorize implementation.
---

# Backend Architecture and Spec-Driven Development

Use this skill with [backend-modular-feature-architecture](../backend-modular-feature-architecture/SKILL.md).
That skill governs the investigation and technical design: dependency direction,
module/use-case boundaries, entity purity, ports/adapters, layer ownership and
verification. Read its relevant references while investigating and planning, not
only during implementation. This skill governs the final document format and
approval lifecycle. Follow the Backend agent's stage review protocol during implementation.

## Role ownership and context loading

The **Architect agent** owns architecture context, entity design, spec authoring and
ADRs. It uses the references for the artifact being designed and all modular topics
needed by that feature. It does not write production code or implementation tests.
Product requirements and epics pointed out for the assignment are read-only inputs
for Architect: it never creates/edits those product artifacts or their status/tracking.
Its outputs are technical documents, with specs in `architecture/specs/` and ADRs
in `architecture/adrs/`.
The **Backend agent** consumes the approved spec/ADR and owns code, tests, step status,
execution evidence and discovered findings. It reads this entrypoint, the selected
feature package in Requirements → Design → Tasks order, its approved scope's ADR
and the current layer's relevant sources; it need not load all authoring guides or
repeat epic-wide design analysis.

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
chosen from the epic's order. **One source feature file, one canonical three-part
specification package.** Maintain coverage of every story, rule and acceptance
criterion. Never merge feature files, lose deferred requirements or write a spec
with no source feature file. Product requirements and the overview support that
source; they do not replace it. If a product requirement has no scoped feature,
route that product definition to Product Owner before technical specification.
Keep operations, layers and milestones within the same package instead of creating
competing specs or drafting a batch. Approval may cover the complete feature or an
explicitly agreed increment, always tied to a package revision and named scope.

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
| Implementation spec | One feature package: `.requirements.md`, `.design.md`, `.tasks.md`, in `architecture/specs/`. | [Authoring and investigation](references/implementation-specs.md), [format and writing guide](references/specification-format.md) |
| ADR | Decisions in an approved spec revision, in `architecture/adrs/`. | [Architecture decision records](references/architecture-decisions.md) |

Use these output locations directly. Keep product sources under `product/` read-only
for Architect. Do not create an enclosing directory per epic, empty folders or
placeholder documents. Additional technical context may live under `architecture/`
when needed for the requested design.

```text
architecture/
  00-context-name.md
  specs/
    EP-00-F01-feature-name.requirements.md
    EP-00-F01-feature-name.design.md
    EP-00-F01-feature-name.tasks.md
  adrs/
    0001-decision-name.md
```

Use the same source feature ID and basename for all three files, with one package
identifier and shared design revision. Requirements is the entry point and owns
review state/source coverage; Design owns technical contracts; Tasks owns the case
catalog, implementation checklist and execution evidence. Link all three in reading
order: **Requirements → Design → Tasks**.
Number ADRs consecutively across `architecture/adrs/`. Preserve existing identifiers;
if legacy documents use different locations, report the discrepancy rather than
moving them without an explicit assignment.
The current EP-00-F01 package and its context/ADR are the format model; see the
linked writing guide for their exact paths and reusable structure. Reuse their
organization and explanatory style, adapting content to the feature. Their M0 scope,
technology choices, historical appendix and session-specific restrictions are not
defaults for every spec. Architecture context can map dependencies, not batch specs.

## Discovery before writing

Read the product sources, current code, relevant decisions and modular guides first.
Questions are encouraged before committing to a flow or fully planning the spec.
Ask a small, focused set when answers affect the architecture or delivery: who acts,
what triggers the operation, the expected demonstration, state/authority ownership,
failure/effectiveness semantics, what is real versus simulated, and what should be
delivered first. Present concrete options and their operational consequences when useful.
Use repository/session answers already available; do not ask the user to repeat them.

Continue independent investigation while awaiting answers. Resolve material uncertainty
for the proposed approval scope before finalizing its design/tasks. Record confirmed
answers, explicit assumptions and any future blocking gates in the package; route
business-policy gaps to Product Owner. Do not use questions as a routine permission
gate or silently treat unanswered questions as approved choices. See the
[discovery guidance](references/implementation-specs.md#discovery-and-delivery-framing).

## Approval and execution lifecycle

1. Architect investigates the selected feature under the modular skill, clarifies
   material flow/delivery questions and frames the approval scope. It creates or
   updates architecture context only as needed.
2. Architect reads the authoring and format guides above. It writes the linked
   Requirements, Design and Tasks documents, including complete entity contracts
   where needed, risks, complementary cases and ordered verification tasks. When
   incremental design is agreed, map the whole feature but fully design/task only
   the submitted increment; identify later design outputs and blocking gates.
3. Architect marks the package `Awaiting approval`, records the shared revision,
   exact review scope and source links, and resolves questions blocking that scope. It
   **stops/ends the turn for explicit user approval**. It creates no ADR, code or
   another spec while approval is pending.
4. After explicit revision/scope approval, Architect records it and creates the
   corresponding ADR in `architecture/adrs/` using [architecture-decisions.md](references/architecture-decisions.md).
   That approval authorizes this record without another permission request. Architect
   adds the compact Backend handoff to Requirements, linked to Design and Tasks.
   It does not implement it. An accepted ADR records only the approved scope, not
   implementation authorization, runtime proof or approval of later increments.
5. Backend follows existing authorization to implement only the next permitted
   layer/area. It maintains the selected spec's steps and epic delivery status.
   Spec approval does not authorize all stages, another feature or another spec.
6. At each stage review, Backend records actual results/limits and stops under its
   protocol. It does not progress to another feature without the required user
   direction. Material design findings return to Architect for the same spec's
   revision/approval and, when needed, a superseding ADR.

Approval is tied to the source feature, package revision and named scope. Silence,
time, passing checks or approval of a different artifact are not substitutes. Reuse existing
session authorization; do not ask again for an action already authorized.

## Tracking and evidence ownership

Specs distinguish approval (`Draft`, `Awaiting approval`, `Changes requested`,
`Approved`, `Superseded`) from implementation (`not started`, `in progress`, `blocked`,
`implemented`, `validated`). Record dates in the user's timezone, current step/layer,
affected modules, dependencies, remaining work, checks run and evidence/limits.
Approval cannot mark code implemented, and document validation cannot mark business
acceptance validated.

Architect owns Requirements review/approval fields, Design and the planned Tasks;
Backend owns Tasks execution, test results, evidence and findings, keeping the compact
state summaries consistent across the package. A design revision updates all three
revision headers; evidence-only updates do not reopen design approval. Architect
maintains planning/handoff evidence exclusively in technical documents; it has no
write permission in `product/`.
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
| The approved increment's code/checks have evidence; later feature increments remain. | `validated` for that increment only | `In progress`; the feature remains incomplete. |
| All required feature increments, code and verification have supporting evidence. | `validated` for the whole feature | `Completed`; do not infer stakeholder business validation. |

Update tracking at stage transitions, before review pauses and final responses. Do
not complete the overview while any included feature remains incomplete. Report only
known aggregate state; a single completed feature does not complete the epic.
