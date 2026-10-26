# E2E — Real Application with Testcontainers

Read [common testing rules](testing.md) first. E2E inherits the same nested describe/when/it
shape, AAA, typed makeSut, factories, public-behavior assertions and cleanup requirements.
It is a separate stage under the backend agent's explicit user-review protocol.

## 1. Scope and infrastructure

Exercise the assembled input → middleware → handler → usecase → domain → outbound →
persistence flow, including wire and route registration. Use **real disposable databases
through Testcontainers**, with production migrations and real adapters. Do not replace
repositories, usecases, middleware, authorization or the database with stubs/mocks.
Unit-test doubles remain appropriate in their own layer tests, not as E2E substitutes.

Reuse `@shared/tests/testcontainers/` setup and shared entity/input/identity factories.
Keep reusable app startup, token issuance and teardown in test-only shared support
(reference: `test/e2e/app.support.ts`); each suite's local makeSut composes that support.
For additional external integrations in the flow, provision their disposable test
instances with Testcontainers when available. Report dependencies not exercised; do not
claim validation of paths replaced by doubles. Current log publisher/DLQ placeholders
remain logs, not proof of real broker delivery (see [events](events.md)).

## 2. Environment, startup and isolation

1. Start containers and obtain mapped host/ports, database, username and password.
2. Set **all** service-specific connection/auth environment values before importing
   modules that read configs. Isolate environment/module state between suites; cached
   config imports must not retain another container's connection.
3. Dynamically import configured infrastructure, initialize the database and run migrations.
4. Assemble the real HttpServer and routes. Use createServer() with `port: 0`; supertest
   drives the app in memory without calling listen.
5. Expose app, DataSource, containers, token helpers and teardown through a typed context.
6. Isolate test data: use distinct fixtures/tenants or reset tables between cases as needed.
   Do not rely on execution order or let parallel suites share mutable fixtures/config.
7. Clean up even when setup or assertions fail: destroy initialized connections, stop
   every started container and close any opened server/other resources. Use try/finally
   so one cleanup failure cannot skip the rest. Restore changed environment when done.

### Reference bootstrap

