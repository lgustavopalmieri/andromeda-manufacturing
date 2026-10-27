# Architecture Decision Record After Spec Approval

An ADR records the chosen technical decisions of an explicitly approved feature spec.
The spec contains proposals and alternatives before approval; do not create the ADR
file or label a decision accepted while that spec is awaiting approval.

After approval, create one corresponding ADR under the topic's `adrs/` directory,
using the next available numeric prefix. Link the exact source feature and approved
spec revision, then link the ADR from the spec and architecture context if one exists.
Recording this ADR is part of the approved workflow and needs no additional permission.
Do not use that action to create another feature's spec or begin unauthorized code.

## Required record

- **Identity and status:** stable ADR ID, title, date and `Accepted` status following
  explicit spec approval. `Accepted` means the decision is approved, not implemented.
- **Traceability:** the one source epic feature, approved spec/revision, relevant
  architecture context and approval evidence. Use actual paths and conversation/issue
  references where available; never invent an approval, stakeholder or link.
- **Context and drivers:** operational problem, governing invariants, actual constraints,
  hot paths/hot spots and the risks that drove the decision.
- **Decision:** concrete choices approved in the spec, affected modules/layers and
  relevant consistency, authorization, persistence or delivery boundaries.
- **Alternatives:** credible options considered, why they were rejected and the tradeoffs
  accepted, including the cost of additional infrastructure when relevant.
- **Consequences:** benefits, technical/operational costs, residual risks, migrations,
  compatibility, observability and any explicit modular-skill deviations approved.
- **Conformance and follow-up:** how the selected spec's steps/checks will verify the
  decision, what remains unimplemented and the assumptions that may trigger revision.
- **Relationships:** prior decisions reused, or a superseded ADR when applicable.

The ADR must faithfully record the approved spec; it cannot introduce an unreviewed
entity contract, messaging pattern, new product scope or additional risk acceptance.
If recording it reveals such a gap, revise the selected spec and return that change
for approval before treating the new decision as accepted.

## Lifecycle

Keep historical decisions and their approval evidence. A substantive design change
first revises the same source feature's spec and obtains approval for its new revision.
Create a superseding ADR for the changed decision, mark the prior record `Superseded`
and link both directions. Do not rewrite history to make an old approval appear to
cover a different choice. Progress-only updates belong in the implementation spec;
an ADR is not a replacement for stage tracking or review checkpoints.
