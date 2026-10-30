# SPEC-EP-00-F01 — Tasks

**Package revision 6 · 2026-10-30, America/Sao_Paulo · M0 Approved · implementation in progress: M0-01–12 technically validated and accepted; M0-13 not started · F01 incomplete.**

[Requirements and state](EP-00-F01-govern-scoped-access.requirements.md) → [Design](EP-00-F01-govern-scoped-access.design.md) → Tasks (this document).

## Approved M0 handoff

The user approved revision 6's M0 design on 2026-10-30, America/Sao_Paulo. [ADR-0001](../adrs/0001-m0-graph-authoritative-authorization-foundation.md) is Accepted. The approval session did not authorize implementation; the user subsequently explicitly started it in a new context. Under the [Backend handoff](EP-00-F01-govern-scoped-access.requirements.md#backend-handoff--approved-revision-6-m0), M0-01–04 are implemented, technically validated and accepted. The user separately authorized M0-05, whose implementation was then corrected at the user's review request: shared owns payload/category conventions and Pino only emits. The subsequent file-organization correction preserves that responsibility boundary and all behavior. The user explicitly accepted the final M0-05 delivery, including both corrections, on 2026-10-30, America/Sao_Paulo. The user then explicitly started M0-06: HTTP lifecycle implementation and technical verification are complete, with user HTTP review accepted on 2026-10-30, America/Sao_Paulo. The user subsequently explicitly authorized M0-07. Its PostgreSQL test setup and eight real integration cases are technically validated, with SQL test infrastructure review accepted on 2026-10-30, America/Sao_Paulo. The same approval authorized continuation to M0-08 under the preceding review question. Its connection lifecycle and focused checks are technically validated, with database connection review accepted on 2026-10-30, America/Sao_Paulo. The user subsequently accepted M0-08 and explicitly authorized M0-09. Its migration runner, SQL asset packaging and six integration/build cases are technically validated; user migration support review was accepted on 2026-10-30, America/Sao_Paulo. The user subsequently explicitly authorized M0-10. Its startup/shutdown support is technically validated with user bootstrap support review accepted on 2026-10-30, America/Sao_Paulo. The user subsequently explicitly authorized M0-11; its pure tenant contract is technically validated and user tenant entity review was accepted on 2026-10-30, America/Sao_Paulo. That acceptance authorized continuation to M0-12. Its complete actor contract is technically validated with user identity entity and ESLint correction review accepted on 2026-10-30, America/Sao_Paulo; M0-13 and later tasks have not started.

## Start here

The first deliverable is **M0: one OpenFGA-authorized validation call with a PostgreSQL business read only after allow**. There is no production quantity write and no administrative grant/revoke API yet.

| M0 stage | Tasks | Result to review |
| --- | --- | --- |
| Service support | M0-01–M0-10 | Configuration, safe logging, HTTP/database lifecycle and SQL test harness. |
| Retained records | M0-11–M0-22 | Five pure contracts, mappings, schema and deterministic two-tenant seed. |
| Ports, business reader and provider | M0-23–M0-31 | Neutral authorization, a separate post-allow business reader and actual model/store/tuple Check integration. |
| Application protection | M0-32–M0-36 | Safe decision log, inherited gate and the protected business read/outcome. |
| Controlled HTTP assembly | M0-37–M0-41 | Thin adapters, fixed fixture identity and real route composition. |
| Demonstration | M0-42–M0-44 | Assembled correctness/failure evidence and M0 result report. |

These rows are navigation groups. **Each checkbox below is a separate task and reviewable result.**

## Execution and review rules

- All source/test paths below are relative to `apps/andromeda-backend/src/`; commands run from that app. Paths are intended outputs, not existing code.
- Every unchecked M0 task has **Status: not started; execution evidence: none; limitations: dependent capabilities remain pending**. Its `Review` field is its next checkpoint. Backend replaces these defaults with actual evidence as work proceeds.
- The numbered order is the suggested execution order; explicit dependency IDs determine readiness. Finish and review each changed layer/support area before proceeding under Backend's stage protocol. A passed unit suite does not bypass integration or E2E review.
- Use the current repository's extensionless imports, strict TypeScript and existing unit/integration/E2E scripts. Compiler-only contracts need no artificial runtime tests. No interface gets a fabricated business rule just to create a domain class.
- Test runs must execute the named cases. `--passWithNoTests` is present in existing integration/E2E scripts; an empty successful run is **not** completion evidence.
- Do not implement old SQL/status or lifecycle contracts from the superseded historical appendix. A reviewed future design is an entry requirement for that work.

### Required guides by area

| Area / review checkpoint | Applicable modular guide |
| --- | --- |
| Setup/configuration/lifecycle | [Setup](../../.codex/skills/backend-modular-feature-architecture/references/project-setup.md), [platform](../../.codex/skills/backend-modular-feature-architecture/references/platform.md) |
| Shared contracts / logging / gate | [Shared](../../.codex/skills/backend-modular-feature-architecture/references/shared.md), [authorization](../../.codex/skills/backend-modular-feature-architecture/references/auth.md) |
| Module entity | [Entity](../../.codex/skills/backend-modular-feature-architecture/references/entity.md) |
| Application and ports | [Application](../../.codex/skills/backend-modular-feature-architecture/references/application.md) |
| Persistence / provider adapters | [Outbound](../../.codex/skills/backend-modular-feature-architecture/references/outbound.md), platform and authorization as applicable |
| HTTP / composition | [Inbound](../../.codex/skills/backend-modular-feature-architecture/references/inbound-http.md), [wire](../../.codex/skills/backend-modular-feature-architecture/references/wire.md) |
| Every runtime verification | [Testing](../../.codex/skills/backend-modular-feature-architecture/references/testing.md) plus the current area's testing section |
| Assembled demonstration | [E2E](../../.codex/skills/backend-modular-feature-architecture/references/e2e.md), adapted only for the epic's authentication exclusion |

## M0 execution checklist

