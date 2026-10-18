---
name: backend-modular-feature-architecture
description: Reusable architecture guide for Node.js/TypeScript microservices that follow the modular feature-sliced + clean/hexagonal + DDD model. Use when starting a new microservice from scratch, creating or evolving a module or feature, working on any layer (entity, domain, application, inbound, wire, outbound, platform, shared), and when writing tests. Explains the dependency rule, the role of each layer, the use of interfaces for testability, bootstrapping a new project, and the most common mistakes. Code examples come from a reference project (a device registry, `register` feature), from the entity contract to the HTTP wire — but the pattern is domain- and stack-agnostic.
---

# Modular Feature Architecture (Node.js / TypeScript)

This is the skill's **orchestrator**. It describes a **reusable** architecture for
any Node.js/TypeScript microservice — from scratch to its evolution — and points to
the reference file for each layer. Read this whole page first; then open **only**
the `references/` files for the layers you're going to touch (loaded on demand —
don't read everything at once).

## Reference project (the source of the examples)

To make every concept concrete, the skill uses a **reference project**: a
**device registry** with the **`device`** module and the **`register`** feature —
from the entity contract to the HTTP wire. Every code block marked as a
_"reference example"_ is real code from that project.

> **The pattern is domain - and stack-agnostic.** Wherever you read `device`/`register`,
> think of **your** module/feature. Wherever you read Express, TypeORM, Postgres, or
> Pino, think of **your** stack — the architecture isolates those choices in the edge
> layers (`inbound`, `outbound`, `platform`), so swapping them **does not** affect
> the core.

### A second, richer reference: `account/create-account`

`device/register` is deliberately the **minimal** slice (one aggregate, one
repository, a role-guarded endpoint). Some features are genuinely more complex, and
the **`account` module's `create-account` feature** is the reference for those —
consult it (and the advanced sections it anchors in `references/testing.md` §4,
`references/outbound.md` §3B, and `references/inbound-http.md`) whenever a feature
needs:

- a **multi-step / saga** usecase spanning **two aggregates** (account + owner user)
  inside a **single local transaction**, with **compensation** on failure;
- an **external-system port** (`IdentityProviderInterface` → Keycloak) provisioned
  **before** the local transaction, with best-effort rollback;
- a **transaction manager** outbound (`run(work)`) plus repositories that work both
  standalone and inside a transaction (`DataSource | EntityManager`);
- an **event consumer** (`inbound/events/` listener) reacting to a published event;
- a **public endpoint** (no role required, `allowedRoles = []`);
- **input validation at the edge** (a Zod schema → `400`) and an **upstream-failure
  status** (`502`) distinct from the domain's `422`.

The dependency rule, the layer roles, and every convention are **identical** — this
feature just exercises more of them at once.

---

## 1. When to use this skill

- **Starting a brand-new microservice** (scaffolding + first base layers).
- Creating a **new business module** (e.g., `order`, `payment`, `plant`).
- Creating a **new feature** for a module (e.g., `register`, `find`, `update`).
- Working on **any layer**: entity, domain, application, inbound, wire, outbound,
  platform, or shared.
- Writing or reviewing **tests** (unit, integration, e2e).
- Deciding **where** a piece of code should live (the most common mistake).

---

## 2. Philosophy in one sentence

> **Feature-slicing** (code organized by use case, not by technical type) +
> **Clean/Hexagonal** (dependency rule pointing toward the domain) +
> **DDD-lite** (isolated, explicit business rules).

Practical consequences that hold for every service in this architecture:

1. **Each feature is a vertical slice** with its own layers. Adding a feature means
   creating a new folder, **without rewriting** what already exists (additive).
2. **The domain knows nothing about frameworks.** No web framework, ORM, or logger
   ever appears in `domain/` or in `entity/`.
3. **Dependencies inverted through interfaces.** The outer layers depend on
   **interfaces** declared further inward; the concrete assembly only happens in
   `wire`. That is what makes each layer testable in isolation.
4. **One bounded context per service.** Each microservice answers **one**
   well-defined business question; whatever belongs to another context becomes
   another service.

---

## 3. The dependency rule (memorize this)

The arrows mean "**can import from**". Nothing points back outward.

```
                         entity/            (pure contract, zero deps)
                            ▲
                            │
                         domain/            (rules + errors + rules + types)
                            ▲
                            │
                     application/           (usecase + INTERFACES: usecase/repository)
                       ▲          ▲
                       │          │
              inbound/<proto>/  outbound/<tech>/
              (adapts input)    (implements RepositoryInterface)
                       ▲          ▲
                       └────┬─────┘
                            │
                          wire            (feature's composition root)
                            │
                       platform/ + configs/  (web framework, ORM, logger, env)
```

Rules that come up in code review:

- `entity/` **imports nothing** beyond its own sibling files.
- `domain/` imports **only** from `entity/`. Never from application, inbound,
  outbound, platform, or any framework.
- `application/` imports from `domain/` and `entity/` and **declares the
  interfaces** (`Authorized...UsecaseInterface`, `...RepositoryInterface`).
