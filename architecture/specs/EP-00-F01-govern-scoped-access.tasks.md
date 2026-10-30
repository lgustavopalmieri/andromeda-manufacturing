# SPEC-EP-00-F01 — Tasks

**Package revision 6 · 2026-10-30, America/Sao_Paulo · M0 Awaiting approval · implementation not started · F01 incomplete.**

[Requirements and state](EP-00-F01-govern-scoped-access.requirements.md) → [Design](EP-00-F01-govern-scoped-access.design.md) → Tasks (this document).

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

- [ ] **M0-01 — Validate runtime configuration**
  - **Area / paths:** `configs/env.ts, configs/database.ts; co-located env.test.ts`. **Depends on:** none.
  - **Deliver:** Read only required HTTP/database/validation settings; reject incomplete or invalid values without exposing secrets. OpenFGA configuration is added in M0-26a.
  - **Verify:** TC-M0-01. **Trace:** M0-R01/R05; R01. **Review:** configuration.

- [ ] **M0-02 — Define the shared HTTP response contract**
  - **Area / paths:** `modules/@shared/http/http-response.ts`. **Depends on:** none.
  - **Deliver:** Define the common success/error envelope used by later HTTP mappers.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R06; R06. **Review:** shared HTTP.

- [ ] **M0-03 — Define the shared repository failure category**
  - **Area / paths:** `modules/@shared/errors/repository.error.ts`. **Depends on:** none.
  - **Deliver:** Provide generic RepositoryError plus a recognized RepositoryUnavailableError category for known connection/outage failures; keep technical causes internal. Unknown repository failures remain generic500.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R01/R06; R04/R06. **Review:** shared errors.

- [ ] **M0-04 — Define the observability port**
  - **Area / paths:** `modules/@shared/observability/observability.ts and observability.mock.ts`. **Depends on:** none.
  - **Deliver:** Define structured event/capture operations and the test double; no concrete logger dependency.
  - **Verify:** TC-M0-02 compiler. **Trace:** M0-R07; R06. **Review:** shared observability.

- [ ] **M0-05 — Implement the structured logger adapter**
  - **Area / paths:** `platform/observability/logger.ts; logger.test.ts`. **Depends on:** M0-01, M0-04.
  - **Deliver:** Implement the observability port with Pino and safe error categories/redaction.
  - **Verify:** TC-M0-03. **Trace:** M0-R07; R06. **Review:** logger adapter.

- [ ] **M0-06 — Implement the HTTP server lifecycle**
  - **Area / paths:** `platform/http/server.ts; server.test.ts`. **Depends on:** M0-01, M0-02, M0-05.
  - **Deliver:** Start/close an injected route set on the configured loopback address; expose /health without business data.
  - **Verify:** TC-M0-04. **Trace:** M0-R01; R01. **Review:** HTTP platform.

- [ ] **M0-07 — Provide disposable PostgreSQL test setup**
  - **Area / paths:** `modules/@shared/tests/testcontainers/setup-postgres.ts`. **Depends on:** none.
  - **Deliver:** Start generic disposable PostgreSQL, expose connection settings and deterministic teardown; do not import datasource, migrations or business modules.
  - **Verify:** TC-M0-24. **Trace:** M0-R08; R01/R02. **Review:** SQL test infrastructure.

- [ ] **M0-08 — Implement the PostgreSQL connection lifecycle**
  - **Area / paths:** `platform/database/postgres/data-source.ts; data-source.integration.test.ts`. **Depends on:** M0-01, M0-03, M0-05, M0-07.
  - **Deliver:** Initialize/close a configured datasource with synchronize:false; translate connection failures.
  - **Verify:** TC-M0-05. **Trace:** M0-R01; R01/R02. **Review:** database connection.

- [ ] **M0-09 — Implement the migration runner**
  - **Area / paths:** `platform/database/postgres/migrate.ts; migrate.integration.test.ts`. **Depends on:** M0-08.
  - **Deliver:** Apply ordered SQL migrations and report failures; package migration assets for the existing tsup build.
  - **Verify:** TC-M0-05. **Trace:** M0-R01/R02; R01/R02. **Review:** migration support.

- [ ] **M0-10 — Assemble service startup and shutdown**
  - **Area / paths:** `main.ts; platform/bootstrap.ts and bootstrap.test.ts`. **Depends on:** M0-05, M0-06, M0-09.
  - **Deliver:** Initialize database/migrations before listening, stop cleanly and close acquired resources on startup failure. Routes are injected; M0-41 later adds the protected route.
  - **Verify:** TC-M0-04/05. **Trace:** M0-R01; R01. **Review:** bootstrap support.

- [ ] **M0-11 — Define the tenant contract**
  - **Area / paths:** `modules/tenant/entity/tenant.entity.ts`. **Depends on:** none.
  - **Deliver:** Copy the complete M0 tenant contract from Design; identity is stable and display code is not authority.
  - **Verify:** TC-M0-06 compiler. **Trace:** M0-R02; R02. **Review:** tenant entity.

- [ ] **M0-12 — Define the actor contract**
  - **Area / paths:** `modules/identity/entity/actor.entity.ts`. **Depends on:** none.
  - **Deliver:** Copy the complete actor contract including lifecycle/kind and optional owner; implement no identity-provider lifecycle.
  - **Verify:** TC-M0-06 compiler. **Trace:** M0-R02/R05; R03. **Review:** identity entity.

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

All cases are **planned, not executed**. Use real provider/SQL integration where stated; unit faults exercise the actual boundary implementation. Each fixture variation is isolated and versioned. No case assumes a runtime lifecycle API exists.

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
| Change boundary / whitespace | Only the four assigned architecture documents are edited in this revision; the earlier requirements filename change is preserved. No product/code/config/ADR changes; `git diff --check` passes. |

No implementation, real-provider/model, infrastructure, application or performance suite has been executed for this documentation revision. All execution cases remain planned. Revision-5 QA is historical only; M0 remains Awaiting approval/not started and F01 incomplete.

## Execution evidence

| Milestone | Implementation | Execution evidence | Next checkpoint |
| --- | --- | --- | --- |
| M0 | not started | None; no runtime suites executed for this documentation revision. | Revision 6 M0 design review. |
| M1–M7 | not started; design required | None; original product criteria retained. | Complete the relevant future design task and resolve its gates. |