Task trace fields refer to [M0 requirements](EP-00-F01-govern-scoped-access.requirements.md#m0-requirements-and-completion-evidence), [design risks](EP-00-F01-govern-scoped-access.design.md#m0-risks-and-failure-behavior), and the case catalog below. An ID names one case family; the catalog specifies its separate stimuli and expectations.

- [x] **M0-01 — Validate runtime configuration**
  - **Area / paths:** `configs/database/{schema,interface}.ts; configs/runtimeconfig/{schema,error,interface,load-runtime-config,load-runtime-config.test}.ts; configuration-only main.ts` (organization revision explicitly requested by the user on 2026-10-30). **Depends on:** none.
  - **Deliver:** Read only required HTTP/database/validation settings; reject incomplete or invalid values without exposing secrets. OpenFGA configuration is added in M0-26a.
  - **Verify:** TC-M0-01. **Trace:** M0-R01/R05; R01. **Review:** configuration.
  - **Execution — 2026-10-30:** validated for this configuration stage; user review accepted on 2026-10-30, America/Sao_Paulo. Configuration now lives in the separate folders/files above, preserving the original declarations and loader body after the user's organization revision. `main.ts` only calls `loadRuntimeConfig()`. HTTP and database ports are required decimal integers in 1–65535; database host/user/password/name are required and nonblank. Flags accept only literal `true`/`false`; validation defaults false, migrations true, SSL/logging false, and HTTP binds to `127.0.0.1`. Configuration errors contain field paths without input values or causes; intentional password whitespace is preserved. No Keycloak/AWS/provider settings are required. `npm run test -- src/configs/runtimeconfig/load-runtime-config.test.ts`: 1 suite, 33 passing tests; `npm run typecheck` and `npm run build`: exit 0; built-entrypoint smoke passed for valid and invalid configuration. TC-M0-01 provider binding/timeout coverage remains M0-26a. At that checkpoint, no subsequent task had started.

- [x] **M0-02 — Define the shared HTTP response contract**
  - **Area / paths:** `modules/@shared/http/http-response.ts`. **Depends on:** none.
  - **Deliver:** Define the common success/error envelope used by later HTTP mappers.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R06; R06. **Review:** shared HTTP.
  - **Execution — 2026-10-30:** validated for this pure-contract stage; user review accepted by the later instruction to continue to task 3. Added `modules/@shared/http/http-response.ts`: `HttpSuccessResponseInterface<Data>` is `{ error: false; data: Data }`, `HttpErrorResponseInterface` is `{ error: true; message: string }`, and `HttpResponseInterface<Data>` is their discriminated union. No imports, framework dependency, runtime behavior or mapper was added. `npm run typecheck`: exit 0. Temporary strict compiler checks accepted valid envelopes/null payloads and narrowing, while 10 invalid cases were rejected; removing all suppression directives produced exactly 10 diagnostics. Fixtures were removed. At this task's original checkpoint, TC-M0-02 remained pending for all other owning tasks and M0-03 had not started.

- [x] **M0-03 — Define the shared repository failure category**
  - **Area / paths:** `modules/@shared/errors/repository.error.ts`. **Depends on:** none.
  - **Deliver:** Provide generic RepositoryError plus a recognized RepositoryUnavailableError category for known connection/outage failures; keep technical causes internal. Unknown repository failures remain generic500.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R01/R06; R04/R06. **Review:** shared errors.
  - **Execution — 2026-10-30:** validated for this shared-errors stage; user review accepted on 2026-10-30, America/Sao_Paulo. Added `modules/@shared/errors/repository.error.ts`: `RepositoryError extends Error` accepts `(message: string, options?: ErrorOptions)`; `RepositoryUnavailableError extends RepositoryError` inherits that constructor and supplies its distinct name. Causes remain native internal diagnostics; no driver classification or HTTP status mapping was added. `npm run typecheck`: exit 0. A temporary runtime check confirmed distinct categories, unavailable-error inheritance and original cause identity without copying technical details into the supplied message or enumerable fields. No persistent test suite or later task was added.

- [x] **M0-04 — Define the observability port**
  - **Area / paths:** `modules/@shared/observability/observability.ts and observability.mock.ts`. **Depends on:** none.
  - **Deliver:** Define structured event/capture operations and the test double; no concrete logger dependency.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R07; R06. **Review:** shared observability.
  - **Execution — 2026-10-30:** validated for this contract/mock stage; user review accepted on 2026-10-30, America/Sao_Paulo. Added `modules/@shared/observability/observability.ts` with `ObservabilityContextInterface` readonly unknown-valued entries and `ObservabilityInterface.event(name, context?)` / `.capture(error, context?)`, both synchronous void operations. Added test-only `observability.mock.ts` exporting `makeObservabilityMock(): Mocked<ObservabilityInterface>` with fresh independent typed `vi.fn` methods. `npm run typecheck`: exit 0. Temporary compiler checks confirmed contract/mock compatibility and eight rejected misuse cases; removing suppression directives produced exactly eight diagnostics. Temporary files were removed. No logger, runtime logging, sanitization or later task was added.

- [x] **M0-05 — Implement the structured logger adapter**
  - **Area / paths:** `platform/observability/logger.ts; logger.test.ts`; review-authorized support under `modules/@shared/observability/{observability-payload.interface,log-context-fields,select-log-context-fields,create-event-log-payload,create-error-log-payload,observability-error-mapper}.ts` and co-located behavior tests. **Depends on:** M0-01, M0-04.
  - **Deliver:** Implement the observability port with Pino and safe error categories/redaction.
  - **Verify:** TC-M0-03. **Trace:** M0-R07; R06. **Review:** logger adapter.
  - **Execution — 2026-10-30:** reorganized and technically validated after the user requested files separated by responsibility; final user review accepted on 2026-10-30, America/Sao_Paulo, including the responsibility and organization corrections. Interfaces, field list, context selection and event/error builders now live in the named files above, with unchanged declarations/function bodies apart from imports/required exports. The old payload monolith was removed without a barrel or compatibility façade. M0-04 port/mock, error mapper/categories, format rules, safe output and Pino emission behavior are unchanged. Tests were relocated by SUT without duplicating cases: selection 22, event builder 5, error builder 1, mapper 7, Pino integration 9; full unit run 77 passed across six files and strict typecheck exit 0. No M0-06 work started.

- [x] **M0-06 — Implement the HTTP server lifecycle**
  - **Area / paths:** `platform/http/server.ts; server.test.ts`. **Depends on:** M0-01, M0-02, M0-05.
  - **Deliver:** Start/close an injected route set on the configured loopback address; expose /health without business data.
  - **Verify:** TC-M0-04. **Trace:** M0-R01; R01. **Review:** HTTP platform.
  - **Execution — 2026-10-30:** implemented and technically validated for the HTTP platform stage; user review accepted on 2026-10-30, America/Sao_Paulo. Added `HttpServer({host, port, routes})` with injected prefixed Express routers, JSON parsing, minimal shared-envelope `GET /health`, and asynchronous `start()` / `stop()`. The listener binds to the supplied validated loopback address. Concurrent/repeated lifecycle calls share pending work; shutdown drains active requests, releases the port, and permits restart. Asynchronous bind failure and synchronous invalid-listen arguments reject startup and remove temporary listeners. `npm run test`: 7 suites, 89 passing tests, including 12 real HTTP lifecycle cases; `npm run typecheck` and `npm run build`: exit 0. Socket tests required approved sandbox escalation after loopback bind returned `EPERM`. TC-M0-04 bootstrap/resource-acquisition cleanup remains M0-10; no database lifecycle, protected route, bootstrap or M0-07 work was added. See detailed evidence below.

- [x] **M0-07 — Provide disposable PostgreSQL test setup**
  - **Area / paths:** `modules/@shared/tests/testcontainers/setup-postgres.ts`. **Depends on:** none.
  - **Deliver:** Start generic disposable PostgreSQL, expose connection settings and deterministic teardown; do not import datasource, migrations or business modules.
  - **Verify:** TC-M0-24. **Trace:** M0-R08; R01/R02. **Review:** SQL test infrastructure.
  - **Execution — 2026-10-30:** explicitly authorized by the user after M0-06 acceptance; implemented and technically validated, with SQL test infrastructure review accepted on 2026-10-30, America/Sao_Paulo. Added `setup-postgres.ts` and co-located `setup-postgres.integration.test.ts`. `setupPostgres()` starts a generic `postgres:16-alpine` test container, returns its connection settings/container/async teardown, and accepts a configured PostgreSQL builder. Teardown explicitly removes the container and volumes; post-start setup failure cleans acquired resources and preserves cleanup failures. `npm run test:integration -- src/modules/@shared/tests/testcontainers/setup-postgres.integration.test.ts`: 1 suite, 8 passing cases with real PostgreSQL, including readiness failure and cleanup/recovery. `npm run typecheck` and `npm run build`: exit 0. Read-only Docker inspection found no containers left by this run; pre-existing unrelated containers were preserved. No datasource, migration, business module or runtime import was added. M0-08 has not started. See detailed evidence below.

- [x] **M0-08 — Implement the PostgreSQL connection lifecycle**
  - **Area / paths:** `platform/database/postgres/data-source.ts; data-source.integration.test.ts`. **Depends on:** M0-01, M0-03, M0-05, M0-07.
  - **Deliver:** Initialize/close a configured datasource with synchronize:false; translate connection failures.
  - **Verify:** TC-M0-05. **Trace:** M0-R01; R01/R02. **Review:** database connection.
  - **Execution — 2026-10-30:** authorized by the user's M0-07 approval in response to the explicit question about continuing to M0-08. Implemented and technically validated; database connection review accepted on 2026-10-30, America/Sao_Paulo. Added `data-source.ts` and its co-located integration suite. `createDataSource(connection)` is inert until initialization, preserves validated settings and fixes `synchronize:false`, `dropSchema:false`, `migrationsRun:false`. `initializeDatabase` / `closeDatabase` open/close the pool, tolerate sequential repeated calls, preserve causes internally and return safe repository errors. Only explicit recognized transport/connection/outage codes become `RepositoryUnavailableError`; invalid credentials/database, metadata and unknown failures remain generic `RepositoryError`. Focused integration: 1 suite, 38 passed (10 lifecycle/configuration cases using real PostgreSQL plus 28 injected classification variations). Strict typecheck/build passed; Docker inspection found no test-owned containers remaining. TC-M0-05 migration/asset evidence remains M0-09; no migration, runtime bootstrap or M0-09 work was added. See detailed evidence below.

- [x] **M0-09 — Implement the migration runner**
  - **Area / paths:** `platform/database/postgres/migrate.ts; migrate.integration.test.ts`. **Depends on:** M0-08.
  - **Deliver:** Apply ordered SQL migrations and report failures; package migration assets for the existing tsup build.
  - **Verify:** TC-M0-05. **Trace:** M0-R01/R02; R01/R02. **Review:** migration support.
  - **Execution — 2026-10-30:** explicitly authorized by the user after M0-08 acceptance; implemented and technically validated; migration support review accepted on 2026-10-30, America/Sao_Paulo. Added `migrate.ts`, `read-migration-sql.ts` and co-located `migrate.integration.test.ts`; updated app-local `tsup.config.ts` to emit migration wrappers separately and copy SQL beside them, with clean independent bundles. The runner applies pending migrations in one TypeORM all-migrations transaction and preserves internal causes in safe `RepositoryError` failures. Native raw migration-log output is suppressed through a temporary derived datasource logger, restored in `finally`. Focused integration: 1 suite, 6 passed, covering ordering, rerun, rollback/retry, missing assets, uninitialized datasource and actual Node execution of main/standalone build artifacts plus stale-output cleanup. Strict typecheck/build and Docker cleanup checks passed. No production migration, business schema or M0-10 bootstrap was added. See detailed evidence below.

- [x] **M0-10 — Assemble service startup and shutdown**
  - **Area / paths:** `main.ts; platform/bootstrap.ts and bootstrap.test.ts`. **Depends on:** M0-05, M0-06, M0-09.
  - **Deliver:** Initialize database/migrations before listening, stop cleanly and close acquired resources on startup failure. Routes are injected; M0-41 later adds the protected route.
  - **Verify:** TC-M0-04/05. **Trace:** M0-R01; R01. **Review:** bootstrap support.
  - **Execution — 2026-10-30:** explicitly authorized by the user after M0-09 acceptance; implemented and technically validated, user bootstrap support review accepted on 2026-10-30, America/Sao_Paulo. Added `platform/bootstrap.ts`, its unit/integration suites and `main.integration.test.ts`; `main.ts` composes existing adapters, empty injected routes, runtime migration flag and safe Pino output. At user review, signal handling was extracted to `platform/graceful-shutdown/{interfaces,register-graceful-shutdown}.ts` with co-located unit tests; main supplies generic shutdown/error callbacks. Twenty M0-10 unit cases cover sequencing, pending startup/migrations, aggregate cleanup errors, concurrent/retryable stop, signal deduplication and listener disposal. Ten real PostgreSQL/HTTP/native Node cases verify database sessions, migrations/rollback, active-request drain, bind failure, both signals, migration-disabled boot and safe failed startup output. Revised full unit suite: 9 files, 109 passed; affected native-entrypoint suite: 6 passed; strict typecheck/build passed. No protected route, business schema or M0-11 work was added. See detailed evidence below.

- [x] **M0-11 — Define the tenant contract**
  - **Area / paths:** `modules/tenant/entity/tenant.entity.ts`. **Depends on:** none.
  - **Deliver:** Copy the complete M0 tenant contract from Design; identity is stable and display code is not authority.
  - **Verify:** TC-M0-06 compiler. **Trace:** M0-R02; R02. **Review:** tenant entity.
  - **Execution — 2026-10-30:** explicitly authorized after M0-10 acceptance; implemented and technically validated with user tenant entity review accepted on 2026-10-30, America/Sao_Paulo. Added only `src/modules/tenant/entity/tenant.entity.ts`, copying the complete current M0 Design block exactly, including its stable-ID/display-code notes. `TenantEntityInterface` has required string `id` and `code`, with no imports, methods, framework or persistence dependencies. Exact source comparison passed and app-local `npm run typecheck` exited 0 for the tenant portion of TC-M0-06. No runtime suite, build or factory was needed for this pure contract. M0-12 continuation is recorded below. See detailed evidence below.

- [x] **M0-12 — Define the actor contract**
  - **Area / paths:** `modules/identity/entity/actor.entity.ts`. **Depends on:** none.
  - **Deliver:** Copy the complete actor contract including lifecycle/kind and optional owner; implement no identity-provider lifecycle.
  - **Verify:** TC-M0-06 compiler. **Trace:** M0-R02/R05; R03. **Review:** identity entity.
  - **Execution — 2026-10-30:** authorized by the user's M0-11 acceptance and continuation instruction; implemented and technically validated, user identity entity and ESLint correction review accepted on 2026-10-30, America/Sao_Paulo. Added only `src/modules/identity/entity/actor.entity.ts`, preserving the complete current M0 Design contract: `ACTOR_KIND`/`ActorKind`, `ACTOR_STATUS`/`ActorStatus`, required `id`/`name`/`kind`/`status`, optional `ownerActorId` and the approved notes. No imports, methods, domain validation or identity-provider lifecycle were added. Initial exact source comparison passed; after the user's ESLint formatting correction, the contract shape/values remain unchanged with multiline catalogs. Backend/root lint and root fix idempotence, six targeted lint fixtures, AST preservation checks and app-local `npm run typecheck` passed. TC-M0-06 actor scope is technically validated; user identity entity and ESLint correction review was accepted on 2026-10-30, America/Sao_Paulo. No runtime suite or build was needed for this declarative contract. M0-13 and later tasks have not started. See detailed evidence below.

- [ ] **M0-13 — Define the membership contract**
  - **Area / paths:** `modules/tenant/entity/tenant-membership.entity.ts`. **Depends on:** M0-11, M0-12.
  - **Deliver:** Copy the complete tenant membership contract; A and B participation remain separate rows.
  - **Verify:** TC-M0-06 compiler. **Trace:** M0-R02/R05; R02/R03. **Review:** membership entity.

- [ ] **M0-14 — Define the location contract**
  - **Area / paths:** `modules/location/entity/location.entity.ts`. **Depends on:** M0-11.
  - **Deliver:** Copy the complete location contract with required tenant ownership and optional root parent.
  - **Verify:** TC-M0-06 compiler. **Trace:** M0-R02; R02. **Review:** location entity.

- [ ] **M0-15 — Define the machine contract**
  - **Area / paths:** `modules/machine/entity/machine.entity.ts`. **Depends on:** M0-11, M0-14.
  - **Deliver:** Copy the complete machine contract; preserve required locationId and stable identity.
  - **Verify:** TC-M0-06 compiler. **Trace:** M0-R02; R02. **Review:** machine entity.

- [ ] **M0-16 — Apply the minimal retained schema**
  - **Area / paths:** `platform/database/postgres/migrations/0001-foundation.{ts,up.sql,down.sql}; schema.integration.test.ts`. **Depends on:** M0-09, M0-07, M0-11, M0-12, M0-13, M0-14, M0-15.
  - **Deliver:** Create the five tables and tenant-safe foreign keys/uniqueness described in Design; validate the real SQL schema directly, independently of ORM mappings.
  - **Verify:** TC-M0-08. **Trace:** M0-R02; R02. **Review:** retained SQL schema.

- [ ] **M0-17 — Map tenant records to SQL**
  - **Area / paths:** `platform/database/postgres/orm-entity/tenant.ts; tenant.integration.test.ts`. **Depends on:** M0-08, M0-11, M0-16.
  - **Deliver:** Map all tenant fields without deriving permission from a code.
  - **Verify:** TC-M0-07. **Trace:** M0-R02; R02. **Review:** tenant persistence mapping.

- [ ] **M0-18 — Map actor records to SQL**
  - **Area / paths:** `platform/database/postgres/orm-entity/actor.ts; actor.integration.test.ts`. **Depends on:** M0-08, M0-12, M0-16.
  - **Deliver:** Round-trip actor kind/status and omitted owner without adding roles or tenant membership to the global record.
  - **Verify:** TC-M0-07. **Trace:** M0-R02/R05; R02/R03. **Review:** actor persistence mapping.

- [ ] **M0-19 — Map tenant membership records to SQL**
  - **Area / paths:** `platform/database/postgres/orm-entity/tenant-membership.ts; tenant-membership.integration.test.ts`. **Depends on:** M0-08, M0-13, M0-16.
  - **Deliver:** Round-trip membership status using the tenantId/actorId key.
  - **Verify:** TC-M0-07. **Trace:** M0-R02; R02. **Review:** membership persistence mapping.

- [ ] **M0-20 — Map location records to SQL**
  - **Area / paths:** `platform/database/postgres/orm-entity/location.ts; location.integration.test.ts`. **Depends on:** M0-08, M0-14, M0-16.
  - **Deliver:** Map current parent and tenant ownership; SQL null for a root maps to an omitted optional field.
  - **Verify:** TC-M0-07. **Trace:** M0-R02; R02. **Review:** location persistence mapping.

- [ ] **M0-21 — Map machine records to SQL**
  - **Area / paths:** `platform/database/postgres/orm-entity/machine.ts; machine.integration.test.ts`. **Depends on:** M0-08, M0-15, M0-16.
  - **Deliver:** Round-trip machine tenant/code/locationId without looking up a machine by display code alone.
  - **Verify:** TC-M0-07. **Trace:** M0-R02; R02. **Review:** machine persistence mapping.

- [ ] **M0-22 — Seed the retained two-tenant business fixtures**
  - **Area / paths:** `modules/@shared/tests/factories/foundation.ts; platform/validation/seed-business.ts and seed-business.integration.test.ts`. **Depends on:** M0-16, M0-17, M0-18, M0-19, M0-20, M0-21.
  - **Deliver:** Populate deterministic A/B identities, memberships, hierarchy and machines in one SQL seed transaction; do not erase unrelated data.
  - **Verify:** TC-M0-09. **Trace:** M0-R02/R08; R02/R05. **Review:** business seed.

- [ ] **M0-23 — Define the trusted identity and authorization contracts**
  - **Area / paths:** `modules/@shared/auth/identity-context.ts, authorization.ts and authorized-usecase.interface.ts`. **Depends on:** none.
  - **Deliver:** Define IdentityContext with actorId/tenantId, neutral authorization request/decision and execute(input, identityContext). No actor/membership status, entity resolution, token SDK or SQL port belongs here.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R04/R05; R03. **Review:** shared authorization contracts.

- [ ] **M0-24 — Define the protected machine business-reader port**
  - **Area / paths:** `modules/authorization/features/validate-good-report/application/interfaces.ts`. **Depends on:** M0-15, M0-23.
  - **Deliver:** Declare findById({tenantId,machineId}) returning the machine or absence. This is the validation operation's business repository, never a dependency of authorization.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R02/R06; R02. **Review:** validation application contracts.

- [ ] **M0-25 — Read the business machine within its tenant**
  - **Area / paths:** `modules/authorization/features/validate-good-report/outbound/postgres/repository.ts; repository.integration.test.ts`. **Depends on:** M0-03, M0-21, M0-24.
  - **Deliver:** Implement the business-reader port using the machine mapping. Return no row for foreign/missing IDs; translate recognized connection/outage failures to RepositoryUnavailableError, other failures to RepositoryError. Only protected handle invokes it after allow.
  - **Verify:** TC-M0-10. **Trace:** M0-R02/R06; R02/R04. **Review:** validation business outbound.

- [ ] **M0-26a — Validate OpenFGA configuration**
  - **Area / paths:** `configs/openfga.ts; openfga.test.ts`. **Depends on:** M0-01.
  - **Deliver:** Validate the provider URL, explicit store/model binding, model hash and positive timeout only when controlled validation is enabled; expose no SDK types or secrets in errors.
  - **Verify:** TC-M0-01. **Trace:** M0-R03/R05; R01/R05. **Review:** OpenFGA configuration.

- [ ] **M0-26b — Implement the generic OpenFGA client boundary**
  - **Area / paths:** `platform/openfga/client.ts; client.test.ts`. **Depends on:** M0-05, M0-26a.
  - **Deliver:** Build the reusable pinned SDK client from validated config, with the documented bounded timeout and explicit no-retry policy. Keep transport/provider IDs out of business modules.
  - **Verify:** TC-M0-14. **Trace:** M0-R03/R06; R04. **Review:** OpenFGA platform client.

- [ ] **M0-27 — Provide disposable OpenFGA test setup**
  - **Area / paths:** `modules/@shared/tests/testcontainers/setup-openfga.ts`. **Depends on:** M0-07, M0-26b.
  - **Deliver:** Start the pinned real provider with its own PostgreSQL datastore and provider migrations for integration/E2E, wait for readiness and stop it reliably. It needs no root infrastructure changes.
  - **Verify:** TC-M0-11/12. **Trace:** M0-R08; R01/R05. **Review:** provider test infrastructure.

- [ ] **M0-28 — Define and verify the graph-authoritative M0 model**
  - **Area / paths:** `platform/openfga/models/m0/model.fga, model.json, store.fga.yaml; model.integration.test.ts`. **Depends on:** M0-23, M0-27.
  - **Deliver:** Implement the exact new global-actor enabled, tenant enabled, active-membership and independent-source model. Test each required gate, selected-tenant binding, independent memberships and global disable. No SQL/status context or contextual membership override.
  - **Verify:** TC-M0-11/25/26/27. **Trace:** M0-R03/R05; R02/R03/R05. **Review:** M0 graph model.

- [ ] **M0-29 — Initialize and bind the revised validation store/model**
  - **Area / paths:** `platform/validation/initialize-openfga.ts; initialize-openfga.integration.test.ts`. **Depends on:** M0-26b, M0-28.
  - **Deliver:** Initialize authorization-m0-v2, upload the new artifact and emit the private exact binding/hash. Reject an earlier revision/model binding; no silently chosen latest model or live data migration is needed because no implementation exists.
  - **Verify:** TC-M0-12. **Trace:** M0-R03/R08; R05. **Review:** provider initialization.

- [ ] **M0-30 — Seed lifecycle gates and direct permission sources**
  - **Area / paths:** `platform/validation/seed-relationships.ts; seed-relationships.integration.test.ts`. **Depends on:** M0-22, M0-29.
  - **Deliver:** Seed enabled global actors, enabled tenants, active-membership usersets and stable direct sources from the controlled scenario. Use isolated native Write/delete fixtures for disabled gates, DUAL and orphan SQL cases; deliver no runtime lifecycle API.
  - **Verify:** TC-M0-13/25/26/27. **Trace:** M0-R03/R08; R02/R03/R05. **Review:** relationship seed.

- [ ] **M0-31 — Implement the SQL-independent OpenFGA authorization adapter**
  - **Area / paths:** `modules/authorization/features/authorize/outbound/openfga/authorization.adapter.ts; authorization.adapter.test.ts and authorization.adapter.integration.test.ts`. **Depends on:** M0-23, M0-26b, M0-28.
  - **Deliver:** Implement AuthorizationCapabilityInterface directly. Map trusted actor/selected tenant, fixed action and tenant-addressed resource to the pinned Check. Pass only selected_tenant_id context; strictly classify true/false/error. Inject no business repository.
  - **Verify:** TC-M0-14/15. **Trace:** M0-R03/R04/R05; R03/R04. **Review:** authorization outbound adapter.

- [ ] **M0-32 — Define the safe authorization-decision event contract**
  - **Area / paths:** `modules/@shared/auth/authorization-log.interface.ts`. **Depends on:** M0-04, M0-23.
  - **Deliver:** Define one authorization.check event with server-generated invocationId, trusted identity/action/resource, decision/time and policy/scenario versions. It records permission, not business success.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R07; R06. **Review:** shared authorization log contract.

- [ ] **M0-33 — Enforce and log allow-before-handle in the shared base**
  - **Area / paths:** `modules/@shared/auth/authorized-usecase.ts; authorized-usecase.test.ts`. **Depends on:** M0-04, M0-23, M0-32.
  - **Deliver:** Call the injected capability once, log its decision with an invocationId and pass the unchanged IdentityContext plus that ID into handle only on allowed. Deny/indeterminate never invoke handle or a business reader. There is no recursive authorization usecase or SQL fact service.
  - **Verify:** TC-M0-03/15/16. **Trace:** M0-R04/R05/R07; R03/R04/R06. **Review:** shared execution gate.

- [ ] **M0-34 — Define the validation operation contracts and errors**
  - **Area / paths:** `modules/authorization/features/validate-good-report/domain/types.ts and errors.ts`. **Depends on:** M0-23.
  - **Deliver:** Define machineId-only input, explicit validation-only output and a safe machine-missing error category. Known repository unavailability uses the existing shared category; authorization errors remain shared; no manufacturing state transition is introduced.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R05/R06; R03/R04. **Review:** validation domain contracts.

- [ ] **M0-35 — Implement the protected post-allow business read**
  - **Area / paths:** `modules/authorization/features/validate-good-report/application/usecase.ts, usecase.interface.ts; usecase.test.ts`. **Depends on:** M0-24, M0-33, M0-34.
  - **Deliver:** Declare quantities:good:report, inherit execute and have handle read the machine by trusted tenant/machineId once. Existing row returns validation-only success; missing row throws safe404 category; recognized storage outage remains business-unavailable503 after authorization allow, while generic repository/unexpected failure remains500.
  - **Verify:** TC-M0-17/28. **Trace:** M0-R04/R06; R02/R04. **Review:** validation application.

- [ ] **M0-36 — Record the separate validation business outcome**
  - **Area / paths:** `modules/authorization/features/validate-good-report/application/usecase.ts; usecase.test.ts`. **Depends on:** M0-04, M0-05, M0-35.
  - **Deliver:** Emit a correlated validation.completed event from handle with completed/resource_unavailable/business_unavailable/failed outcomes. Keep the prior authorization.check allow intact when business execution fails; no business event occurs on denied/indeterminate authorization.
  - **Verify:** TC-M0-03/17/28. **Trace:** M0-R07; R06. **Review:** validation outcome observability.

- [ ] **M0-37 — Adapt the HTTP request to trusted identity context**
  - **Area / paths:** `modules/authorization/features/validate-good-report/inbound/http/http-handler.ts; http-handler.test.ts`. **Depends on:** M0-02, M0-34, M0-35.
  - **Deliver:** Accept machineId only and pass the server-injected IdentityContext separately to execute. Reject body identity/status/tuples; ignore identity/entitlement-looking headers. Implement no authentication/token verifier now.
  - **Verify:** TC-M0-18. **Trace:** M0-R05/R06; R03/R06. **Review:** validation inbound.

- [ ] **M0-38 — Map authorization and business outcomes safely**
  - **Area / paths:** `modules/authorization/features/validate-good-report/inbound/http/http-response-mapper.ts; http-response-mapper.test.ts`. **Depends on:** M0-02, M0-03, M0-37.
  - **Deliver:** Map graph refusal/unknown reference to403; permitted missing SQL row to404; provider-indeterminate and recognized business-store-unavailable errors to distinct safe503 messages; generic RepositoryError remains500. Preserve the shared400/401/500 mappings and explicit validation-only200.
  - **Verify:** TC-M0-18/28. **Trace:** M0-R06; R04/R06. **Review:** validation response mapping.

- [ ] **M0-39 — Inject identity context from the controlled fixture runner**
  - **Area / paths:** `platform/validation/context.ts; context.test.ts`. **Depends on:** M0-22, M0-23.
  - **Deliver:** Select fixed actorId/tenantId per instance from trusted fixture configuration, including negative subjects. Read no per-request identity/status from SQL and expose no client selector. A future verified-token layer will populate the same context.
  - **Verify:** TC-M0-19. **Trace:** M0-R05/R08; R03/R05. **Review:** controlled identity support.

- [ ] **M0-40 — Assemble independent authorization and business dependencies**
  - **Area / paths:** `modules/authorization/features/validate-good-report/inbound/http/wire.ts`. **Depends on:** M0-25, M0-31, M0-33, M0-35, M0-36, M0-37, M0-38, M0-39.
  - **Deliver:** Inject the OpenFGA-only capability into the authorized base and the SQL machine reader into the protected validation operation. Compose handler/context/logger without policy or SQL inside the authorization adapter.
  - **Verify:** TC-M0-20 assembled smoke at M0-42. **Trace:** M0-R04/R06; R03/R04. **Review:** validation wire.

- [ ] **M0-41 — Register the controlled validation route**
  - **Area / paths:** `platform/http/routes/authorization.routes.ts and api-routes.ts; platform/bootstrap.ts`. **Depends on:** M0-10, M0-29, M0-30, M0-40.
  - **Deliver:** Register the documented POST route only when controlled validation is enabled and setup/binding is verified; the normal disabled app exposes no validation route.
  - **Verify:** TC-M0-20. **Trace:** M0-R01/R05/R06; R01/R05. **Review:** route and startup integration.

- [ ] **M0-42 — Demonstrate real graph gates and protected business reading**
  - **Area / paths:** `modules/authorization/features/validate-good-report/tests/validation.e2e.test.ts`. **Depends on:** M0-07, M0-27, M0-41.
  - **Deliver:** Run real HTTP/FGA/SQL for independent A/B allows, absent grants, disabled actor/tenant/membership, DUAL scope, and substitution attempts. Unknown/foreign graph references never query SQL; an allowed orphan graph resource gets safe404 after its tenant-scoped read.
  - **Verify:** TC-M0-21/25/26/28. **Trace:** M0-R02–R08; R02/R03/R06. **Review:** E2E baseline.

- [ ] **M0-43 — Distinguish authorization outage from business-storage failure**
  - **Area / paths:** `modules/authorization/features/validate-good-report/tests/validation-failure.e2e.test.ts`. **Depends on:** M0-42.
  - **Deliver:** After startup, interrupt OpenFGA and prove no handle/SQL; separately interrupt only the business database while FGA remains up. A denial still needs zero SQL, and an allow is logged before the business read fails safely. Restore dependencies and perform fresh checks.
  - **Verify:** TC-M0-22/29. **Trace:** M0-R01/R04/R06/R08; R01/R04/R05. **Review:** E2E failure/recovery.

- [ ] **M0-44 — Record the reproducible M0 result**
  - **Area / paths:** `this document execution evidence; controlled runner instructions under the backend when implemented`. **Depends on:** M0-42, M0-43.
  - **Deliver:** Record exact setup/run commands, versions, case counts and outcomes/limits; update M0 state only from evidence and leave the full F01 incomplete.
  - **Verify:** TC-M0-23. **Trace:** M0-R08; R05/R09. **Review:** M0 completion review.

## M0 technical case catalog

Cases are planned except for the applicable TC-M0-01 configuration checks executed at M0-01, TC-M0-02 shared HTTP/repository-error/observability compiler checks executed at M0-02–04, TC-M0-03 logger-output checks executed at M0-05, TC-M0-04 HTTP lifecycle checks executed at M0-06, TC-M0-24 PostgreSQL test infrastructure checks executed at M0-07 and TC-M0-05 connection/migration/packaged-asset checks executed at M0-08–09, recorded below. TC-M0-01 provider binding/timeout checks remain pending M0-26a; TC-M0-02 remains pending for its other owning tasks; TC-M0-03 remains pending for M0-33/M0-36 application producers; TC-M0-04 bootstrap/resource cleanup was executed at M0-10, with user bootstrap support review accepted on 2026-10-30, America/Sao_Paulo. TC-M0-06 tenant/actor compiler verification was executed at M0-11/M0-12; membership/location/machine portions remain pending. All other cases remain unexecuted. Use real provider/SQL integration where stated; unit faults exercise the actual boundary implementation. Each fixture variation is isolated and versioned. No case assumes a runtime lifecycle API exists.

| Case | Level / owner | Starting condition and stimulus | Observable expectation |
| --- | --- | --- | --- |
| TC-M0-01 | Unit · M0-01/26a | Missing/invalid HTTP, business DB or enabled-validation provider binding/timeout. | Safe configuration failures; valid startup needs no Keycloak/AWS variables. |
| TC-M0-02 | Compiler · M0-02/03/04/23/24/32/34 | Compile complete neutral, business-reader and entity contracts under strict optional/index settings. | Pure inward contracts compile; no SQL/status/token/SDK dependency in authorization interfaces. |
| TC-M0-03 | Unit · M0-05/33/36 | Capture authorization allow/deny/indeterminate and a correlated subsequent business success/failure; inject synthetic secrets in errors. | Safe actor/tenant/action/resource/time/version fields; allow is not relabelled when business fails; no raw errors or foreign content. |
| TC-M0-04 | HTTP integration/unit · M0-06/10 | Start/close HTTP; inject startup/listen failure after resources acquired. | Health leaks no business data; failed bootstrap never leaves a ready validation route or leaked resources. |
| TC-M0-05 | Real SQL integration · M0-08/09 | Connect/migrate/close, rerun migration, force failure; inspect packaged SQL assets. | Applied once, transactional failed migration not marked successful; build contains required SQL. This is service/business setup, not authorization lookup. |
| TC-M0-06 | Compiler · M0-11–15 | Compile all five retained entity contracts. | Pure complete shapes; SQL directory status fields are not permission inputs. |
| TC-M0-07 | Real SQL integration · M0-17–21 | Round-trip mapped fields, omitted owner and root parent. | Correct ownership/status projection and SQL-null→omitted-optional mapping; no SQL permission graph. |
| TC-M0-08 | Real SQL integration · M0-16 | Insert valid A/B reused codes; attempt duplicate membership and foreign location/parent. | Tenant-safe constraints reject invalid references and partial records. |
| TC-M0-09 | Real SQL integration · M0-22 | Seed fresh business schema; repeat; conflict with existing seed identity. | Two fixture tenants and stable IDs; identical repeat is deterministic, conflicting seed fails without deleting unrelated rows. |
| TC-M0-10 | Real SQL integration · M0-25 | Call business reader with A/M1, A/B-M1, missing ID and failed storage. | Tenant-filtered machine or absence; recognized unavailable vs generic repository failure. Reader loads no actor/membership and is not injected into authorization. |
| TC-M0-11 | Actual FGA integration · M0-28 | Start with one enabled actor, enabled tenant, membership and direct grant; separately remove each gate/source. | Only all four requirements permit. Actor/tenant/membership alone grants no operation; a grant alone cannot bypass a disabled gate. |
| TC-M0-12 | Actual FGA integration · M0-29 | Initialize authorization-m0-v2; use matching binding, old v1/r5 binding, wrong hash or failed upload. | Exact new artifact pinned; old/mismatched/uncertain setup cannot become ready; no implicit latest-model choice. |
| TC-M0-13 | Actual FGA/SQL setup integration · M0-30 | Seed exact current-model tuples and rerun; interrupt seed before readiness. | Stable source IDs, native persisted gates and deterministic setup; unknown completion is not success. Setup may read fixture data, runtime authorization does not. |
| TC-M0-14 | Adapter unit + real FGA integration · M0-26b/31 | Check trusted context; return true/false/malformed result, timeout, transport error or missing/evaluation-error tenant context. | True→allowed, false→denied; invalid/error→indeterminate. Selected tenant is trusted; no status/contextual-membership data forwarded; pinned model and bounded attempt. |
| TC-M0-15 | Boundary unit · M0-31/33 | Construct authorization adapter/base without any business repository; invoke known checks with identity-looking status/roles in unrelated fixture/request data. | Check inputs contain only trusted identity/resource/action plus selected-tenant binding; graph states cannot be overridden. No SQL dependency or entity resolution is required. |
| TC-M0-16 | Shared application unit · M0-33 | Execute allow/deny/indeterminate/throwing capability, including repeated invocations. | One fresh capability call each time; handle receives the same context once only for allow; no business calls on deny/error. |
| TC-M0-17 | Application unit · M0-35/36 | Invoke the real usecase through execute; grant then return machine/missing/failure from business-reader stub. | Correct fixed action; reader called only after allow with trusted tenant/ID; validation-only success or separate business failure; no manufacturing write. |
| TC-M0-18 | HTTP unit · M0-37/38 | Malformed/extra body, missing server context, policy deny, orphan SQL row, provider failure, recognized business outage and unexpected repository failure. | Exact safe400/401/403/404/503/500 mapping; provider and business503 meanings distinguishable; no raw SDK/SQL data. |
| TC-M0-19 | Support unit · M0-39 | Inject enabled, disabled and outsider fixture contexts; attempt client actor/tenant/status/role headers or body substitution. | Only trusted fixture config selects identity; context shape is token-provider-neutral. No JWT decoding/verification is implemented now and no lifecycle flag is taken from claims. |
| TC-M0-20 | Assembled smoke · M0-40/41 | Validation disabled, then enabled after current setup; inspect injected boundaries. | Disabled route absent; enabled route uses FGA-only authorization and a separate machine business repository behind handle. |
| TC-M0-21 | Real HTTP/FGA/SQL E2E · M0-42 | A and B own successful machine validations; no-grant/inactive/outsider/foreign reference and substitution variants. | Correct safe results; no business read on any refused/indeterminate check; allowed reads use tenant key and change no business rows. |
| TC-M0-22 | Provider interruption E2E · M0-43 | After a real allow, stop/delay FGA or inject malformed result; restore it. | Safe authority-unavailable503 and zero handle/SQL; no old allow reused; recovery performs fresh Check. |
| TC-M0-23 | Evidence review · M0-44 | Review setup commands, exact model/fixture IDs and named executed suites/counts. | Reproducible M0-only evidence, no empty-suite or historical-QA proof and no full F01/capacity claim. |
| TC-M0-24 | Test infrastructure integration · M0-07 | Start/stop generic disposable PostgreSQL; fail setup. | Expose connection settings and release resources without datasource/migration/business dependency cycles. |
| TC-M0-25 | Actual FGA integration + E2E · M0-28/30/42 | Isolated DUAL reporting variant has memberships and direct sources in A/B; Check each correct context, then selectedA against B and an A resource wrongly linked to B's source. | Correct same-tenant allows; selected-tenant guard rejects cross-tenant use/source combination. Removing A membership leaves B effective. Membership never creates rights by itself. |
| TC-M0-26 | Actual FGA integration + E2E · M0-28/30/42 | With the isolated dual-tenant source variant, delete the actor's single global enabled relation; separately delete only A tenant's enabled relation. | Global disable blocks both tenants without grant enumeration. A tenant disable blocks A but not B; re-seeded gates restore only their intended scope. |
| TC-M0-27 | Actual FGA integration · M0-28/30 | Use internal fixture Write/delete to disable/enable gates or remove membership; keep directory SQL statuses unchanged; try stale status/active_member contextual claims at the application boundary. | Current persisted graph state controls the result. Adapter forwards no contextual permission tuples; fixture writes are native APIs, not delivered runtime lifecycle endpoints. |
| TC-M0-28 | Application + HTTP/SQL E2E · M0-35/36/38/42 | Give an orphan A resource a valid graph source but omit its SQL machine; then use a foreign/nonexistent graph reference. | Orphan allow is logged, then trusted-tenant business read yields safe404 with business failure event. Graph refusal yields403 and no SQL read. |
| TC-M0-29 | Business-storage interruption E2E · M0-43 | After ready, stop only the application business DB while provider/datastore remain up; invoke an allowed and a denied request. | Denied stays403 with no business read. Allowed decision is correctly logged before safe business-unavailable503; it is never reclassified as authority indeterminate. Recovery rereads after a fresh Check. |

## After M0: design work in order

These are atomic **Architect planning tasks**, not permission to implement future use cases. Each has **Status: not started; evidence: none; next checkpoint: review its design output**. Backend opens separate inside-out implementation tasks only after the corresponding design is approved. The requirements/acceptance map remains in [Requirements](EP-00-F01-govern-scoped-access.requirements.md#complete-f01-source-map).

| Task / milestone | Entry dependency | Required design output | Coverage and blocking gate |
| --- | --- | --- | --- |
| F01-P01 · M1 | M0 evidence reviewed | Owner grant slice: input/ports, unchanged-input-to-tuple mapping, independent source identity, denied-change no-effect cases and per-layer tasks. | US01/US02, BR01/BR02/BR06, AC08 baseline. |
| F01-P02 · M1 | F01-P01 reviewed | Revoke slice: exact source removal, repeat/unknown Write outcomes and safe sequential result categories. | BR03, AC03 baseline; **G01 remains open**, so no full effective cutoff claim. |
| F01-P03 · M2 | F01-P02 reviewed | Action-specific hierarchy and fixed group paths, independent direct/group sources and protected current-source inspection, model/tuple compatibility plan. | BR01/BR03/BR05, AC03/AC07 baseline; full historical explanation requires G03. |
| F01-P04 · M3 | F01-P03 reviewed | Create-delegation slice: explicit ceilings/window, self/onward restrictions and source binding to one allowed authority. | US01, BR01/BR02/BR04, AC01/AC02. |
| F01-P05 · M3 | F01-P04 reviewed | End-delegation/expiry design: exact start/end, not-yet-valid cases, dependent grants and expired-source cleanup; trusted clock test strategy. | BR04, AC04; no stale/time-clamped authority invented locally. |
| F01-P06 · M4 | F01-P05 reviewed | Resolve **G04**: bounded group additions/removals/nesting, complete affected-rights checks, concurrent mutation policy and cycle/duplicate-source cases. | BR01/BR02, AC02/AC03. A sequential query demonstration alone cannot close G04. |
| F01-P07 · M5 | F01-P06 reviewed | Tenant-membership lifecycle slice and its portion of **G02**: native graph membership Write/delete, separate optional directory projections, uncertain outcomes/recovery and DUAL independence. | BR04, AC05/AC08; no global identity disable for tenant-local suspension. |
| F01-P08 · M5 | F01-P07 reviewed | Machine reassignment design resolving remaining **G02**; old-order/event contracts and original-location history; safe effectiveness and partial-write behavior. | BR05, AC07. Public location administration remains excluded. |
| F01-P09 · M6 | M1–M5 designs reviewed | Resolve **G01**: precise acceptance vs effective-revocation ordering, uncertain completion and reproducible concurrent tests. | BR03/BR06, AC06. Earlier sequential milestones remain incomplete against this guarantee until resolved. |
| F01-P10 · M6 | F01-P09 reviewed | Resolve **G03**: protected retained history, source/path investigation, initiator/recipient distinction and scoped disclosure tests. | BR06, full AC03/AC08. Logs are supporting information, not historical proof. |
| F01-P11 · M7 | F01-P10 reviewed; all G01–G04 closed and corresponding implementations verified | Complete acceptance/regression and capacity/recovery experiment plan; report measured envelope and remaining production exclusions. | All US/BR/AC; F01 completion requires actual implementation/execution evidence, not design approval. |

Global-actor and whole-tenant lifecycle workflows are separately scoped future features, not added F01 delivery. F01 retains its tenant-membership suspension/removal. M0 exercises graph gates through internal seeded variants only.

A gate's design must be resolved **before** claiming its affected behavior, even when its closure appears later in the roadmap. Substantive future designs return to review within this same F01 package. Historical model/contracts in Design preserve prior reasoning only. Their SQL-fact/status and tenant-qualified-actor choices are superseded and cannot be carried into later designs as current instructions.

### Future confidence experiment reference

Retain revision 4's proposed experiment inputs for M7 planning: the same two tenants with 100/1,000/10,000 memberships/machines, 10/100/1,000 groups, reported hierarchy/group depths and independent sources; deterministic cases first, then separate read/report/change workloads with 10/50 concurrent subjects for 60 seconds, plus interruption/delay. These are **unexecuted proposed inputs, not an SLA or a current M0 requirement**. The reviewed M7 plan must confirm feasibility and state hardware, provider versions, completed rates, allow/deny/indeterminate counts, p50/p95/p99, incorrect outcomes and source-write failures. Unsupported correctness guarantees cannot be declared passed at any load.

## Documentation verification

Architect and coordinator completed the following **revision 6 planning checks** on 2026-10-30:

| Check | Actual result / evidence |
| --- | --- |
| Markdown/JSON | 41 local links/anchors resolve, fences balance and all 15 JSON examples parse. The current sequence diagram contains no raw semicolons in messages. |
| Source coverage | All 2 stories, 6 rules and 8 acceptance criteria remain mapped; no product definition/status changed. |
| Task/case readiness | 45 atomic M0 checkboxes and 29 planned case families. Every explicit dependency exists and appears earlier, with paths/output/verification/trace/review fields present. No readiness cycle. |
| Current contract compilation | 12 M0 files compile with exit0 under ES2024/ESNext/Bundler, strict, exactOptionalPropertyTypes, noUncheckedIndexedAccess, verbatimModuleSyntax and isolatedModules. The driving validation interface and business-only repository port compile separately from authorization. |
| Historical contract compilation | All 13 original revision-4 contract files compile independently, exit0. Evidence roots: `/tmp/andromeda-f01-r6-contracts-4x44c3k_`. These do not validate the new graph at runtime. |
| SQL/identity boundary | Current authorization TypeScript has no SQL/entity/status port or actor_status/membership_status context. Business machine reader belongs to the protected validation feature; graph refusal does not require it. |
| Current tuple/model review | The 24 exact baseline tuples have unique keys, global self-enabled actors, enabled-userset memberships and matching tenant links/expected-tenant context. Coordinator reviewed source/resource intersections and persisted tenant binding conceptually. **No real-provider model validation or runtime decision test was run.** |
| Historical preservation | Original 13 TypeScript, 9 JSON and 1 FGA blocks remain verbatim inside the explicitly superseded appendix; all 28 original exported contract names remain present. |
| Design-authoring boundary / whitespace | Before approval recording, only the four assigned architecture documents were edited; the earlier requirements filename change was preserved. No product/code/config/ADR changes were part of that authoring QA; `git diff --check` passed. |

No implementation, real-provider/model, infrastructure, application or performance suite has been executed for this documentation revision. All execution cases remain planned. Revision-5 QA is historical only; M0 design is now Approved, implementation remains not started and F01 incomplete. Approval/ADR recording does not change the historical execution evidence.

Approval-record QA on 2026-10-30 checked ADR/spec/context links, approval-state consistency, unchanged revision-6 fenced contracts/model/examples and no completed checkboxes; `git diff --check` passed. No code/runtime suite was needed for this approval-only update.

Scope clarification on 2026-10-30: approval and ADR recording only in this session; implementation is deferred to an explicit start in a new context window. The handoff/ADR wording was corrected without changing revision 6's approved design or marking any task complete. No code tests were run for this wording correction.

## Execution evidence

| Milestone | Implementation | Execution evidence | Next checkpoint |
| --- | --- | --- | --- |
| M0 | in progress; M0-01–12 technically validated and accepted on 2026-10-30, America/Sao_Paulo; M0-13 not started | M0-12 complete actor shape preserved; backend/root lint, root fix idempotence, six targeted lint fixtures, AST preservation across 44 existing source/config files and strict app typecheck passed. Earlier runtime evidence remains historical and was not rerun. | M0-12 review accepted; this instruction updates approval status only. M0-13 and later tasks have not started; M0/F01 remain in progress. |
| M1–M7 | not started; design required | None; original product criteria retained. | Complete the relevant future design task and resolve its gates. |

### M0-01 configuration evidence — 2026-10-30

The user explicitly started the first implementation task in a new context, then requested separate database/runtime configuration folders, schema/error/interface/loader files and a loader call in `main.ts`. Existing schemas, interfaces, error and loader statements were preserved through extraction; only imports and the runtime schema export changed. No database-specific error was invented. The relocated unit suite retains the same assertions. `main.ts` only calls `loadRuntimeConfig()`; it opens no resources and does not implement M0-10 lifecycle behavior. No business modules or platform adapters were implemented. Existing dependencies and root/app tooling were unchanged.

| Check / case | Actual result and limits |
| --- | --- |
| Test-driven baseline | The first targeted suite failed because `./env` did not exist; implementation then made the real configuration tests pass. No empty run is counted as runtime evidence. |
| TC-M0-01 · HTTP/database/validation flag | After reorganization, `npm run test -- src/configs/runtimeconfig/load-runtime-config.test.ts` from `apps/andromeda-backend`: **1 suite, 33 passed**, Vitest 4.1.12 / Node.js 24.18.0. Checks required/blank settings, both port boundaries, invalid numeric forms, boolean literals and failures, disabled-by-default validation, loopback binding, current process environment, input immutability, password preservation, unrelated settings and safe error fields. |
| Strict compilation | `npm run typecheck` from the backend: exit 0 with the existing strict, optional-property and indexed-access compiler settings. |
| Configuration build / entrypoint smoke | `npm run build`: exit 0, tsup 8.5.1 produced `dist/main.js` and sourcemap. Invoking `node dist/main.js` with only the six required synthetic HTTP/database settings exits 0 with empty stdout/stderr; replacing `PORT` with a synthetic invalid value exits nonzero with `Invalid runtime configuration: http.port.` and no invalid value/password disclosure. These two smoke scenarios exercise the configuration-only entrypoint, not an assembled service. |
| Coverage | No configured/installed Vitest coverage provider was available; no coverage percentage is claimed. Both boolean values/defaults and each custom invalid-input branch have behavioral assertions. |
| Remaining verification | Provider binding/timeout is M0-26a. M0-10 still owns full service bootstrap/shutdown; the configuration-only `main.ts` does not complete it. No assembled service start, SQL/FGA integration, E2E, capacity or business acceptance is claimed. |
| Stage gate | Configuration code/checks complete; user explicitly accepted the M0-01 review on 2026-10-30, America/Sao_Paulo. At that checkpoint, M0-02 was dependency-ready but not started or authorized; its later explicit start is recorded below. M0/F01 remain in progress. |

### M0-01 review acceptance — 2026-10-30

The user explicitly approved the delivered configuration revision and asked whether it was task 1. This is **M0-01 — Validate runtime configuration**, whose implementation and review are now complete. The approval is recorded in the America/Sao_Paulo timezone and applies to M0-01 only. At that checkpoint, M0-02 was not started and required a separate explicit start instruction; that later instruction is recorded below. M0 and F01 remain in progress, with all later verification and design limits unchanged. This update changes execution metadata only; no code, design contracts, ADR or skills changed, and runtime checks were not rerun. `git diff --check` passed.

### M0-02 shared HTTP contract evidence — 2026-10-30

The user separately explicitly authorized task 02 after accepting M0-01. Only `src/modules/@shared/http/http-response.ts` was added to the backend; configuration, main and skills are unchanged in this stage. The reference guide's abstract Express response class illustrates the envelope but introduces adapter behavior. M0-02/TC-M0-02 explicitly require a pure compiler-verified contract, so this stage defines interfaces and a discriminated union only; actual HTTP serialization and safe error mapping remain later adapter stages.

| Check / case | Actual result and limits |
| --- | --- |
| TC-M0-02 · shared HTTP only | Exported `HttpSuccessResponseInterface<Data>`, `HttpErrorResponseInterface` and `HttpResponseInterface<Data>` have exactly the planned success/error envelope fields and no imports or runtime implementation. |
| Strict compilation | `npm run typecheck` from `apps/andromeda-backend`: exit 0 under the existing strict, exact optional-property and indexed-access settings. |
| Positive compiler checks | A temporary configuration extending the backend tsconfig compiled valid success/failure envelopes, a generic null payload and both branches narrowed by `error`. `rootDir` and ambient types were adjusted only in that temporary configuration; no repository tooling changed. |
| Negative compiler checks | Ten cases cover success/failure field access after narrowing, missing payload/message/discriminant, invalid discriminant/payload/message types and mixed fresh-literal envelopes. Expected rejections compiled with `@ts-expect-error`; a second pass without those directives produced exactly 10 diagnostics. No valid case was suppressed. Temporary files were removed after verification. |
| Limits | This type-only contract has no runtime paths or meaningful runtime coverage percentage; no artificial unit suite or service build was needed. TC-M0-02 for other owning tasks remains pending. No serialization, authorization, error sanitization, SQL/FGA integration or assembled HTTP behavior is claimed. |
| Stage gate | M0-02 implemented and compiler-validated; user shared HTTP review accepted on 2026-10-30 by the instruction to continue to task 3. At the original M0-02 checkpoint, M0-03 had not started; its subsequent authorized execution is recorded below. M0/F01 remain in progress. |

### M0-03 shared repository failure evidence — 2026-10-30

The user's instruction to proceed to task 3 accepted M0-02 and authorized only M0-03. This is the third M0 implementation task, not the future delegation/time milestone M3. Only `src/modules/@shared/errors/repository.error.ts` was added to the backend; configuration, main, shared HTTP contract, skills and approved design contracts are unchanged.

| Check / case | Actual result and limits |
| --- | --- |
| TC-M0-02 · repository failures only | Framework-free `RepositoryError extends Error` accepts a required message and optional native `ErrorOptions`. `RepositoryUnavailableError extends RepositoryError` inherits the same signature and carries a distinct `name`, remaining recognizable as both repository and unavailable failure. |
| Strict compilation | `npm run typecheck` from `apps/andromeda-backend`: exit 0 under the existing strict, exact optional-property and indexed-access settings. No external type/import dependencies were added. |
| Focused temporary runtime check | `node --input-type=module` imported the actual TypeScript module and confirmed generic errors are not unavailable errors, unavailable errors inherit the generic category, names/messages are correct and both retain the original `cause`. With a supplied safe message, technical cause text was absent from `String(error)`/JSON output. The cause uses native non-enumerable `ErrorOptions` storage, not a new serialization mechanism. No temporary fixture remained. |
| Test scope | The final change retains no redundant runtime suite for the trivial native-Error constructors. The required compiler check and focused temporary check above are the stage evidence. No coverage percentage is claimed. |
| Limits | Classes preserve the supplied message and cause; they do not sanitize arbitrary caller messages, identify driver failures or assign HTTP statuses. Later adapters must explicitly recognize connection/outage failures and select the unavailable category; unknown failures remain generic. Safe generic500/business-unavailable503 mapping and actual storage interruption remain later verification. No database, mapper, logger or authorization implementation was added. |
| Stage gate | M0-03 implemented and technically validated; user shared errors review accepted on 2026-10-30, America/Sao_Paulo. At that checkpoint, M0-04 had not started and required a separate explicit start instruction; its later authorized execution is recorded below. M0/F01 remain in progress. |

### M0-03 review acceptance — 2026-10-30

The user explicitly approved M0-03 on 2026-10-30, America/Sao_Paulo. Its implementation, technical verification and shared errors review are complete. At that checkpoint, M0-04 had not started and required an explicit start instruction; its later authorized execution is recorded below. M0/F01 remain in progress. This acceptance update changed execution metadata only. Runtime checks were not rerun; `git diff --check` passed.

### M0-04 observability contract/mock evidence — 2026-10-30

The user explicitly authorized task 04 after accepting M0-03. Only `src/modules/@shared/observability/observability.ts` and `observability.mock.ts` were added to the backend; configuration, main, earlier shared contracts, skills and approved design contracts are unchanged.

| Check / case | Actual result and limits |
| --- | --- |
| TC-M0-02 · observability only | Dependency-free `ObservabilityContextInterface` has readonly string-indexed unknown values. `ObservabilityInterface` declares `event(name: string, context?: ObservabilityContextInterface): void` and `capture(error: unknown, context?: ObservabilityContextInterface): void`. No business-specific event fields, levels, logger or framework types enter this port. |
| Reusable mock contract | Test-only `makeObservabilityMock()` returns `Mocked<ObservabilityInterface>` with independent typed `vi.fn` methods per factory call. Callers can inspect calls, clear mocks and configure behavior using standard Vitest controls. Vitest is imported only by `.mock.ts`, never by the runtime interface. Default mocks have no logging effect and return undefined. |
| Strict compilation | `npm run typecheck` from `apps/andromeda-backend`: exit 0 under the existing strict, exact optional-property and indexed-access settings. |
| Positive compiler checks | Temporary checks extending the backend tsconfig compiled mock-to-port assignment, structured/omitted contexts, unknown capture values, void event results and typed mock implementation/call/reset controls. Temporary rootDir/ambient-type adjustments did not change repository tooling. |
| Negative compiler checks | Eight cases covered invalid event names/context, omitted capture argument, invalid capture context, readonly context mutation, unsafe unknown-value assignment and matching mock argument constraints. Expected rejections compiled with `@ts-expect-error`; removing those directives produced exactly eight diagnostics. No valid case was suppressed; temporary files were removed. |
| Limits | No redundant runtime suite for interfaces or native Vitest mock behavior was added, and no runtime coverage percentage is claimed. Concrete logging, safe categorization/redaction and actual event emission remain later tasks. This contract/mock does not validate event contents, implement audit history or claim TC-M0-03 execution. TC-M0-02 for its remaining owning tasks is still pending. |
| Stage gate | M0-04 implemented and compiler-validated; user observability review accepted on 2026-10-30, America/Sao_Paulo. At that checkpoint, M0-05 had not started and required an explicit start instruction; its later authorized execution is recorded below. M0/F01 remain in progress. |

### M0-04 review acceptance — 2026-10-30

The user explicitly approved M0-04 on 2026-10-30, America/Sao_Paulo. Its implementation, compiler verification and observability review are complete. At that checkpoint, M0-05 had not started and required an explicit start instruction; its later authorized execution is recorded below. M0/F01 remain in progress. This acceptance update changed execution metadata only. Runtime checks were not rerun; `git diff --check` passed.

### Initial M0-05 Pino logger evidence — 2026-10-30 (before boundary correction)

This section records the initial pre-review implementation and test counts. Its placement of payload/category conventions in the Pino adapter was corrected at the user's request; the current correction evidence follows below.

The user explicitly authorized task 05 after accepting M0-04. Only `src/platform/observability/logger.ts` and `logger.test.ts` were added to the backend. The M0-01 configuration and M0-04 port are approved dependencies; the adapter also consumes the already approved M0-03 shared error classes. No earlier contract, skill, package, root tooling, infrastructure, main or application event producer was changed.

| Check / case | Actual result and limits |
| --- | --- |
| API / output | `PinoObservability implements ObservabilityInterface`, with optional injected `DestinationStream` (stdout by default). It creates Pino internally with no hostname/PID bindings and ISO timestamps. `event` logs at info/30; `capture` logs at error/50 using fixed `error.captured`. Context is nested so caller metadata cannot overwrite event/severity/time/category. |
| Safe projection / categories | Only invocationId, actorId, tenantId, action, result, outcome, reasonCategory, occurredAt, policyVersion, scenarioVersion and resource `{kind,id}` are projected from own data properties. Unknown fields, resource contents, inherited values, getters and serialization hooks are not forwarded to Pino. `capture` uses fixed `repository_unavailable`, `repository_error`, `unexpected_error` or `unknown_error` categories; it never serializes the exception, arbitrary name/message/stack or cause chain. This follows the approved F01 safety contract over the generic guide's raw-cause example. |
| Producer format contract | Metadata values are nonempty symbolic strings of at most 256 characters, matching `[A-Za-z0-9][A-Za-z0-9_.:-]*`; resource requires valid kind and id. Invalid values are omitted. Event labels start with a lowercase letter, contain only lowercase letters/digits/underscore/dot and are at most 128 characters; invalid labels become `observability.event`. Whole-string match checks reject trailing newlines. These are logging-format limits, not business-identity or permission validation. |
| TC-M0-03 · logger output only | `npm run test -- src/platform/observability/logger.test.ts`: **1 file, 43 passed**, using actual Pino 10.4.0 output into a captured Writable. Checks preserve allow/deny/indeterminate and correlated completed/business-unavailable records; enforce levels, category/time/metadata fields and no decision rewriting; discard synthetic credentials/tokens/SQL/provider/foreign-content fields and raw error chains; exercise format bounds, malformed/nested values, immutable inputs and throwing inspection traps. Test-driven baseline first failed because the adapter was absent; no empty run is counted. |
| Regression / compiler | `npm run test`: **2 files, 76 passed** (33 configuration + 43 logger), Vitest 4.1.12 / Node.js 24.18.0. `npm run typecheck`: exit 0 under the existing strict compiler settings. No configured coverage provider was installed; no percentage is claimed. No service build/E2E was needed for this isolated adapter stage. |
| Trust / operational limits | This is redaction by projection, not arbitrary-secret detection. Producers must supply trusted identifiers and authorized resource references; a secret or foreign ID deliberately placed in a permitted field with valid format cannot be identified by this adapter. The adapter preserves supplied metadata without deriving authorization or business outcomes. Destination protection, retention, transport reliability and durable audit/history remain environment/later-feature responsibilities. Tests of emitted records do not prove real authorization/SQL behavior or application event production; TC-M0-03 for M0-33/M0-36 is still pending. |
| Stage gate | At this initial implementation checkpoint, M0-05 was technically validated and user logger review was pending. The user subsequently requested corrections, whose final acceptance is recorded below. M0-06 had not started. M0/F01 remain in progress. |

### M0-05 responsibility correction evidence — 2026-10-30 (before file separation)

The user requested changes to M0-05: application context/payload conventions belong in shared observability, error categories require an explicit mapping outside Pino, and helper names must express intent. Architect documented the narrow ownership clarification in Design; implementation followed that handoff without changing the accepted M0-04 event/capture signatures, output, categories or safety behavior. This records the responsibility correction before the subsequent user-requested file separation below; it did not approve or start M0-06.

| Check / case | Actual result and limits |
| --- | --- |
| Shared payload ownership | `modules/@shared/observability/observability-payload.ts` defines explicit resource/context/event/error payload interfaces and `createEventLogPayload` / `createErrorLogPayload`. It owns selected fields, existing format bounds and safe projection. Helpers are named `selectLogContextFields`, `readContextFieldWithoutInvokingGetters` and `isValidLogMetadataValue`. |
| Explicit error representation | `observability-error-mapper.ts` exports the current fixed category vocabulary and `mapErrorToLogCategory`. It represents already classified `RepositoryUnavailableError`, `RepositoryError` and native/unknown fallbacks; it inspects no driver code, message, stack or cause. Layer-specific driver-to-application error translation and application-to-HTTP translation remain later adapters' responsibilities. No error hierarchy or registry was introduced. |
| Pino adapter ownership | `platform/observability/logger.ts` retains Pino construction/destination/ISO timestamps. `event` calls `info(createEventLogPayload(...))`; `capture` calls `error(createErrorLogPayload(...))`. It has no repository-error imports, context field list, regex policy, category classification or private policy helpers. |
| TC-M0-03 · focused verification | `npm run test -- src/modules/@shared/observability src/platform/observability/logger.test.ts`: **3 files, 44 passed** (27 payload conventions, 7 category mapper, 10 actual Pino/Writable integration cases). Prior relevant cases were moved to their owning concern; Pino integration retains real levels/serialization, correlation and safe-output assertions. One representative error-output integration case remains alongside the pure mapper cases to verify the adapter boundary. |
| Regression / compiler | `npm run test`: **4 files, 77 passed** (33 configuration + 44 observability), Vitest 4.1.12 / Node.js 24.18.0 / Pino 10.4.0. `npm run typecheck`: exit 0 under existing strict settings. No coverage percentage or assembled-service proof is claimed. |
| Preserved safety / limits | Raw exception details and causes are never included in emitted payloads; unknown/nested content fields, inherited/getter/serialization-hook values and malformed metadata remain excluded by shared conventions. Previously documented formats and producer trust limits are unchanged. Payload selection cannot detect a secret or foreign reference disguised as a valid permitted identifier; producers remain responsible for trustworthy, authorized context. TC-M0-03 application producers at M0-33/M0-36 and real SQL/FGA behavior remain pending. |
| Scope / stage gate | At this responsibility-correction checkpoint, M0-05 had moved from changes requested to refactored and technically validated; user correction review was pending. Subsequent file separation and final acceptance are recorded below. Runtime port/mock, earlier shared contracts, configuration and main are unchanged. Architect owns the Design clarification and coordinator owns skill updates; Backend changed implementation/tests and execution evidence only. M0-06 remains not started and M0/F01 remain in progress. |

### M0-05 file-organization correction — 2026-10-30

The user requested separate files for the declarations and operations combined in the shared payload module. This organization-only revision removes `observability-payload.ts` and relocates its declarations/function bodies unchanged, apart from imports and required exports. It preserves the accepted runtime port/mock, the explicit error mapper/categories, all formatting/projection rules and output, and Pino's emission-only responsibility.

| Responsibility | Current file / evidence |
| --- | --- |
| Payload/context interfaces | `modules/@shared/observability/observability-payload.interface.ts`; the existing four interfaces are unchanged. |
| Allowed context field list | `log-context-fields.ts`; unchanged `LOG_CONTEXT_FIELDS`, with an export for its consumer. |
| Context selection | `select-log-context-fields.ts`; exported `selectLogContextFields` with related private helpers `readContextFieldWithoutInvokingGetters` and `isValidLogMetadataValue` kept together. |
| Payload operations | `create-event-log-payload.ts` and `create-error-log-payload.ts`; direct imports replace the old monolith, without a barrel or compatibility façade. Pino method bodies are unchanged. |
| Verification | `npm run test`: **6 files, 77 passed** (selection 22, event builder 5, error builder 1, mapper 7, Pino integration 9, configuration 33). Cases were relocated to their SUT, not duplicated. `npm run typecheck`: exit 0. Extraction assertions confirmed preserved declarations/function bodies. No runtime behavior or safety convention changed. |
| Stage gate | M0-05 reorganized and technically validated; final user review accepted on 2026-10-30, America/Sao_Paulo, including both responsibility and organization corrections. Previously documented trust/operational limits remain unchanged. M0-06 has not started and M0/F01 remain in progress. Architect owns Design path alignment and coordinator owns skill alignment; Backend changed code/tests and permitted execution tracking only. |

### M0-05 final review acceptance — 2026-10-30

The user explicitly approved the final M0-05 organization on 2026-10-30, America/Sao_Paulo. This accepts the delivered logger and its responsibility/file-organization corrections. Implementation, technical verification and final review are complete; the evidence remains 77 passing unit tests across six files and a passing strict typecheck. M0-06 remains not started and requires an explicit start instruction; M0/F01 remain in progress. This approval update changes execution metadata only; runtime checks were not rerun. `git diff --check` passed.

### M0-06 HTTP platform evidence — 2026-10-30

The user explicitly requested continuation with backend task 06 of spec 01. This authorizes only M0-06, whose configuration, shared-envelope and logger dependencies are accepted. Added only `src/platform/http/server.ts` and its co-located `server.test.ts`; existing configuration, main, logger, dependencies and tooling are unchanged. The generic HTTP platform owns listener lifecycle and mounts supplied routers without importing feature composition or business modules.

| Check | Actual result / limit |
| --- | --- |
| TC-M0-04 · listener and health | `HttpServer({host, port, routes})` uses Express and a real Node HTTP server; `start()` and `stop()` return `Promise<void>`. It binds the supplied validated loopback host. `GET /health` returns exactly `{error:false,data:{status:"ok"}}`, even with a fallback router mounted at `/`; no business data or dependency-readiness claim is included. Routers are injected as `{prefix,router}` entries and receive parsed JSON bodies. Without injection the protected validation route is absent. |
| TC-M0-04 · lifecycle failures and cleanup | Real sockets verify repeated/concurrent start, stop before start, repeated/concurrent close, stop during pending startup, draining an active HTTP request, port release and restart. A second server on an occupied port rejects with `EADDRINUSE`, opens no listener, and can retry after release. Direct invalid listener arguments reject with `RangeError` / `ERR_SOCKET_BAD_PORT` and restore temporary listener counts. Bootstrap and acquired database resources are outside this SUT and remain M0-10. |
| Unit execution | Final `npm run test` from `apps/andromeda-backend`: **7 suites, 89 passed**, including **12 HTTP tests** and all 77 existing cases, Vitest 4.1.12 / Node.js 24.18.0. The initial sandbox run refused loopback binds with `EPERM`; approved execution outside that restriction ran the real tests successfully. No socket mock or empty-suite evidence is used. |
| Compiler/build | `npm run typecheck` and `npm run build`: **exit 0**. Strict TypeScript includes the new HTTP source/tests. The build still bundles the configuration-only `main.ts`; it does not assemble or start HTTP until M0-10. |
| Coverage | `@vitest/coverage-v8` is unavailable in the installed dependencies; no percentage is claimed and no dependency/tooling was added solely for coverage. The executed cases above establish the reported behavior. |
| Limits / next gate | HTTP platform code/checks are complete; user M0-06 review was explicitly accepted on 2026-10-30, America/Sao_Paulo. TC-M0-04 startup sequencing and resource-acquisition cleanup remain M0-10. No SQL/FGA, protected operation, authentication, provider readiness or assembled E2E behavior is claimed. Shutdown waits for active requests; no force-close timeout/SLA is introduced. M0-07 and later tasks have not started. M0/F01 remain in progress. |

### M0-06 final review acceptance — 2026-10-30

The user explicitly approved M0-06 on 2026-10-30, America/Sao_Paulo (“ok. aprovado entao”), after clarification that this task drains active HTTP requests while M0-10 owns application shutdown and acquired-resource cleanup. HTTP implementation, technical verification and user review are complete. Existing evidence remains 12 HTTP lifecycle cases and 89 total passing unit tests across seven files, plus passing strict typecheck and build. This update records approval metadata only; no runtime code changed and no tests were rerun. `git diff --check` passed. M0-07 requires an explicit start instruction and has not started; M0/F01 remain in progress.

### M0-07 PostgreSQL test infrastructure evidence — 2026-10-30

After accepting M0-06, the user explicitly authorized M0-07 (“pode ir para a 07”). Added only `src/modules/@shared/tests/testcontainers/setup-postgres.ts` and its co-located integration suite. This test-only infrastructure imports the PostgreSQL Testcontainers module and the generic database-settings type; it imports no datasource, migration, business module or ORM. Only its test imports the helper. Existing application/runtime code, dependencies and tooling are unchanged.

| Check | Actual result / limit |
| --- | --- |
| TC-M0-24 · startup/settings | `setupPostgres(definition?)` defaults to a new `PostgreSqlContainer("postgres:16-alpine")` and returns `{container,connection,teardown}` after Testcontainers readiness. Native `pg` connects using the exposed host, mapped port, credentials and database. Queries verify the selected database/user and initially empty public schema; custom builder settings are honored. Two concurrently created instances with matching database names have independent ports and SQL data. No application tables or migrations are supplied. |
| TC-M0-24 · teardown | Async `teardown()` explicitly stops/removes the container and its volumes with a 10-second Docker stop timeout; concurrent and repeated teardown resolves through the provider's idempotent stop operation. Executing against the removed container returns `No such container`. A fault-injected stop rejection remains observable and cleanup can be retried. Suites close clients and tear down containers in `afterAll`, including cleanup after partial setup. |
| TC-M0-24 · failed setup | An actual started PostgreSQL container is given an unreachable readiness-log marker and a bounded startup timeout. Setup rejects; Testcontainers 12.2.1's readiness-failure path removes the container/volumes before rethrowing. Immediate successful recreation with the same unique name verifies removal. A separate injected settings failure after real startup exercises the helper's acquired-container cleanup and preserves the original error. If that cleanup also fails, an `AggregateError` preserves both errors; the test restores the injected fault and removes its container. No mocked database is used as completion evidence. |
| Integration execution | Final `npm run test:integration -- src/modules/@shared/tests/testcontainers/setup-postgres.integration.test.ts`: **1 suite, 8 passed**, ~24 seconds, Vitest 4.1.12 / Node.js 24.18.0. Docker 29.8.0 and Testcontainers/PostgreSQL module 12.2.1. The script's `--passWithNoTests` did not hide an empty run: all eight named cases executed. Docker/socket access required approved sandbox escalation. An initial test-client mapping failure was corrected by mapping the generic `username` setting to native `pg`'s `user` option. |
| Image and cleanup inspection | Tested cached `postgres:16-alpine`, digest `postgres@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea`. Read-only Docker listing after the successful run found no test-owned containers or `andromeda-postgres-*` names. Four old containers using the same image were left untouched; inspection confirmed the old Created container dates from 2026-10-25, outside this run. |
| Compiler/build/coverage | `npm run typecheck` and `npm run build`: **exit 0**; `git diff --check` passed. Unit suites were unchanged and were not rerun; M0-06's 89-unit-test evidence remains historical. No coverage percentage is claimed because the installed Vitest coverage provider remains unavailable. The build still packages the configuration-only main entrypoint and does not include/use this test helper. |
| Limits / next gate | M0-07 is implemented and technically validated; user SQL test infrastructure review was accepted on 2026-10-30, America/Sao_Paulo. This establishes only generic disposable PostgreSQL setup. Datasource lifecycle/error translation, application migrations/schema, provider datastore, business SQL and assembled E2E remain later tasks. M0-08 has not started. M0/F01 remain in progress. |

### M0-07 final review acceptance — 2026-10-30

The user explicitly approved M0-07 on 2026-10-30, America/Sao_Paulo (“aprovado.”). Generic disposable PostgreSQL test setup, technical verification and user review are complete. Existing evidence remains eight passing real integration cases, passing strict typecheck/build and a cleanup inspection showing no test-owned containers remaining. This approval record changes metadata only; no runtime/test code changed or tests were rerun for the acceptance bookkeeping. `git diff --check` passed. The user's approval answered the coordinator's explicit question about continuing to M0-08, and therefore also authorized that next stage. Its subsequent implementation is recorded below; M0-09 has not started and M0/F01 remain in progress.

### M0-08 PostgreSQL connection lifecycle evidence — 2026-10-30

The user's M0-07 acceptance also authorized M0-08 under the preceding review question. Its dependencies M0-01/03/05/07 are accepted. Added only `src/platform/database/postgres/data-source.ts` and its co-located integration suite; application configuration, shared errors, PostgreSQL test setup, main and tooling are unchanged. Runtime code imports only TypeORM, the generic database-settings type and shared repository errors; it does not import test infrastructure or business modules.

| Check | Actual result / limit |
| --- | --- |
| TC-M0-05 · configured connection | `createDataSource(connection)` returns an uninitialized PostgreSQL TypeORM datasource with the supplied host/port/username/password/database/SSL/logging settings and explicit `synchronize:false`, `dropSchema:false`, `migrationsRun:false`. Native inspection confirms creation opens no database session. Real initialization executes SQL with the expected database/user; sequential repeated initialization returns the same datasource. A mapped test entity does not create its table, and an independently created probe table/row is preserved. |
| TC-M0-05 · close and resource cleanup | `closeDatabase(dataSource)` returns safely before initialization and after a completed close. Real PostgreSQL session inspection verifies the pool's sessions disappear after close; the same datasource can reopen and execute SQL. Invalid entity metadata after pool acquisition remains a generic failure and TypeORM releases the acquired pool, verified through `pg_stat_activity`. A fault-injected destroy rejection preserves its internal cause and safe message; restoring the fault allows cleanup retry. Test teardown closes tracked datasources, inspector and containers, including partial setup. |
| TC-M0-05 · real connection/configuration failures | A disposable instance is stopped before connecting; native `ECONNREFUSED` becomes `RepositoryUnavailableError("Database unavailable.")`. Wrong password (`28P01`), nonexistent database (`3D000`) and invalid mapping remain `RepositoryError("Database connection failed.")`; corrected connection settings permit subsequent initialization. Native causes remain attached internally and are not copied into public messages/enumerable error fields. Failed close uses safe generic `Database connection could not be closed.` unless its code is an explicit outage category. |
| Classification fault evidence | Twenty-eight injected initialization variations drive the actual public lifecycle wrapper: 15 explicit unavailable codes (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, `EHOSTUNREACH`, `ENETUNREACH`, `EPIPE`, `EAI_AGAIN`, `08000`, `08001`, `08003`, `08006`, `53300`, `57P01`, `57P02`, `57P03`); eight generic codes (authentication, missing database, constraint, SQL syntax, protocol/rejected-establishment, DNS-not-found and unknown); and five nonstandard thrown values. These prove classification behavior, not 28 real outages. Codes are matched explicitly rather than inferred from error text, an entire SQLSTATE class or unknown causes. |
| Executed checks | `npm run test:integration -- src/platform/database/postgres/data-source.integration.test.ts`: **1 suite, 38 passed**, ~6 seconds of case execution: 10 lifecycle/configuration cases using real PostgreSQL, including a close fault, plus the 28 classification variations above. Vitest 4.1.12 / Node.js 24.18.0 / TypeORM 1.1.2 / pg 8.23.1. `npm run typecheck` and `npm run build`: **exit 0**; `git diff --check` passed. Integration required approved Docker/socket sandbox escalation. Existing unit and M0-07 suites were unchanged and not rerun; their earlier results remain historical. |
| Provider basis / cleanup | Lifecycle semantics were checked against installed TypeORM 1.1.2 and [official lifecycle documentation](https://typeorm.io/docs/data-source/data-source-api/); code categories against [PostgreSQL 16 SQLSTATE definitions](https://www.postgresql.org/docs/16/errcodes-appendix.html) and [Node system errors](https://nodejs.org/api/errors.html#common-system-errors). The helper reused the M0-07 cached PostgreSQL image/digest. Read-only Docker listing after the run showed exactly the same four old containers as before; none from M0-08 remained, and no unrelated resource was removed. |
| Limits / next gate | M0-08 is implemented and technically validated; user database connection review was accepted on 2026-10-30, America/Sao_Paulo. This is connection lifecycle only: no migration runner, schema, ORM business mappings, provider setup or bootstrap is delivered. TC-M0-05 migration ordering/rollback/packaged assets remain M0-09, which has not started. The existing build still bundles the configuration-only `main.ts`; the new datasource is compiled by strict typecheck and exercised by integration, but service assembly remains M0-10. No coverage percentage is claimed without the installed Vitest coverage provider. M0/F01 remain in progress. |

### M0-08 import diagnostic and final review acceptance — 2026-10-30

The user reported “Cannot find module './data-source' or its corresponding type declarations.” Both exact-case sibling files exist. `npm run typecheck` passed, and the installed TypeScript 6.0.3 `resolveModuleName` API resolved `./data-source` from the integration test to the actual `data-source.ts`; parsed project configuration includes the test. No repository resolution defect was reproduced and no import/configuration was changed. The editor's live diagnostic state was not available; a stale editor service remains an inference rather than a verified root cause.

The user then explicitly accepted M0-08 and authorized M0-09 (“aprovado e pde seguir para a 09”) on 2026-10-30, America/Sao_Paulo. M0-08 code/technical evidence remain unchanged; its 38-case evidence is historical. This approval does not authorize M0-10 or business-schema implementation.

### M0-09 migration support evidence — 2026-10-30

M0-08 acceptance authorized this next stage. Added only `src/platform/database/postgres/{migrate,read-migration-sql}.ts`, co-located `migrate.integration.test.ts` and app-local tsup packaging changes. Test fixtures are generated under temporary directories and removed after verification; no production dummy migration or business schema was introduced. Main, datasource, shared infrastructure, dependencies and root configuration remain unchanged.

| Check | Actual result / limit |
| --- | --- |
| TC-M0-05 · ordering and rerun | `migrateDatabase(dataSource)` calls the real TypeORM runner with `transaction:"all"`. Reversed registration of two SQL-first test wrappers is applied in timestamp order; PostgreSQL rows and the migrations ledger show each once. A second run returns no pending migrations and changes neither data nor history. The runner does not initialize its datasource implicitly. |
| TC-M0-05 · rollback and safe failure | Failure in the second migration rolls back both pending migrations' DDL/data and leaves the ledger empty; replacing the test SQL permits a successful retry. Missing SQL rejects with an internal `ENOENT` cause and is not recorded as applied. An uninitialized datasource fails safely without opening a connection. Errors surface as `RepositoryError("Database migrations failed.")` with native causes retained internally and absent from enumerable output. |
| Provider logging containment | Installed TypeORM 1.1.2 emits migration failure messages even with `logging:false`. The runner temporarily derives a datasource-local logger that suppresses `logMigration`, then restores the exact original logger in `finally` on success/failure. The original logger object is not modified. The real failing-SQL case verifies no native console-log output; other configured logger operations retain their provider behavior. No general logging policy, new event producer or M0-08 configuration change was added. |
| SQL asset contract | SQL stays external. `readMigrationSql(wrapperUrl, filename)` reads source/standalone assets beside the wrapper. When tsup inlines that wrapper into the fixed `dist/main.js` entrypoint, it resolves the same file under `dist/platform/database/postgres/migrations/`. The build emits source migration wrappers as separate named entries, copies SQL into that directory and uses `splitting:false` so shared chunks cannot silently relocate the wrapper URL. The existing `clean:true` removes stale outputs before rebuilding. This contract targets the current app-local `main.js`/`dist` build layout. |
| Actual packaged execution | The integration suite creates a temporary source tree and invokes the real production `tsup.config.ts` with the app compiler configuration. A wrapper is statically imported into the fixture main and also emitted independently. Separate native Node processes execute `dist/main.js` to apply it, then execute the standalone wrapper to undo/reapply using its down/up SQL; real PostgreSQL rows/ledger validate results. SQL contents match the packaged files. Removing fixture sources and rebuilding removes stale up/down SQL and emitted wrapper. No Vite module transformation is used as built-runtime proof. |
| Executed checks | Final `npm run test:integration -- src/platform/database/postgres/migrate.integration.test.ts`: **1 suite, 6 passed**, ~16 seconds of case execution; Vitest 4.1.12 / Node.js 24.18.0 / TypeORM 1.1.2 / PostgreSQL image retained from M0-07. The first built-artifact check exposed shared-chunk URL drift; disabling splitting fixed it and the native Node checks passed. `npm run typecheck`, `npm run build` and `git diff --check`: **exit 0**. Docker/socket integration required approved sandbox escalation. Earlier stage suites were unchanged and not rerun; no coverage percentage is claimed without the installed Vitest coverage provider. |
| Cleanup / next gate | All test datasources, containers and temporary source/build fixtures were cleaned. Read-only Docker listing showed exactly the same four old containers as the pre-run baseline; none from this stage remained and none unrelated was removed. M0-09 is technically validated; user migration support review was accepted on 2026-10-30, America/Sao_Paulo. The normal build still has no production migration assets because M0-16 has not started. Startup/shutdown assembly remains M0-10, which has not started; M0/F01 remain in progress. |

### M0-09 final review acceptance — 2026-10-30

The user explicitly accepted M0-09 after the migration build-test explanation, then limited the requested action to recording the approval (“pode apenas marcar esta como aprovada”). Migration support implementation, technical verification and user review are complete. Existing evidence remains six passing PostgreSQL/build cases, passing strict typecheck/build and no test-owned resources remaining. This update records approval metadata only; no runtime code changed and no tests were rerun. `git diff --check` passed. M0-10 and later tasks have not started; M0/F01 remain in progress.


### M0-10 bootstrap support evidence — 2026-10-30

The user explicitly authorized M0-10 after M0-09 acceptance. Added `src/platform/bootstrap.ts`, co-located `bootstrap.test.ts` / `bootstrap.integration.test.ts`, `src/main.integration.test.ts` and service composition in `src/main.ts`. Existing adapters, shared contracts, configuration, root infrastructure and approved design/ADR are unchanged.

| Check | Actual result / limit |
| --- | --- |
| TC-M0-04/05 · startup ordering | `bootstrap` accepts database/HTTP lifecycle interfaces. It awaits database initialization and, when configured, migration completion before starting HTTP. Disabled boot migrations still initialize the database and allow health. The native Node test verifies `RUN_MIGRATIONS_ON_BOOT=false` creates no migration ledger. Routes are injected into the existing server; main currently supplies an empty route list, leaving the protected validation route absent. |
| TC-M0-04 · startup failure cleanup | Initialization failure attempts database cleanup without migration/HTTP. Migration failure never starts HTTP; real PostgreSQL verifies transactional rollback, empty history and released sessions. Bind failure closes attempted HTTP and then the database; real session inspection verifies no leaked connection and an occupying listener is preserved. Unit faults verify startup and all cleanup failures are retained internally in `AggregateError`; safe top-level messages contain no native detail. |
| TC-M0-04 · shutdown | Successful stop drains HTTP before closing PostgreSQL, shares concurrent/repeated stops and avoids closing resources twice. A real pending request executes SQL after stop begins and completes before the pool closes. Failed HTTP drain leaves the database available; failed database cleanup does not reopen/reclose HTTP. The returned service permits cleanup retry after either failure. |
| Native entrypoint | Main loads validated configuration, composes existing adapters and registers SIGINT/SIGTERM handlers while startup is pending. A signal waits for startup settlement, then stops the service. Native Node execution of the actual `dist/main.js` verifies both signals exit 0, release HTTP/database sessions and emit lifecycle events; failed config, credentials and bind exit 1 with safe structured capture output, no credential/driver details or stack/cause output. |
| Executed checks | `npm run test -- src/platform/bootstrap.test.ts`: **11 passed**. `npm run test`: **8 files, 100 passed**. Initial focused integration command for both new suites: **9 passed**; after adding migration-disabled process verification, `npm run test:integration -- src/main.integration.test.ts`: **6 passed**. Combined current M0-10 integration evidence: **10 distinct cases** (4 bootstrap + 6 native entrypoint). Strict `npm run typecheck` and `npm run build`: **exit 0**. Initial integration setup failed because the test inspector used `username` instead of pg's `user`; corrected test configuration passed. Docker/socket verification required approved sandbox escalation. No coverage percentage is claimed without an installed coverage provider. |
| Cleanup and limits | Test processes, listeners, pools and test-owned containers are closed by teardown, including partial failures; read-only Docker inspection confirms no M0-10 containers remain. There is no force-close timeout, SLA or automatic process-level cleanup retry if signal shutdown fails: failure is captured safely with exit code 1, while unreleased handles may keep the process alive. The bootstrap's returned `stop` allows explicit retry. Provider readiness, fixture seeds, protected route and full application E2E remain their later tasks; no manufacturing behavior or F01 acceptance criterion is validated here. |
| Review boundary | **M0-10 technically validated; user bootstrap support review accepted on 2026-10-30, America/Sao_Paulo.** M0-01–10 are accepted; M0-11 and later tasks have not started. The user limited this action to concluding M0-10 status; M0/F01 remain in progress. |


### M0-10 reusable graceful shutdown revision — 2026-10-30

During M0-10 review, the user requested a platform folder for reusable graceful shutdown logic, still invoked from main and suitable for future servers. Added `src/platform/graceful-shutdown/interfaces.ts`, `register-graceful-shutdown.ts` and co-located unit tests. `registerGracefulShutdown({shutdown, onError, signalSource?})` installs SIGINT/SIGTERM listeners, invokes the injected asynchronous callback once despite repeated signals and returns a disposer. Main supplies a callback that waits for bootstrap, stops the service and emits the existing completion event; main also owns error capture/exit status and disposes listeners if startup fails. The helper imports no HTTP, database or business contracts. Bootstrap resource ordering/retry behavior and safe output are unchanged; there is no forced timeout, server registry or automatic shutdown retry.

| Check | Actual result / limit |
| --- | --- |
| Signal lifecycle unit evidence | Nine new cases exercise both signals, registration without side effects, process listener preservation, disposal before shutdown, repeated/concurrent signals while startup/drain are pending, disposal during a pending callback, asynchronous rejection and synchronous throw. The injected error callback runs once on failure and both owned listeners are removed after settlement. Startup awareness remains in main's callback, keeping the helper generic. |
| Executed checks | Focused helper suite: **9 passed**. Full `npm run test`: **9 files, 109 passed** (20 M0-10 unit cases in total). `npm run test:integration -- src/main.integration.test.ts`: **6 passed**, including native SIGINT/SIGTERM success, migration-disabled boot and safe config/credential/bind failures. That suite ran the actual `npm run build` before launching `dist/main.js`; build passed. `npm run typecheck` and `git diff --check`: **exit 0**. The unchanged four-case bootstrap integration result remains the initial M0-10 evidence; it was not rerun for this signal-only extraction. No coverage percentage is claimed. Docker/socket verification used approved sandbox escalation. |
| Review and cleanup | Child processes, listeners, database connections and the disposable PostgreSQL container were cleaned; read-only Docker inspection shows no resources created by this revision remain. **M0-10 remains technically validated with user bootstrap support review accepted on 2026-10-30, America/Sao_Paulo.** No approved design/ADR changed, M0-11 did not start, and feature/epic delivery remains in progress. |


### M0-10 final review acceptance — 2026-10-30

The user explicitly approved the final M0-10 delivery, including the reusable graceful shutdown extraction, and requested only its status conclusion (“aprovado. pode apenas concluir o status da m10.”). M0-10 implementation, technical verification and bootstrap support review are complete and accepted on 2026-10-30, America/Sao_Paulo. Existing evidence remains 109 passing unit tests, including 20 M0-10 cases, ten distinct PostgreSQL/HTTP/native Node cases with six affected native-entrypoint cases reverified, and passing strict typecheck/build. This update changes execution/approval metadata only; no runtime code, tests, approved design contracts or ADR changed and no runtime tests were rerun. `git diff --check` passed. M0-11 and later tasks have not started; M0/F01 and epic delivery remain in progress, with business validation unchanged.


### M0-11 tenant entity evidence — 2026-10-30

After M0-10 final acceptance, the user explicitly authorized M0-11 (“pode seguir na implementacao da m11”). Added only `src/modules/tenant/entity/tenant.entity.ts`, copied exactly from the current revision-6 M0 Design contract, not the historical appendix. `TenantEntityInterface` contains required `id: string` and `code: string` fields and the approved identity/authority notes. It has no imports, methods, validation, framework or ORM dependencies.

| Check | Actual result / limit |
| --- | --- |
| TC-M0-06 · tenant contract | Exact source-to-approved-block comparison passed. App-local `npm run typecheck` (`tsc --noEmit`) exited **0**, including the new entity under strict compiler settings. This verifies only the tenant portion; actor, membership, location and machine contracts remain their later tasks. |
| Scope and limits | This pure contract adds no tenant behavior, permission logic, persistence mapping, schema or seed. Runtime tests, factories and a build were not needed for type-only code; earlier runtime-suite results remain historical. Approved design/ADR and product/business definitions are unchanged. `git diff --check` passed. |
| Review boundary | **M0-11 implemented, technically validated and user tenant entity review accepted on 2026-10-30, America/Sao_Paulo.** Acceptance authorized M0-12, recorded below; M0/F01 and epic delivery remain in progress, with business validation unchanged. |


### M0-11 review acceptance and M0-12 actor entity evidence — 2026-10-30

The user explicitly accepted M0-11 and authorized continuation (“aprovado, pode seguir”) on 2026-10-30, America/Sao_Paulo. This accepts the delivered tenant contract and opens only the next identity entity stage, M0-12; it does not authorize membership implementation.

Added only `src/modules/identity/entity/actor.entity.ts`, copied exactly from the current revision-6 M0 Design block. The contract exports `ACTOR_KIND` (human/service/agent), `ActorKind`, `ACTOR_STATUS` (active/inactive), `ActorStatus` and `ActorEntityInterface`. Its required fields are `id`, `name`, `kind`, `status`; `ownerActorId` is optional. The approved notes preserve global identity, business-only directory status and the later service/agent ownership rule without implementing domain validation or identity-provider lifecycle.

| Check | Actual result / limit |
| --- | --- |
| TC-M0-06 · actor contract | Exact source-to-current-approved-block comparison passed. App-local `npm run typecheck` (`tsc --noEmit`) exited **0** under strict settings, including the existing tenant contract and the new actor contract. This stage verifies the actor portion only; membership/location/machine contracts remain later tasks. |
| Scope and limits | No imports, methods, permissions, credentials, persistence mapping, schema, seeds, domain behavior or provider lifecycle were added. Runtime tests/factories and build were not needed for this declarative contract. Earlier runtime results remain historical. Approved design/ADR and product/business definitions are unchanged. `git diff --check` passed. |
| Review boundary | **M0-01–12 implemented, technically validated and accepted, including M0-12 identity entity and ESLint correction review on 2026-10-30, America/Sao_Paulo.** M0-13 and later tasks have not started; M0/F01 and epic delivery remain in progress, with business validation unchanged. |


### M0-12 ESLint formatting correction — 2026-10-30

During M0-12 review, the user requested ESLint because object properties such as `ACTOR_KIND` must appear on separate lines, like interfaces. At that point this was a current-stage correction; final M0-12 acceptance is recorded below, and M0-13 remains unstarted. Added backend-local `eslint.config.js`, development dependencies (`eslint` 10.13.0, `@typescript-eslint/parser` 8.72.1 and `@stylistic/eslint-plugin` 5.10.0), and `lint` / `lint:fix` scripts. Root package scripts and Turbo `lint` / uncached `lint:fix` tasks expose the commands from the workspace root. The shared `pnpm-lock.yaml` adds lint dependencies without deleting/upgrading existing entries; no secondary lockfile or root ESLint configuration was introduced.

| Check | Actual result / limit |
| --- | --- |
| Layout policy | Six focused rules enforce newlines around nonempty object expressions/interfaces/type literals (`@stylistic/object-curly-newline`), one property/member per line (`object-property-newline`), two-space `indent`, `no-trailing-spaces`, `comma-dangle: always-multiline`, and consistent TypeScript `member-delimiter-style` with final semicolons for multiline members. Empty objects remain compact. Build output, coverage and Turbo artifacts are ignored. No broad recommended lint policy was enabled. |
| Formatting and contract preservation | Autofix applied the requested layout/delimiters across affected backend source, tests and TypeScript configuration files. `ACTOR_KIND` and `ACTOR_STATUS` each have one property per line and consistent trailing commas; the complete approved actor fields/types/values/notes are preserved. TypeScript AST signatures, including identifier/literal text, matched all **44 pre-existing backend source/config files** against their captured baseline after whitespace/delimiter normalization. The current actor source is semantically equivalent to the approved contract; it is no longer a byte-for-byte copy of the compact Design example. Approved Design/ADR contract text is unchanged. |
| Rule regression evidence | Six temporary in-memory fixtures exercised the actual configured ESLint: compact actor catalog, same-line object properties, same-line interface members, same-line type-literal members, missing multiline trailing comma and missing final interface semicolon each failed the intended rule; autofixed output passed. The explicitly requested multiline actor layout passed without autofix. No permanent runtime test suite or repository fixture was added. |
| Executed checks | Backend `npm run lint:fix` and `npm run lint`: **exit 0**. Root `pnpm lint` and `pnpm lint:fix`: **exit 0**; repeated root fix left hashes of all **45 backend source/config files** unchanged, including the new ESLint configuration. App-local `npm run typecheck`: **exit 0**. `git diff --check` passed. Dependency installation used pnpm 11.22.0 and approved network escalation after sandbox DNS denial. No runtime suite or build was rerun for layout-only changes; earlier runtime results remain historical. |
| Tool basis / stage boundary | Configuration follows [ESLint flat configuration](https://eslint.org/docs/latest/use/configure/configuration-files), [TypeScript parser support](https://typescript-eslint.io/users/dependency-versions/), and maintained [object layout](https://eslint.style/rules/object-property-newline), [trailing comma](https://eslint.style/rules/comma-dangle) and [member delimiter](https://eslint.style/rules/member-delimiter-style) documentation. **M0-01–12 are technically validated and accepted, including M0-12 identity entity and ESLint correction review on 2026-10-30, America/Sao_Paulo.** M0-13 has not started; M0/F01 and epic delivery remain in progress, with business validation unchanged. |


### M0-12 final review acceptance — 2026-10-30

The user explicitly approved M0-12 and requested only its approval status update (“pode apenas marcar a 12 como aprovada. está aprovada.”). The accepted delivery includes the complete actor contract and the user-requested ESLint/property-layout correction. M0-12 implementation, technical verification and final review are complete and accepted on 2026-10-30, America/Sao_Paulo. Existing compiler, lint, fixture, idempotence and AST-preservation evidence above is unchanged. This action updates execution/approval metadata only; no source, tooling, tests, approved design contracts, ADR or business definition changed, and no runtime checks were rerun. `git diff --check` passed. M0-01–12 are technically validated and accepted; M0-13 and later tasks have not started. M0/F01 and aggregate epic delivery remain in progress, with business validation unchanged.