Adapt imports and environment keys to the service. The reference uses PostgreSQL
`postgres:16-alpine` and real RS256 JWTs; assign **all remaining database environment
values** from the container before the imports, not developer/local database defaults.
All environment assignments use setEnvironment so teardown restores exactly the owned
keys, including after failed setup. Run this helper sequentially within its worker;
suites that override process.env must not share a concurrent app context.
[vi.resetModules](https://vitest.dev/api/vi.html#vi-resetmodules) permits fresh dynamic
imports; it cannot reevaluate static imports or reset mock registrations. Keep config
consumers dynamically imported and do not register mocks for the assembled E2E flow.

```ts
import { vi } from "vitest";

export const startE2EApp = async (): Promise<E2EContext> => {
  vi.resetModules();
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  let dataSource: E2EContext["dataSource"] | undefined;
  const previousEnvironment = new Map<string, string | undefined>();
  const setEnvironment = (key: string, value: string): void => {
    if (!previousEnvironment.has(key)) previousEnvironment.set(key, process.env[key]);
    process.env[key] = value;
  };
  const teardown = async (): Promise<void> => {
    const failures: unknown[] = [];
    try {
      if (dataSource?.isInitialized) await dataSource.destroy();
    } catch (error) {
      failures.push(error);
    }
    try {
      await container.stop();
    } catch (error) {
      failures.push(error);
    }
    for (const [key, value] of previousEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.resetModules();
    if (failures.length) throw new AggregateError(failures, "E2E cleanup failed");
  };

  try {
    const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });
    setEnvironment("DATABASE_HOST", container.getHost());
    // Map the remaining database keys through setEnvironment using container values.
    setEnvironment("AUTH_JWT_PUBLIC_KEY", await exportSPKI(publicKey));
    setEnvironment("AUTH_JWT_ALGORITHMS", "RS256");

    const { AppDataSource, initializeDatabase } =
      await import("platform/database/postgres/data-source");
    const { HttpServer } = await import("platform/http/server");
    const { buildApiRoutes } = await import("platform/http/routes/api-routes");

    dataSource = AppDataSource;
    await initializeDatabase(dataSource, { runMigrations: true });
    const app = new HttpServer({ port: 0, routes: buildApiRoutes() }).createServer();
    const issueToken = (roles: string[] = [], userId = "user-e2e") =>
      new SignJWT({ roles })
        .setProtectedHeader({ alg: "RS256" })
        .setSubject(userId)
        .setExpirationTime("5m")
        .sign(privateKey);

    return { app, dataSource, container, issueToken, teardown };
  } catch (error) {
    try {
      await teardown();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "E2E setup and cleanup failed", {
        cause: error,
      });
    }
    throw error;
  }
};
```

### Suite composition

Import E2EContext/startE2EApp from shared support, request from supertest, and the
relevant shared input factory/module role catalog. Helpers beyond makeSut/makeRequest
belong in shared support, not local suite utility functions.

```ts
interface MakeSutInterface extends E2EContext {
  sut: E2EContext["app"];
}

const makeSut = async (): Promise<MakeSutInterface> => {
  const context = await startE2EApp();
  return { ...context, sut: context.app };
};

describe("RegisterDevice E2E", () => {
  let context: MakeSutInterface;

  beforeAll(async () => {
    context = await makeSut();
  }, 180_000);

  afterAll(async () => {
    if (context) await context.teardown();
  });

  describe("when the caller is authorized and the input is valid", () => {
    it("should persist the device returned by the HTTP response", async () => {
      // Arrange
      const token = await context.issueToken([DEVICE_ROLES.WRITE]);
      const input = makeRegisterDeviceInput();

      // Act
      const response = await request(context.sut)
        .post("/api/v1/devices")
        .set("Authorization", `Bearer ${token}`)
        .send(input);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.error).toBe(false);
      const persisted = await context.dataSource.query(
        "SELECT id FROM devices WHERE id = $1", [response.body.data.id],
      );
      expect(persisted).toHaveLength(1);
    });
  });
});
```

## 3. Required scenario coverage

Derive cases from the product/spec and current feature, rather than only checking status
codes. Prove returned envelopes/data and persistent effects or absence of forbidden
side effects. Cover happy paths, boundaries, invalid input, relevant failures and retries/
idempotency/concurrency where specified. Exercise tenant isolation and granular permissions
through the real assembled flow; use shared factories to provision distinct organizations.

For protected routes use real signed tokens, not middleware that assigns req.identity.
Keep per-feature role-binding cases; [auth.md](auth.md#5-testing) owns the auth-specific
crypto and status matrix. [listing-queries.md](listing-queries.md#8-testing) owns filtering,
sort/search/facet assertions. E2E supplements, never replaces, each layer's own tests.

## 4. Execution and review

Use *.e2e.test.ts and vitest.e2e.config.ts, with the same aliases as other suites and
120s test/180s hook timeouts. Unit config excludes E2E. Run npm run test:e2e (adapt the
script to package.json). Docker/container failures are verification limits to report,
not a reason to replace persistence with mocks or claim success.

Record executed scenarios, results and limitations in the spec, then **stop and request
user review** before further implementation. If E2E reveals an earlier-layer defect,
follow the agent's corrective-stage approval and subsequent E2E reverification gates.

## 5. Common mistakes

- Do not point E2E at development/production databases or share a mutable container dataset.
- Do not skip migrations, mock the assembled business flow or inject authenticated identities.
- Do not import config consumers before setting environment or keep stale module config.
- Do not test only HTTP status; prove persisted outcomes and blocked side effects.
- Do not leak resources after failed setup/tests; cleanup must attempt every resource.
- Do not treat E2E coverage or passing tests as approval to implement another stage.