- `inbound/` and `outbound/` depend on the application's **interfaces**, not on
  each other's concrete classes.
- `wire` is the **only** place that knows the concrete classes + `platform`.
- `platform/` and `configs/` **know nothing** about business modules (except for
  the ORM mapping, which references the `entity` as a shape contract — see
  `references/platform.md`).

---

## 4. Folder anatomy

Replace `<module>`/`<feature>`/`<proto>`/`<tech>` with your service's own names.

```
src/
├── configs/                         # env, database, api-versions (12-factor)
├── main.ts                          # bootstrap: db + http server + routes
├── platform/                        # concrete infra, agnostic of business logic
│   ├── database/<engine>/           # data-source, orm-entity, migrations, errors
│   ├── http/                        # HttpServer + routes + middlewares/auth (authentication at the edge)
│   ├── auth/                        # concrete token verifier (e.g., JWT) — implements the port
│   ├── events/                      # concrete publisher/DLQ (today: a log placeholder)
│   └── observability/               # concrete logger (implements the @shared interface)
└── modules/
    ├── @shared/                     # cross-module contracts and utilities
    │   ├── errors/                  # RepositoryError
    │   ├── http/                    # HttpResponse (base) + mock
    │   ├── auth/                     # identity, AccessControl, AuthorizedUsecase (base) + port, errors + mock
    │   ├── events/                  # EventPublisher/DLQ interfaces + decorator + mocks
    │   ├── observability/           # ObservabilityInterface + composite + mock
    │   ├── pagination/              # Pagination VO + schema + PaginatedResult
    │   ├── query/                   # listing standard: Sort, TextSearch, ListQuery, facets + Zod helpers
    │   └── tests/                   # cross-module TEST infrastructure (test-only)
    │       ├── factories/<module>/  # data factories, grouped by module (make<Thing>)
    │       └── testcontainers/      # shared container setup (e.g., setup-postgres)
    └── <module>/                    # a business MODULE (e.g., device)
        ├── entity/                  # entity contract (pure types) + roles
        └── features/
            └── <feature>/           # a FEATURE (vertical slice, e.g., register)
                ├── domain/          # pure rule, errors, rules, types, events
                ├── application/     # usecase + interfaces + authorization (feature roles)
                ├── inbound/<proto>/ # input adapter (e.g., http) + wire
                └── outbound/<tech>/ # repository (implements the interface)
```

Feature names are **semantic verbs** (the noun comes from the module):
`register`, `find`, `get-one`, `update`, `decommission`. The usecase class makes the
noun explicit: `RegisterDeviceUsecase`.

---

## 5. Reference index (read on demand)

Open the file for the layer/topic you're going to touch. Each one covers: concept,
role, when to use it, a reference example, how to start from scratch, and common
mistakes.

| Layer / topic       | File                                                           | Open it when...                                                                                      |
| ------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Project setup**   | [references/project-setup.md](references/project-setup.md)     | **starting a brand-new microservice** (tsconfig, ESM, vitest, skeleton, base pieces)                 |
| Module entity       | [references/entity.md](references/entity.md)                   | defining/changing a module's data contract                                                           |
| Domain              | [references/domain.md](references/domain.md)                   | writing business rules, validations, and domain errors                                               |
| Application         | [references/application.md](references/application.md)         | orchestrating the use case and declaring the interfaces (ports)                                      |
| Inbound             | [references/inbound-http.md](references/inbound-http.md)       | exposing the feature over a protocol (handler + error→status)                                        |
| Wire                | [references/wire.md](references/wire.md)                       | assembling (injecting dependencies for) the feature on the protocol                                  |
| Outbound            | [references/outbound.md](references/outbound.md)               | persisting/reading data by implementing the application's interface                                  |
| Platform            | [references/platform.md](references/platform.md)               | working on infra: ORM, data-source, migrations, HTTP server, logger                                  |
| Shared              | [references/shared.md](references/shared.md)                   | creating a contract/utility reusable across modules                                                  |
| **Listing queries** | [references/listing-queries.md](references/listing-queries.md) | **building any list feature** — pagination, sort, filters, text search & facets (the query standard) |
| **Auth**            | [references/auth.md](references/auth.md)                       | **authentication/authorization** — protecting a route, per-feature roles, identity crossing layers   |
| Events              | [references/events.md](references/events.md)                   | publishing domain events (**check the pattern first: publish+DLQ vs. outbox**)                       |
| Testing             | [references/testing.md](references/testing.md)                 | writing any test (the per-layer pattern)                                                             |

---

## 6. Workflow A — starting a brand-new microservice

1. **Scaffolding**: create `package.json` (ESM), `tsconfig.json` (nodenext + strict +
   path aliases), and the test configs. → `references/project-setup.md`
2. **Base pieces for `platform/` and `@shared/`**: `HttpResponse`,
   `ObservabilityInterface` + implementation, `RepositoryError`, `data-source`,
   `HttpServer`, `main.ts`. They carry no business logic and serve every feature.
   → `references/project-setup.md`
