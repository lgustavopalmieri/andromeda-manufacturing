# Andromeda Manufacturing — Project Context & Agent Routing

## What this project is

Andromeda Manufacturing is a **multi-tenant, white-label SaaS platform for Industry 4.0**. It lets
companies register and configure industrial machines/devices, execute production orders,
collect real-time telemetry, and turn that data into actionable KPIs (OEE,
Throughput, Uptime, Quality Rate, etc.).

Its defining differentiators are:

- **Dynamic forms + Rule Engine** for machine setup and HMI behavior
- **Configurable operator interfaces (HMI)**
- **Extremely granular permissions**
- **White-label by design** — per-tenant branding, theming, and configurable behavior
- **Native readiness for AI agents** to assist or replace human operators in the future

Non-negotiable, platform-wide constraints in every layer:

- **Tenant isolation** across data, configuration, and operations
- **Granular permissions** enforced for every protected operation
- **Versionability** of everything configurable (forms, rules, HMI)
- **White-label**: branding, theming, and behavior are per-tenant configuration, never
  hard-coded; no tenant's identity may leak into another
- The **operator interface definition is a contract** serving both humans and future AI agents

## Repository overview

This repository contains the platform implementation and its product documentation:

- **`apps/andromeda-backend`** — platform services, business rules, data management,
  industrial integrations, and telemetry processing.
- **`product/`** — product vision, feature briefs, requirements, user stories, and
  acceptance criteria.
- **`architecture/`** — backend architecture context, feature implementation specs,
  and architecture decision records, created as engineering work is requested.

This file provides project context and agent routing. Technology choices, architecture,
implementation patterns, commands, and detailed workflows belong in the responsible
agents' instructions and their supporting skills.

## Documentation language

All generated documents must be written in **English**, regardless of the language
used in the conversation. This applies to every agent and includes requirements,
epics, feature definitions, technical specs, and other project documentation.

## Which agent is safe to act, by context

Route work to the agent whose scope matches the target of the change. An agent is only
**safe to act within its assigned scope**.

- **Architect agent** — responsible for backend architecture, technical risk analysis,
  entity modeling, SDD specs in `architecture/specs/`, complementary technical test
  scenarios and ADRs in `architecture/adrs/`. Each spec covers exactly one complete
  epic feature file. Reads assigned requirements/epics and implementation evidence;
  `product/` is read-only for Architect. It does not deliver/edit epics, product
  tracking, production code or implementation tests.
- **Backend agent** — responsible for implementation and tests under
  `apps/andromeda-backend`, including business rules, data management, access control,
  industrial integrations, telemetry processing and the Rule Engine. Consumes the
  Architect's approved spec/ADR. May update that spec's execution/test evidence and
  delivery tracking for the selected epic feature and aggregate epic status. Material
  design changes return to Architect; product definitions and business approval stay
  outside Backend's scope.
- **Product Owner agent** — for product artifacts (feature briefs, user stories,
  requirements, acceptance criteria) in `product/`. It does **not** write production
  code; use it to scope and clarify requirements before backend implementation.

Routing guidance:

- If the task targets `apps/andromeda-backend`, delegate to the **backend agent**.
- For backend architecture, implementation specs, and architecture decision records
  in `architecture/`, delegate to the **architect agent**. It creates one spec from
  one epic feature file, stops for approval and records the ADR after approval.
- When implementation lacks an approved spec/ADR or exposes a material design gap,
  route the design work to **Architect** before the affected implementation proceeds.
- When requirements are ambiguous or the domain scope is unclear, start with the
  **Product Owner agent** to produce a scoped product feature definition before
  technical specification or implementation.
- The backend agent should not modify shared root config or infrastructure without
  an explicit request.
- Project-wide documentation and routing changes may be handled directly by the
  coordinating agent. Changes outside an agent's scope require an explicit assignment.
- Each specialist agent must follow its own detailed instructions and applicable skills.

### Delegation transparency

At the start of a task and whenever it is resumed, the coordinating agent must explicitly
tell the user which agent or agents were selected, and the scope of each delegation. If
the task is handled without delegation, state that explicitly. Update the user whenever
the selected agents or their responsibilities change.

Each active agent must also identify itself explicitly and state which skills it will use
for its current stage of work. In every progress update, it must restate the active agent
and applicable skills for the work underway; it must not claim to use irrelevant skills.

## Engineering baseline

- **Clean code first**: expressive names and readable structure so code explains itself.
  Do not write comments unless the user asks or the code is genuinely high-complexity
  (non-obvious algorithms, tricky invariants, or business rules whose intent can't be
  inferred). When a comment is warranted, explain the _why_, not the _what_.
- **Testability is a design constraint**, not an afterthought.
- Respect **tenant isolation, granular permissions, and versionability** everywhere.
- Keep technical details in the responsible agents' instructions and supporting skills.
