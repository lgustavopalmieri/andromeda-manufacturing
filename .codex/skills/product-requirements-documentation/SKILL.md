---
name: product-requirements-documentation
description: Create and maintain Andromeda Manufacturing product and business requirements in the repository's product workspace. Use for feature briefs, user stories, requirements, and acceptance criteria; exclude production-code and architecture work.
---

# Product Requirements Documentation

This skill is the authoritative operating guide for Product Owner work in this
repository. Read it before creating or changing an artifact in `product/`.

Store artifacts in the repository-root `product/` workspace. Keep them product- and
business-focused: problem statements, scope, user stories, requirements, assumptions,
priorities, and acceptance criteria. Do not use this workspace for production code,
implementation design, or architecture decisions.

## Operating approach

- Ground each feature in the product guide and use its established domain vocabulary.
- Start from the operator, machine, and production reality. Account for relevant
  variation by machine model, plant, country, language, units, shifts, and regulation.
- State material assumptions. If unresolved ambiguity would change the scope or product
  decision, ask focused questions before writing a full specification.
- Define observable, measurable behavior. Prefer Given/When/Then acceptance criteria.
- Capture relevant shop-floor exceptions: downtime justification, bad-part recording,
  reconnect behavior, multi-plant variation, and permission boundaries.
- Apply the platform invariants to every applicable feature: tenant isolation, granular
  permissions, versionability of configurable assets, white-label behavior, and an HMI
  definition that is a contract for people and future AI agents.
- Align scope and priority with the product roadmap. Defer implementation and
  architecture decisions to the implementation agents.


## Requirement directories

- A top-level requirement has one directory named with the next available two-digit
  sequence and a descriptive kebab-case name: `NN-requirement-name`.
- Start with `00` and continue the established sequence. Never rename or renumber an
  existing requirement directory.
- Before adding a requirement, inspect the existing directories to determine the next
  sequence and avoid duplicating an established scope.

## Markdown artifacts

- Within a requirement directory, name artifacts `NN-artifact-name.md`, using an
  ordered numeric prefix and descriptive kebab-case name.
- Order artifacts chronologically or hierarchically, according to how the requirement
  is understood and evolves.
- A Markdown artifact must have at most 100 lines. Split longer content into
  consecutively numbered files while preserving its context and reading order.
- When changing an existing requirement, preserve its established numbering and
  narrative order. Add a new artifact when the change is a distinct, later concern.

## Completion check

Before handing off, verify the affected artifact paths, ordered numeric prefixes,
kebab-case names, and the 100-line limit. Confirm the result stays product-focused and
captures the applicable platform invariants, assumptions, scope, and acceptance
criteria.
