---
name: backend-modular-feature-architecture
description: Guide Node.js/TypeScript microservice setup, modules, features, layers and tests with modular feature-slicing, Clean/Hexagonal architecture and DDD. Use for entity, domain, application, inbound, wire, outbound, platform and shared work. Covers dependency rules, interfaces, per-layer testing and common mistakes through stack-agnostic reference examples.
---

# Modular Feature Architecture (Node.js / TypeScript)

Read this orchestrator first, then **only the references relevant to the layers/topics
being changed**. Use it to scaffold services, evolve modules/features, place code and
write or review unit, integration and E2E tests.

For every test stage, read [common testing rules](references/testing.md) **and** the
current implementation guide's testing section. Load auth/events/listing topics only
when applicable. For the E2E stage, also read [E2E](references/e2e.md).

## Reference project (the source of the examples)

Examples use a device registry: module `device`, feature `register`, from entity to
HTTP wire. Blocks marked “reference example” come from that project. The pattern is
**domain- and stack-agnostic**: adapt names and technologies to your service. Express,
TypeORM, Postgres and Pino remain at the edges, leaving the core unchanged.

### A second, richer reference: `account/create-account`

`device/register` is the minimal single-aggregate, single-repository, role-guarded slice.
Use `account/create-account`, [application tests](references/application.md#multi-step-usecase),
[transaction adapters/tests](references/outbound.md#transaction-manager) and
[HTTP variations](references/inbound-http.md) for:

- A multi-step/saga usecase across account + owner aggregates in one local transaction,
  with compensation on failure.
- `IdentityProviderInterface` → Keycloak provisioning **before** the local transaction,
  with best-effort rollback.
- An outbound transaction manager (`run(work)`) and repositories usable standalone or
  transactionally (`DataSource | EntityManager`).
- Event consumers (`inbound/events/`), public endpoints (`allowedRoles = []`), edge Zod
  validation (`400`) and upstream failures (`502`, distinct from domain `422`).

The same dependency rules, layer roles and conventions apply.

## 1. When to use this skill

Use for new services, business modules and features; any layer or code-placement
question; and unit, integration or E2E tests. Load the applicable guide from §5.

For architecture, ADRs and epic-derived implementation specs, also read
[backend-architecture-specification](../backend-architecture-specification/SKILL.md).
That skill governs one source feature per spec and its approval/decision lifecycle;
this skill governs the entity code, dependency rules, implementation steps and tests
planned in that spec. Planning must consult the relevant layer/topic references,
including entity and events when applicable, rather than defer them until coding.
Architect owns that design and its complementary technical test scenarios; Backend
implements/verifies the approved plan and returns material design gaps to Architect.

## 2. Philosophy in one sentence

**Feature-slicing** by use case + **Clean/Hexagonal** inward dependencies + **DDD-lite**
explicit, isolated business rules:

- Add features as vertical slices in new folders, without rewriting existing ones.
- Keep `domain/` and `entity/` free of frameworks, ORM and logging.
- Outer layers depend on inward interfaces; concrete assembly belongs only in `wire`.
- One bounded context and business question per service; other contexts belong in
  separate services.

## 3. The dependency rule (memorize this)

Arrows mean “can import from”; dependencies never point outward.

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

- `entity/`: only sibling files.
- `domain/`: own siblings and `entity/`; never application, adapters, platform or frameworks.
- `application/`: domain/entity; declares `Authorized...UsecaseInterface` and repository ports.
- `inbound/` and `outbound/`: application interfaces, never each other's concrete classes.
- `wire`: the only feature location combining concrete classes and platform dependencies.
- `platform/` and `configs/`: no business modules, except ORM mappings using the entity
  as a shape contract (`references/platform.md`).

## 4. Folder anatomy

Adapt `<module>`, `<feature>`, `<proto>` and `<tech>` to your service.

```
src/
├── configs/                         # database/, runtimeconfig/, other named concerns
├── main.ts                          # bootstrap: db + http server + routes
├── platform/                        # concrete infra, agnostic of business logic
│   ├── database/<engine>/           # data-source, orm-entity, migrations, errors
│   ├── http/                        # HttpServer + routes + middlewares/auth (authentication at the edge)
│   ├── auth/                        # provider-neutral authentication ports and errors
│   ├── <technology>/                # technology-specific adapters (e.g., keycloak/, redis/)
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

Feature names are semantic verbs (`register`, `find`, `get-one`, `update`, `decommission`);
the module supplies the noun. Usecase classes include it: `RegisterDeviceUsecase`.

## 5. Reference index (read on demand)

Each guide covers responsibility, examples, setup and common mistakes.

| Layer/topic | Reference | Read when |
| --- | --- | --- |
| Project setup | [references/project-setup.md](references/project-setup.md) | Scaffolding a service and base infrastructure |
| Entity | [references/entity.md](references/entity.md) | Changing the module's data contract |
| Domain | [references/domain.md](references/domain.md) | Rules, validation and domain errors |
| Application | [references/application.md](references/application.md) | Usecase orchestration and ports |
| Inbound | [references/inbound-http.md](references/inbound-http.md) | Protocol handlers and response mapping |
| Wire | [references/wire.md](references/wire.md) | Feature dependency assembly |
| Outbound | [references/outbound.md](references/outbound.md) | Implementing persistence ports |
| Platform | [references/platform.md](references/platform.md) | ORM, data-source, migrations, HTTP server and logger |
| Shared | [references/shared.md](references/shared.md) | Cross-module contracts/utilities |
| Listing queries | [references/listing-queries.md](references/listing-queries.md) | Any listing: pagination, sorting, filtering, search and facets |
| Auth | [references/auth.md](references/auth.md) | Authentication, per-feature authorization and identity |
| Events | [references/events.md](references/events.md) | Publishing/consuming events; choose publish+DLQ versus outbox first |
| Testing | [references/testing.md](references/testing.md) | Any test; mandatory common rules and links to co-located recipes |
| E2E | [references/e2e.md](references/e2e.md) | Real assembled flow, Testcontainers, lifecycle and review |

## 6. Workflow A — starting a brand-new microservice

1. Scaffold ESM `package.json`, strict `tsconfig.json` (reference: nodenext + aliases)
   and test configs using `references/project-setup.md`.
2. Build business-agnostic platform/shared foundations: `HttpResponse`,
   `ObservabilityInterface` + implementation, `RepositoryError`, data-source,
   `HttpServer` and `main.ts` using the same guide.
3. Create the first module/feature with Workflow B.

## 7. Workflow B — starting a feature (from the inside out)

Follow the dependency rule and each layer's reference:

1. **Entity**: adjust `entity/` only when new fields are required.
2. **Domain**: static pure rule class, `errors.ts`, `rules.ts`, `types.ts`; no I/O/framework.
3. **Application**: `authorization.ts` (`<FEAT>_ALLOWED_ROLES`), `interfaces.ts`
   (authorized usecase + repository ports), `usecase.ts` extending `AuthorizedUsecase`.
4. **Outbound**: implement the repository port under `outbound/<tech>/`; translate
   infrastructure errors into domain errors/`RepositoryError`.
5. **Inbound**: `inbound/<proto>/` handler adapts input/output and observability;
   response-mapper translates domain errors to statuses.
6. **Wire**: `inbound/<proto>/wire.ts` assembles repository → usecase → observability →
   handler using platform infrastructure.
7. **Route**: register the wire in `platform/http/routes/<module>.routes.ts`.
8. **Tests at every step**: use common rules plus the current layer's testing section.
   Domain/application/inbound use unit tests; persistence uses integration. Other adapters
   follow their own recipes. E2E is a separate real-app/Testcontainers stage. Follow the
   backend agent's review gate before advancing layers or beginning E2E.

For new modules, replicate `entity/` + `features/` and add factories under
`@shared/tests/factories/<module>/`. For features, use `register/` as the structural
reference. For listings, follow `references/listing-queries.md` from the start:
`@shared/query` already supplies pagination, sort, filters, text search and opt-in facets
(reference: `machine/list-machines`, also applicable to orders, KPIs, quality and telemetry).

## 8. Global conventions (apply to every layer)

- **Imports**: this repository uses tsup and `moduleResolution: "Bundler"`; omit `.js`
  extensions, including in TypeScript (`import { X } from "./errors"`).
- Configure `modules/*`, `platform/*`, `configs/*`, `@shared/*` aliases in TypeScript
  and tests. Use absolute aliases across boundaries (including entity/other features),
  relative paths within a feature.
- **Configuration organization**: group configuration by named concern under `configs/`.
  Separate schemas, interfaces, errors and loaders into their own files; name the loader
  after its operation, such as `runtimeconfig/load-runtime-config.ts`, rather than `env.ts`.
  Load runtime configuration from `main.ts` and pass validated settings to infrastructure.
  See [configuration organization](references/project-setup.md#configuration-organization)
  for the file layout and responsibilities.
- **Enums**: `as const` object + derived type; never native `enum`:
  ```ts
  export const DEVICE_STATUS = { ACTIVE: "active", INACTIVE: "inactive" } as const;
  export type DeviceStatus = (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];
  ```
- Contract names end in `Interface` (`DeviceEntityInterface`,
  `AuthorizedRegisterDeviceUsecaseInterface`).
- Prefer clear names; comment only non-obvious intent, explaining why.
- Enable `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` with strict mode;
  **omit** optional fields instead of setting `undefined`.
- **Technology ownership**: provider-neutral ports/errors belong in capability folders
  (`platform/auth/`). Named-technology adapters belong in `platform/<technology>/`,
  configured by `configs/<technology>.ts`. Keycloak realm/JWKS-path/admin behavior stays
  in `platform/keycloak/` + `configs/keycloak.ts`, even when implemented with `jose`.
  A verifier without Keycloak-specific endpoints, claims, config or behavior remains
  generically named (`OidcJwtTokenVerifier`) in `platform/auth/`.
- **Tests**: [testing.md](references/testing.md) is the mandatory common-rule source
  for every runtime suite. Read it together with the current implementation guide's
  testing section; pure entity contracts use compiler validation. E2E additionally
  follows [e2e.md](references/e2e.md) with real Testcontainers infrastructure.

## 9. Golden rules / common mistakes (overview)

- No framework/ORM in entity/domain; no business rules in handlers/repositories.
- Inject application interfaces, never concrete repositories; only `wire` assembles
  concrete dependencies (`new Logger()` does not belong in a handler).
- Never expose technical errors, driver details or stack traces: unknown/`RepositoryError`
  → generic `500`, domain family → `422`, conflicts → `409`.
- Organize by feature, not global `controllers/`, `services/` or `repositories/`.
- Apply the import convention in §8; do not add `.js` extensions.

## 10. Commands (reference project's convention)

Adapt these script names to the target `package.json`.

```bash
npm run test              # unit tests (excludes integration and e2e)
npm run test:integration  # integration tests (real database, e.g., testcontainers)
npm run test:e2e          # e2e tests (assembled app)
npm run build             # compiles (tsc) + copies any needed non-TS assets
npm run dev               # runs the service in watch mode
npm run migration:run     # applies pending migrations (dev)
```
