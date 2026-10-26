# Blueprint for backend architecture and implementation specs

Use this as a checklist and file outline, adapting names and sections to the topic. It mirrors the
effective pattern in `architecture/00-governanca-de-acesso-e-autorizacao-operacional/` without
turning every topic into the same domain model.

## Recommended ordered files

| File | Purpose and minimum content |
|---|---|
| `00-contexto-e-decisoes.md` | Reader guide, business outcome, scope/non-goals, normative sources, assumptions, decisions, platform constraints and a canonical flow. Map each source to its derived technical obligation. |
| `01-contextos-delimitados-e-agregados.md` | For domain work: bounded contexts/modules, aggregate ownership, relationships, dependency directions and consistency boundaries. For integration/platform work: system boundaries, owner, protocol/API and responsibility direction. |
| `02-contratos-e-integracoes.md` | Shared vocabulary, TypeScript/application contracts, commands/events and producer/consumer responsibilities. Distinguish authentication, authorization, validation and resource rules where relevant. |
| `03-…-entidades.md` onward | One or more focused files per context, aggregate, integration or platform component: source, role, model when applicable, lifecycle, invariants or operational guarantees, feature ownership and external boundaries. |
| penultimate `NN-features-e-ordem-de-implementacao.md` | Phases, features in execution order, dependencies that cannot be inverted, advancement criteria, traceability and status. |
| final `NN-consistencia-persistencia-e-validacao.md` | Data ownership, tenant boundaries, schema/index/uniqueness needs, transactions/outbox/concurrency, sensitive-data rules, validation levels and non-regressions. |

For a small but meaningful decision, retain the same traceability in fewer files. For large work,
split entity files by context and keep every Markdown file below 100 lines.

## Required knowledge map

The spec must explicitly map:

| Concern | Explain or record |
|---|---|
| Sources | Product files, prior decisions, constraints and external authoritative sources; each source's derived obligation. |
| Context | Business problem, expected outcome, in/out of scope, actors, terminology, assumptions and unresolved questions. |
| Domain or technical boundary | For domain work: bounded contexts, aggregates, entities, value objects, lifecycle/state, invariants, domain events and ownership. For integration/platform work: external systems, protocol/API versions, adapter/runtime ownership, lifecycle and operational guarantees. |
| Contracts | Inputs/outputs, commands, queries, events, ports and trusted context. State producer, consumer, compatibility/versioning and forbidden client-controlled data. |
| Persistence | Source of truth, tenant keys, relational/document choice, schema constraints, indexes, retention, history and migration. |
| Consistency | Transaction boundary, locking/versioning, idempotency, ordering, retries, outbox and eventual-consistency consequence. |
| Security | Tenant isolation, permission check placement, non-enumeration, audit evidence, data classification and authorization for every channel. |
| Risks | Failure modes, trade-offs, alternatives considered, mitigation, residual risk and decisions that must be revisited. |
| Delivery | Features, module owner, dependencies, ordered phases, acceptance evidence, implementation status and validation result. |

## Feature ledger and status

Maintain a ledger in the execution-plan file; use an equivalent linked table only when it is clearer.

| Phase | Feature | Owner/module | Source and invariant | Depends on | Verification | Status | Evidence / updated |
|---:|---|---|---|---|---|---|---|
| 0 | `example-feature` | `module` | `Pxx`; invariant stated plainly | prerequisite | domain + integration + E2E case | not started | — |

Status meanings:

- `not started`: design exists but code has not begun.
- `in progress`: work has started; record the current blocker or remaining acceptance condition.
- `blocked`: dependency or decision prevents safe completion; state who or what resolves it.
- `implemented`: code/migration exists and the feature's intended behavior is complete; list its evidence.
- `validated`: implementation evidence has passed at the required level; list commands/tests and any known limitation.

On every implementation task sourced from this spec, update the row. A feature can be implemented
without being validated; a status must not claim more than the recorded evidence proves.

## Quality gate before publishing or changing a spec

- A reader can follow source → rule → owner/model → feature → verification without inference.
- Every entity/model section names its invariant and lifecycle, not just fields.
- The ordering prevents an implementation from bypassing prerequisites or duplicating authority.
- Security, tenancy, versioning, persistence and failures have a decision or an explicit
  inapplicability rationale.
- Proposed code locations follow `backend-modular-feature-architecture`. When a pure domain entity is
  involved, no ORM, Express or IdP types leak into it; integration and platform specs may explicitly
  define those technologies at their adapter/platform boundary.
- Implementation and validation statuses accurately reflect repository evidence.
