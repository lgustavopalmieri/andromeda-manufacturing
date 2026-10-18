# Andromeda Manufacturing — Project Context & Agent Routing

## What this project is

Andromeda Manufacturing is a **multi-tenant, white-label SaaS platform for Industry 4.0**. It lets
companies register and configure industrial machines/devices, execute production orders,
collect real-time telemetry (MQTT), and turn that data into actionable KPIs (OEE,
Throughput, Uptime, Quality Rate, etc.).

Its defining differentiators are:

- **Dynamic forms + Rule Engine** for machine setup and HMI behavior
- **Configurable operator interfaces (HMI)**
- **Extremely granular permissions**
- **White-label by design** — per-tenant branding, theming, and configurable behavior,
  with assets built for performance and served via CDN/S3
- **Native readiness for AI agents** to assist or replace human operators in the future

Non-negotiable, platform-wide constraints in every layer:

- **Tenant isolation** by `tenantId`
- **Granular permissions** evaluated in both backend and UI
- **Versionability** of everything configurable (forms, rules, HMI)
- **White-label**: branding, theming, and behavior are per-tenant configuration, never
  hard-coded; no tenant's identity may leak into another
- The **operator interface definition is a contract** serving both humans and future AI agents

## Repository layout (monorepo)

This is a pnpm + Turborepo monorepo. The two applications live under `apps/`:

- **`apps/andromeda-backend`** — API. TypeScript (strict), Express 5, PostgreSQL + MongoDB
  (TypeORM), Keycloak auth, MQTT ingestion, Rule Engine. Tests wiAGENTS.mdth Vitest + supertest,
  build with tsup, dev with tsx.
- **`apps/andromeda-frontend`** — Web SPA. React 19, TypeScript, Vite, TanStack Router,
  TanStack Query, Zustand, React Hook Form + Zod, Keycloak on the client. Tests with
  Vitest + React Testing Library.
- **`product/`** — Product Owner documentation. Each top-level requirement resides in
  a sequential `NN-kebab-case-name/` directory; its Markdown artifacts use ordered
  `NN-kebab-case-name.md` filenames and contain at most 100 lines.

## Which agent is safe to act, by context

Route work to the agent whose scope matches the target of the change. An agent is only
**safe to act within its own app**; do not let it modify the other app.

- **Backend agent** — safe for anything under `apps/andromeda-backend`: API endpoints,
  modules/features, domain/application layers, persistence and schemas, MQTT/telemetry
  ingestion, Keycloak enforcement on the server, the Rule Engine core, and backend tests.
  It is guided by the `backend-modular-feature-architecture` skill.
- **Frontend agent** — safe for anything under `apps/andromeda-frontend`: components,
  routes, screens/HMI, state and data fetching, client-side auth/permission-driven
  rendering, white-label theming on the client, and frontend tests. It is grounded in the
  `frontend-modular-feature-architecture` skill (folder structure) and the
  `frontend-composition-patterns`, `frontend-react-best-practices`, and
  `frontend-web-design-guidelines` skills.
- **Product Owner agent** — for product artifacts (feature briefs, user stories,
  requirements, acceptance criteria). It does **not** write production code; use it to
  scope and clarify before backend/frontend implementation. It is guided by the
  `product-requirements-documentation` skill for artifacts in `product/`.

### Product requirements workspace

Product and business artifacts created by the Product Owner belong under the root
`product/` directory. Each top-level requirement uses the next available two-digit
sequence and a descriptive kebab-case name: `00-requirement-name`,
`01-another-requirement-name`, and so on. Do not renumber existing requirement
directories.

Within a requirement directory, Markdown files follow the same ordered kebab-case
pattern, for example `00-overview.md`, `01-functional-requirements.md`, and
`02-acceptance-criteria.md`. Keep files in chronological or hierarchical order. A
Markdown file must not exceed 100 lines; split longer material into consecutively
numbered files while preserving the narrative or dependency order. The Product Owner
owns these artifacts and keeps them product- and business-focused rather than adding
implementation code or architecture details.

Routing guidance:

- If the task clearly targets one app, delegate to that app's agent only.
- If a task spans both apps (e.g., a new API plus its UI), split it: define the contract
  first, then have the **backend agent** implement the server side and the **frontend
  agent** implement the client side, each within its own scope.
- When requirements are ambiguous or the domain scope is unclear, start with the
  **Product Owner agent** to produce a scoped spec before implementing.
- Neither implementation agent should modify shared root config, the other app, or
  infrastructure without an explicit request.

## Engineering baseline (both apps)

- **Clean code first**: expressive names and readable structure so code explains itself.
  Do not write comments unless the user asks or the code is genuinely high-complexity
  (non-obvious algorithms, tricky invariants, or business rules whose intent can't be
  inferred). When a comment is warranted, explain the _why_, not the _what_.
- **Testability is a design constraint**, not an afterthought.
- Respect **tenant isolation, granular permissions, and versionability** everywhere.
- Follow each app's guiding skill as the authoritative source for structure and patterns.