3. **First module + first feature**: follow Workflow B below.

## 7. Workflow B — starting a feature (from the inside out)

Follow the dependency rule. Each step has its own reference file.

1. **Entity** — only if the feature requires new fields. Adjust the contract in
   `entity/`. → `references/entity.md`
2. **Domain** — create `features/<feat>/domain/` with the pure rule: a static
   class + `errors.ts` + `rules.ts` + `types.ts`. No framework, no I/O.
   → `references/domain.md`
3. **Application** — create `application/authorization.ts` (`<FEAT>_ALLOWED_ROLES`),
   `application/interfaces.ts` (`Authorized...UsecaseInterface` and
   `...RepositoryInterface`), and `application/usecase.ts` (extends `AuthorizedUsecase`).
   → `references/application.md`
4. **Outbound** — implement the `...RepositoryInterface` in `outbound/<tech>/`,
   translating infra errors into domain errors/`RepositoryError`.
   → `references/outbound.md`
5. **Inbound** — create `inbound/<proto>/` with the `handler` (translates
   input/output + observability) and the `response-mapper` (domain error → status).
   → `references/inbound-http.md`
6. **Wire** — create `inbound/<proto>/wire.ts`: the composition root that
   instantiates repository → usecase → observability → handler using `platform`.
   → `references/wire.md`
7. **Route** — register the wire in `platform/http/routes/<module>.routes.ts`.
   → `references/platform.md`
8. **Tests** — at every step, write the test for that layer. Domain/application/
   inbound are unit tests; outbound is integration. → `references/testing.md`

> When creating a new **module**, replicate the reference module's structure
> (`entity/` + `features/`) and add its test factories under
> `@shared/tests/factories/<module>/`. When creating a new **feature**, replicate
> `register/`.

> **Building a listing feature** (`list-...`, and future production orders, KPIs,
> quality metrics, telemetry slices)? Follow the query standard from the start —
> pagination, sort, filters, text search and opt-in facets are already reusable in
> `@shared/query`. → `references/listing-queries.md` (reference feature:
> `machine/list-machines`).

---

## 8. Global conventions (apply to every layer)

- **`moduleResolution: "Bundler"`**: this project uses tsup as build tool, so imports
  do **not** require the `.js` extension. Write `import { X } from "./errors"` (no
  extension), even in `.ts` files.
- **Path aliases** (configured in `tsconfig.json` + the test runner's config):
  `modules/*`, `platform/*`, `configs/*`, `@shared/*`. Convention: **absolute
  alias** when crossing a boundary (toward `platform`, `@shared`, `configs`,
  `entity`, or another feature); **relative** within the same feature.
- **Enums** = `as const` object + derived type. Never a native `enum`:
  ```ts
  export const DEVICE_STATUS = { ACTIVE: "active", INACTIVE: "inactive" } as const;
  export type DeviceStatus = (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];
  ```
- **Contract interfaces** carry the `Interface` suffix
  (`DeviceEntityInterface`, `AuthorizedRegisterDeviceUsecaseInterface`).
- **Self-explanatory code**: prefer clear names over comments. Don't comment the
  obvious; comment only when a piece's _why_ isn't evident from the code itself.
- **TypeScript strict** with `exactOptionalPropertyTypes` and
  `noUncheckedIndexedAccess`: optional fields are **omitted** (not set to
  `undefined`).

---

## 9. Golden rules / common mistakes (overview)

Each reference file details the mistakes for its own layer. The cross-cutting ones:

- ❌ **Leaking the framework into the domain** (importing the web framework/ORM in
  `domain/` or `entity/`). ✅ The domain is pure TypeScript.
- ❌ **Putting a business rule in the handler or the repository.** ✅ The rule
  lives in `domain/`; the handler only adapts the input; the repository only
  persists.
- ❌ **The usecase depending on the repository's concrete class.** ✅ It depends on
  the `...RepositoryInterface`; the concrete implementation is provided in `wire`.
- ❌ **Instantiating dependencies outside the wire** (`new Logger()` inside the
  handler). ✅ Only the `wire` calls `new`.
- ❌ **Leaking a technical error to the client** (stack trace, database driver
  error). ✅ `RepositoryError`/unknown → generic `500`; domain error → `422`;
  conflict → `409`.
- ❌ **Organizing by technical type** (global `controllers/`, `services/`,
  `repositories/`). ✅ Organize by **feature**; the technical concern becomes a
  subfolder of the feature.
- ❌ Adding `.js` extensions to imports. ✅ With `moduleResolution: "Bundler"` + tsup,
  imports have no extension: `import { X } from "./errors"`.

---

## 10. Commands (reference project's convention)

The script names below are the reference project's; adapt them to your own
`package.json`.

```bash
npm run test              # unit tests (excludes integration and e2e)
npm run test:integration  # integration tests (real database, e.g., testcontainers)
npm run test:e2e          # e2e tests (assembled app)
npm run build             # compiles (tsc) + copies any needed non-TS assets
npm run dev               # runs the service in watch mode
npm run migration:run     # applies pending migrations (dev)
```
