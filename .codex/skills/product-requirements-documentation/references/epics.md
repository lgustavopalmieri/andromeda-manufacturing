# Delivery Epics and Features

Use this guide only to create or update `product/epics/`.

## What constitutes an epic

An epic defines **a coherent, bounded delivery package**, composed of features that
together produce a business outcome. Use the analogy of a package planned for a
sprint: make the intended delivery and its boundaries explicit. Do not assign a sprint,
deadline, or team capacity without confirmed information. If the package needs several
sprints, clarify the proposed delivery increments.

An epic is neither a copy of the entire requirement nor an open-ended improvement list.
It is the product plan that will allow frontend and backend agents to produce technical
specs later.

## Define before writing

Before drafting the epic and its features, establish the following from the request
and existing documents:

- The business outcome and the people or processes that benefit.
- The existing requirements supporting the delivery.
- What is included, what is excluded, and which features compose the package.
- The business decisions and dependencies that determine these boundaries.

If missing information would change this scope, ask focused questions and wait for
answers. Do not turn assumptions into a detailed epic. Minor questions may remain
recorded if they do not prevent understanding and delimiting the delivery. A feature
with undefined essential behavior is not ready for technical specs.

Read source requirements without changing them. If no requirement supports the
delivery, explain the gap and ask the user to choose the next stage: address the
requirement in a separate task or narrow the epic to already supported scope.
Do not invent links or write the requirement together with the epic.

## Package overview: `00-epic.md`

Include the objective, problem, expected value, audience, source requirements, scope,
exclusions, dependencies, business risks, and relevant decisions. Present the features
in a table with a link to each file, its contribution to the outcome, and dependencies
or delivery order where needed.

The index may list multiple features, but must not contain their stories, detailed
rules, or acceptance criteria. Those belong in the individual feature files. To assess
the package, explain the integrated outcome its features should produce without
copying each feature's criteria into the index.

## One file per feature

Each file defines **exactly one feature**, with a recognizable purpose and clear
boundaries. It may contain several stories related to that purpose. A story introducing
another independent capability belongs in another feature. Do not split one feature
across files because of length or group small features just to reduce the file count.

Readers must understand the feature without reconstructing it from neighboring
features. Link to shared rules and explain their local effects. Keep identifiers and
links stable during revisions. If there is no established convention, use the epic
and file numbers: `EP-00`, `EP-00-F01`, `EP-00-F01-US01`, `EP-00-F01-BR01`,
and `EP-00-F01-AC01`.

### Required content

1. **Description and purpose:** specific problem, affected people, outcome, boundaries,
   and the feature's contribution to the epic delivery.
2. **Traceability:** relative links to the epic and the actual requirement file,
   preferably to the section supporting the feature. Explain the relationship;
   citing only the `requirements/` folder is insufficient.
3. **Tracking:** a compact status table with an update and evidence or reference.
4. **Rich user stories:** persona, context, need, benefit, starting conditions, main
   journey, and expected outcome. Detail relevant variations and exceptions. The
   “As a…, I want…, so that…” sentence is a summary, not the entire story.
5. **Detailed business rules:** conditions, permitted and prohibited decisions,
   limits, business states and transitions, responsibilities, and consequences.
   Cover applicable permissions, organizations, versions, and operational variations.
6. **Detailed acceptance criteria:** observable behaviors linked to stories and rules.
   Use Given/When/Then when it clarifies the scenario. Include the main path,
   alternatives, refusals, exceptions, and relevant boundaries.
7. **Dependencies, exclusions, and pending decisions:** effects on scope and what
   must be resolved before handing the feature over for technical specs.

Rules state what the business permits and why; criteria demonstrate how to recognize
that behavior in the product. Avoid both vague criteria (“works correctly”) and
technical scenarios (“returns HTTP 403”). Describe who can act, under what conditions,
what they observe, and what outcome is recorded in the operation.

### Feature template

Replace the instructions with specific content and remove template guidance.
Include as many stories, rules, and criteria as the feature needs, without artificial
repetition or an arbitrary minimum count. Write all content and status labels in English.

```markdown
# EP-00-F01 — Feature Name

## Description and Value
Explain the capability, problem, audience, and expected business outcome.

## Product References

- Epic: [Package name](00-epic.md).
- Requirement: [Source section](../../requirements/NN-name/NN-topic.md#section).

Explain how the feature meets the requirement and which part will be delivered.

## Tracking

| Dimension | Status | Updated | Evidence or Reference |
| --- | --- | --- | --- |
| Product definition | Drafting | Actual date | Decisions or questions in this document |
| Delivery | Not reported | — | No execution information |
| Business validation | Not reported | — | No validation recorded |

## Scope and Boundaries
Explain what the feature covers and what belongs to another delivery.

## User Stories

### EP-00-F01-US01 — Person's Goal
As a [persona], I want [capability], so that [concrete benefit].
Explain the context, starting conditions, main journey, outcome, and exceptions.

## Business Rules

### EP-00-F01-BR01 — Rule Name
Describe the condition, decision, consequence, and reason for the rule.

## Acceptance Criteria

### EP-00-F01-AC01 — Expected Behavior
Story: EP-00-F01-US01. Rule: EP-00-F01-BR01.
Given [business context], when [action or event], then [observable outcome].

## Dependencies and Pending Decisions
Record relationships with other features and questions affecting the definition.
```

### Maintaining the status table

- Distinguish product definition, delivery execution, and business validation.
  Documenting a feature does not prove implementation, approval, or validation.
- For definition, use `Drafting`, `Defined`, or `Needs review`. Only mark it `Defined`
  when required content is complete and there are no blocking questions.
- For delivery, use `Not reported` until evidence is available; then, according to the
  actual state, use `Not started`, `In progress`, `Blocked`, or `Completed`.
- For validation, use `Not reported`, `Pending`, `In validation`, or `Validated`,
  according to available evidence. Record the source of each update; do not invent
  owners, dates, approvals, progress, or implementation links.
- Update the table during feature revisions when new information is available and
  preserve relevant references. Do not change the status of features outside the request.

## Handoff review

Check that every feature in the package has its own file and valid requirement links,
and that stories and criteria cover the important rules and exceptions. Resolve
business conflicts between features before presenting the package as defined.
The result must allow implementation agents to understand **what to deliver and why**,
while leaving the choice of **how to implement it** to them.
