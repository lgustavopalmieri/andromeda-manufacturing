# Product Requirements

Use this guide only to create or update `product/requirements/`.

## Purpose

A requirement explains **why the product needs a capability and what it means for
the business**. It may inform several future epics and is not a sprint delivery
commitment.

Describe the operational problem, who is affected, how the situation is handled today,
and its consequences. Connect desired capabilities to expected benefits: productivity,
quality, traceability, autonomy, loss reduction, or another relevant effect. When costs,
risks, or tradeoffs exist, explain them in business terms.

Do not invent numerical targets. If there is no baseline, explain the outcome to
observe and what still needs to be learned to evaluate it. This is a discussion of
impact, not a list of tests for accepting a delivery.

## Content and style

- Describe capabilities and functionality with context, examples, and clear boundaries.
- Explain the most important rules and why they exist. Leave detailed delivery flows,
  exceptions, and validation to future features.
- Explain effects on people, processes, other capabilities, and business decisions,
  including dependencies and what falls outside the requirement.
- Distinguish confirmed needs, proposals, and open questions. Ask before asserting
  a rule whose interpretation would change the requirement's objective.
- Write in English for someone who understands the operation but did not follow the
  conversation. Avoid unexplained abbreviations, terse fragments, and management
  or engineering jargon.
- **Do not include user stories or acceptance criteria in any file in this folder.**
  Do not introduce Given/When/Then scenarios or acceptance checklists under another
  heading. Explanatory examples are welcome when they clarify a need.
- Do not plan sprints, delivery packages, or technical tasks in this folder.

## Suggested structure

Adapt headings to the subject while retaining the content needed to understand the
product. A requirement may have several topic files when this improves readability,
without losing its narrative or copying the same content between them.

```markdown
# Requirement Name

## Context and Problem
Explain the current situation, affected people, and operational consequences.

## Objective and Business Value
Describe what should improve and why the change matters.

## Desired Capability and Functionality
Explain how the product will support the operation, using concrete examples.

## Essential Business Rules
Explain the rules supporting this capability and the reasons behind them.

## Impacts and Relationships with Other Capabilities
Present relevant effects, dependencies, and tradeoffs.

## Boundaries and Open Questions
Distinguish what belongs to the need, what is outside it, and what requires a decision.
```

## Review

Read the document as someone encountering the subject for the first time: can they
understand the problem, picture the desired capability, and explain its value?
Remove content that turns the requirement into delivery planning or feature validation.
The existence of a requirement does not mean its capabilities are already planned,
implemented, or available in the product.
