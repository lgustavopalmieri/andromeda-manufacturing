---
name: product-requirements-documentation
description: Create and maintain Andromeda Manufacturing product and business requirements in the repository's product workspace. Use when a Product Owner produces or changes requirement artifacts.
---

# Product Requirements Documentation

Store Product Owner artifacts in the repository-root `product/` workspace. Keep the
content product- and business-focused: problem statements, scope, user stories,
requirements, assumptions, priorities, and acceptance criteria. Do not use this
workspace for production code, implementation design, or architecture decisions.

## Requirement directories

- A top-level requirement has one directory named with the next available two-digit
  sequence and a descriptive kebab-case name: `NN-requirement-name`.
- Start with `00` and continue the established sequence. Never rename or renumber an
  existing requirement directory.

## Markdown artifacts

- Within a requirement directory, name artifacts `NN-artifact-name.md`, using an
  ordered numeric prefix and descriptive kebab-case name.
- Order artifacts chronologically or hierarchically, according to how the requirement
  is understood and evolves.
- A Markdown artifact must have at most 100 lines. Split longer content into
  consecutively numbered files while preserving its context and reading order.
