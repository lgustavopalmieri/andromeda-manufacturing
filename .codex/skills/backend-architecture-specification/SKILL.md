---
name: backend-architecture-specification
description: Create and maintain traceable, didactic backend architecture and implementation specifications in architecture/, including domain models, implementation sequencing, validation, and delivery status.
---

# Backend Architecture Specification

Use this skill for backend architecture, technical planning, domain-modeling, exploration,
proof-of-concept documentation, or implementation specifications. Do not use it for a small code
change that has no meaningful architectural decision or plan.

The durable output belongs in `architecture/`. It must make the route from a business source to an
implemented and verified feature understandable to a reader who did not participate in the design.
The reference pattern is `architecture/00-governanca-de-acesso-e-autorizacao-operacional/`: reuse
its clarity, traceability and progressive detail, rather than copying its access-control domain.

## Before writing

1. Read the applicable product requirement and existing related architecture. Treat product as
   normative when it conflicts with an architecture spec; record the resulting spec change.
2. Read `backend-modular-feature-architecture` and the layer references that the proposal touches.
   Preserve its module ownership and dependency rule wherever the proposal creates or changes backend
   modules; do not force an integration or platform concern into a domain model.
3. Identify facts, decisions and open assumptions. Do not invent product rules to fill a gap:
   label the gap, its impact, owner and resolution needed.

## Documentation workflow

- Create the next available `NN-topic-name/` only for a new architectural topic; never renumber
  existing topics. Continue an existing topic when refining its decision.
- Use ordered `NN-kebab-case-name.md` files, each at most 100 lines. Start with context and
  decisions, then bounded contexts/contracts, then detailed models, implementation plan and
  validation. Split by responsibility, not merely by length.
- Use plain Portuguese appropriate to the repository. Explain a term on first use; lead from the
  business rule to its technical consequence. Tables, short examples and diagrams are welcome when
  they clarify responsibility or sequence.
- Link every significant technical rule to its source and every feature to its owning module,
  domain rule, verification and implementation state. Relative links must resolve from the file.
- For business-domain work, design from domain to technology: identify context and aggregate ownership
  before interfaces, persistence, adapters or routes. Keep entity contracts pure and place
  cross-context translation in application contracts/ports.
- For integration, platform or tooling work (for example Keycloak, MQTT, OPC-UA, Modbus, a third-party
  API, runtime infrastructure or another language), document the external system/protocol, versions and
  ownership boundaries, trust and failure modes, lifecycle and operational flow. Model a domain entity
  only when it represents a real business concept; otherwise specify the adapter, platform or integration
  boundary directly.
- Address tenant isolation, granular authorization, versionability, historical facts, transactions,
  concurrency, auditability and white-label configuration when they are relevant; state why any is
  not applicable.

Use [the documentation blueprint](references/documentation-blueprint.md) when creating or
substantially expanding a topic. Tailor it to the scope; omit no relevant concern silently.

## Implementation status is part of the spec

When implementing any task that originates from an architecture specification, find the feature in
that specification and update its explicit status before reporting completion. Record the status
(`not started`, `in progress`, `blocked`, `implemented`, or `validated`), date, affected modules or
PR/commit when available, and concise evidence such as tests or migrations run. Update feature
dependencies when the work changes their readiness. Never mark `implemented` or `validated` without
the corresponding code or validation evidence.

If the task exposes an incorrect rule, missing dependency, or changed assumption, update the
relevant spec sections and traceability before—or together with—the status update. Do not rewrite
product requirements; surface the conflict.
