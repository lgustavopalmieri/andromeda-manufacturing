---
name: product-requirements-documentation
description: Create and maintain Andromeda Manufacturing product requirements or delivery epics in product/. Use for business requirements, epic planning, and individual feature definitions with rich user stories and acceptance criteria. Keep requirements and epics separate; exclude code, architecture, and technical specifications.
---

# Product Requirements Documentation

This is the Product Owner's operating guide for `product/`. The workspace contains
two types of documentation with different purposes and levels of detail:

| Type | Location | Purpose | Content specific to this type |
| --- | --- | --- | --- |
| Product requirement | `product/requirements/` | Explain the problem, desired capability, and business value | Clear product narrative, capabilities, and essential rules |
| Delivery epic | `product/epics/` | Define a bounded delivery package and its features | Rich user stories, detailed rules, and acceptance criteria for each feature |

## Choose a single work type

Before drafting or editing product documents, be certain whether the request concerns
a **requirement** or an **epic**. An explicit path or unambiguous intent resolves this
choice; do not ask for redundant confirmation.

If the user only says “document this functionality,” “plan this,” or something that
could mean either type, ask which outcome they want and wait for their answer.
Do not choose for the user or start a draft while the ambiguity remains.
You may read existing context to formulate the question.

Never produce or edit requirements and epics in the same task. If the request includes
both, ask which to address first and complete only that stage. If a dependency requires
the other type, make it explicit for a later stage; do not silently expand the scope.

After choosing the type, read only its corresponding guide:

- **Requirements:** [references/requirements.md](references/requirements.md).
- **Epics and their features:** [references/epics.md](references/epics.md).

## Workspace organization

```text
product/
  requirements/
    NN-requirement-name/
      00-overview.md
      01-product-topic.md
  epics/
    NN-epic-name/
      00-epic.md
      01-feature-name.md
      02-another-feature.md
```

- Number requirement and epic directories in independent sequences, starting at `00`.
  Inspect existing content before choosing the next number.
- Use numeric prefixes with at least two digits and kebab-case names.
  Preserve existing numbers, names, and links when updating documents.
- In requirements, order files to support understanding of the subject. In epics,
  reserve `00-epic.md` for the delivery overview and a numbered file for each feature.
- **Never combine two features in the same file.** The epic index only introduces
  and links to them; each feature's full definition belongs in its own file.
- Do not split a feature across files to meet a line limit. There is no artificial
  100-line limit: prioritize completeness, cohesion, and readability.
- Do not migrate legacy documents between folders without a reorganization request.
  When content conflicts with the selected type, flag the conflict before making
  a change that would require working on both types.

## Language and scope boundaries

- Write **all generated documents in English**, regardless of the conversation's
  language. This includes headings, examples, templates, tables, and status labels.
  Use English names for new files and directories while preserving existing paths.
- **Always use clear, explanatory language** that humans can read comfortably.
  Explain acronyms on first use.
- Use connected paragraphs, informative headings, and concrete operational examples.
  Lists and tables should support understanding, not replace the business explanation.
- Start with the problem, affected people, and expected outcome. Distinguish facts,
  confirmed decisions, proposals, and questions. Do not invent numbers or commitments.
- Focus on product and business rules. Do not define code, APIs, schemas, libraries,
  architecture, components, or implementation tasks.
- Backend and frontend agents will produce their own technical specs from the defined
  epics and features. The Product Owner provides the business behavior.
- When relevant, consider differences across machines, plants, countries, languages,
  units, and shifts, as well as industrial operational exceptions.
- Preserve organization isolation, granular permissions, versioning of configurable
  assets, white-label behavior, and the operating contract for humans and future AI
  agents. Explain their business effects; do not prescribe technical mechanisms.

## Completion check

- Was the work type clarified, and was only the corresponding folder changed?
- Is every generated document in English, including examples and status labels?
- Is the narrative clear and explanatory, does it explain the problem and value,
  and does it remain at the product level?
- Are paths, numbering, and links consistent, without duplicated scope?
- In requirements, are user stories and acceptance criteria absent, including those
  disguised as validation checklists or Given/When/Then scenarios?
- In epics, is the delivery package defined, and does each feature have its own file,
  a real requirement reference, a description, rich stories, rules, detailed acceptance
  criteria, and an evidence-based tracking table?
- Were material questions resolved before finalizing a delivery's scope?
