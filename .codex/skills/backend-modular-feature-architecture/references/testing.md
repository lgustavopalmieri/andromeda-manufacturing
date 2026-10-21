# Testing pattern — precisely, per layer

> Reference for the `modular-feature-architecture` skill. Reference runner:
> **Vitest**. Real examples in `src/modules/device/features/register/**` and
> `src/platform/**`.

## 1. Test taxonomy

Three levels, each with its own config and command:

| Level       | File suffix             | Config                         | Command                    | Starts a database?   |
| ----------- | ----------------------- | ------------------------------ | -------------------------- | -------------------- |
| Unit        | `*.test.ts`             | `vitest.config.ts`             | `npm run test`             | No                   |
| Integration | `*.integration.test.ts` | `vitest.integration.config.ts` | `npm run test:integration` | Yes (testcontainers) |
| E2E         | `*.e2e.test.ts`         | `vitest.e2e.config.ts`         | `npm run test:e2e`         | Yes (real app)       |

The unit config **excludes** `*.integration.test.ts` and `*.e2e.test.ts`, so
`npm run test` is fast and doesn't need Docker. Integration/e2e have high timeouts
(`testTimeout: 120s`, `hookTimeout: 180s`) because of the container boot. All three
share the same **path aliases** (`modules`, `platform`, `configs`, `@shared`).

**Decision rule:** a pure layer, or one that depends only on interfaces →
**unit test** with test doubles. A layer whose value is talking to a real database
(`outbound/`) → **integration**. An end-to-end flow through the assembled app (the
`wire`) → **e2e**.

## 2. Universal conventions (every layer)

- **Co-location**: the test sits **next to** the file it tests
  (`usecase.ts` ↔ `usecase.test.ts`).
- **Nested `describe`/`it`** structure by method and by scenario: one `describe` for
  the SUT, a `describe("when success")`, and a `describe("when fails")`.
  **Authorization/role-denial is just another `when fails` case** — never a separate
  `authorization` describe. List the role-denial cases **first** in `when fails`,
  since the gate runs before the business step.
- **AAA**: every `it` follows **Arrange / Act / Assert**, one behavior per test.
  Mark the phases with `// Arrange`/`// Act`/`// Assert` comments when the setup is
  non-trivial (integration/e2e, or a unit test with several collaborators); in a
  short unit test the shape (`makeSut()` → call the SUT → `expect`) already reads as
  AAA and the comments are optional.
- **`makeSut()`**: every suite has a factory that builds the _system under test_ and
  returns `{ sut, ...collaborators }`, typed by a `MakeSutInterface`. Overrides come
  in as a parameter.
- **Stub vs. mock**: a collaborator with fixed behavior that implements an interface
  is a **stub** (a `...Stub implements ...Interface` class); a test double used to
  **verify a call** uses `vi.fn()`/`vi.spyOn`.
- **Data factories** live in `modules/@shared/tests/factories/<module>/` and are
  reused across every module, feature and test level. This includes the feature's
  **input** factory (`make<Feat>Input`) and any shared constant a scenario needs
  (e.g. the owner-role set) — never redeclare them per test file. They're grouped
  **by module** (`factories/machine/`, `factories/account/`, ...) but centralized
  under `@shared/tests/` because a test in one module routinely needs another
  module's fixture (an `operation` integration test seeds an `account` and a
  `machine`). Import them through the alias:
  `import { makeMachineEntity } from "@shared/tests/factories/machine/machine.factory"`.
  The shared testcontainer bootstrap (`@shared/tests/testcontainers/setup-postgres`)
  lives in the same area.
- **Reuse the `@shared` test doubles.** Cross-cutting collaborators ship a mock next
  to their contract: `makeObservabilityMock` (`@shared/observability`),
  `makeEventPublisherMock` (`@shared/events`), `makeHttpResponseMock` (`@shared/http`),
  `makeTokenVerifierMock` (`@shared/auth`). **Import** them — never re-declare a local
  `makeObservability`/`makeEventPublisher` inside a feature test.
- **The identity is a factory too — never hand-write it.** The authenticated identity
  comes from `makeIdentity` (`@shared/tests/factories/auth/identity.factory`); pass only
  what the scenario needs as overrides (`makeIdentity({ roles: [LOCATION_ROLES.MANAGE] })`,
  `makeIdentity({ roles: [] })` for a public endpoint). **Never** write an inline
  `{ userId, tenantId, roles, firstName }` object in a test.
- **The `makeSut()`/`makeRequest()` wrapper is the _only_ helper a test file may declare
  locally.** Everything a scenario needs already exists in the factories: the entity
  (`make<Thing>Entity`), the feature payload/input (`make<Feat>Input`), and the identity
  (`makeIdentity`). The wrapper is **test-exclusive** — it wires the SUT and, for an HTTP
  handler, builds the fake `Request` (`makeRequest(overrides)`). It must **compose** the
  factories for its data (**body/input** from `make<Feat>Input`, **identity** from
  `makeIdentity`) and **must never** redeclare the payload (a local `makeValidBody`) or an
  inline identity. The wrapper wires; the factories supply the data.

### The data factories (`@shared/tests/factories/<module>/`)

```ts
// @shared/tests/factories/device/device.factory.ts
export const makeTelemetrySource = (overrides: Partial<TelemetrySource> = {}): TelemetrySource => ({
  protocol: INGEST_PROTOCOL.MQTT,
  address: "andromeda/plants/plant-01/devices/gateway-01/telemetry",
  ...overrides,
});

export const makeDeviceEntity = (
  overrides: Partial<DeviceEntityInterface> = {},
): DeviceEntityInterface => ({
  id: 1,
  name: "Gateway 01",
  type: DEVICE_TYPE.GATEWAY,
  telemetry: makeTelemetrySource(),
  status: DEVICE_STATUS.ACTIVE,
  createdAt: new Date("2026-07-16T00:00:00.000Z"),
  updatedAt: new Date("2026-07-16T00:00:00.000Z"),
  ...overrides,
});

// @shared/tests/factories/device/register.factory.ts
export const makeRegisterDeviceInput = (
  overrides: Partial<RegisterDeviceInputProps> = {},
): RegisterDeviceInputProps => {
  const { name, type, telemetry } = makeDeviceEntity();
  return { name, type, telemetry, ...overrides };
};
```

The **`make<Thing>(overrides = {})`** pattern: a valid default + spreading
overrides at the end. The test only declares what matters for the scenario
(`makeRegisterDeviceInput({ name: "   " })`), the rest stays consistent. They live
under `@shared/tests/factories/<module>/` (grouped by module, not by feature),
because `makeDeviceEntity` serves register, find, update, and so on — and other
modules reuse it whenever they need a device fixture (which is exactly why the
factories sit in `@shared/tests/` instead of inside the module).

## 3. Pattern per layer

### `entity/` — no test

They're just types; the **compiler** (`tsc`, `strict`) is the test. Don't write a
runtime test for an interface.

### `domain/` — pure unit test (the most valuable one)

The SUT is the static class itself. No mocks, no async. Covers **every success
path** and **every domain error** (class + message).

```ts
const makeSut = (): MakeSutInterface => ({ sut: DeviceRegister });

it('should register a device with only the required fields, defaulting status to "active"', () => {
  const { sut } = makeSut();
  const input = makeRegisterDeviceInput();

  const result = sut.create(input);

  expect(result).toEqual({
    name: "Gateway 01",
    type: DEVICE_TYPE.GATEWAY,
    telemetry: { protocol: INGEST_PROTOCOL.MQTT, address: "..." },
    status: DEVICE_STATUS.ACTIVE,
  });
});

it("should throw DeviceNameRequiredError when name is only whitespace", () => {
  const { sut } = makeSut();
  const input = makeRegisterDeviceInput({ name: "   " });

  expect(() => sut.create(input)).toThrow(DeviceNameRequiredError);
  expect(() => sut.create(input)).toThrow("Device name is required.");
});
```

**Assert:** the canonical output (trim, default, omission of blank optionals), and,
for errors, **both the class AND the message**.

### `application/` (usecase) — unit test with a repository stub

Injects a `...RepositoryStub implements ...RepositoryInterface`; uses `vi.spyOn` to
verify the **collaboration**. Since the usecase extends `AuthorizedUsecase`, tests go
through `execute(input, identity)` and the shared `makeIdentity` factory
(`@shared/tests/factories/auth/identity.factory`) supplies the identity — the suite
**imports** it, it never redeclares one.

```ts
class RegisterDeviceRepositoryStub implements RegisterDeviceRepositoryInterface {
  savedDevice: DeviceEntityInterface = makeDeviceEntity();
  save = async (_d: RegisterDeviceOutputProps): Promise<DeviceEntityInterface> => this.savedDevice;
}

// makeRegisterDeviceInput and makeIdentity are imported from @shared/tests/factories/*;
// the suite never redeclares the input or the identity.

const makeSut = (overrides: Partial<RegisterDeviceRepositoryStub> = {}): MakeSutInterface => {
  const repository = Object.assign(new RegisterDeviceRepositoryStub(), overrides);
  const eventPublisher = makeEventPublisherMock();
  return { sut: new RegisterDeviceUsecase(repository, eventPublisher), repository, eventPublisher };
};

describe("when success", () => {
  it("should hand the repository the device normalized by the domain", async () => {
    const { sut, repository } = makeSut();
    const saveSpy = vi.spyOn(repository, "save");
    await sut.execute(
      makeRegisterDeviceInput({ name: "  Gateway 02  " }),
      makeIdentity({ roles: [DEVICE_ROLES.WRITE] }),
    );
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ name: "Gateway 02" }));
  });

  it("should publish a DeviceRegisteredEvent with the persisted device as payload", async () => {
    const persisted = makeDeviceEntity({ id: 3, name: "Gateway 03" });
    const { sut, eventPublisher } = makeSut({ savedDevice: persisted });

    await sut.execute(
      makeRegisterDeviceInput({ name: "Gateway 03" }),
      makeIdentity({ roles: [DEVICE_ROLES.WRITE] }),
    );

    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(DeviceRegisteredEvent));
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: "device.registered", payload: persisted }),
    );
  });
});

describe("when fails", () => {
  it("should throw InsufficientRolesError and not touch the repository without the role", async () => {
    const { sut, repository, eventPublisher } = makeSut();
    const saveSpy = vi.spyOn(repository, "save");
    await expect(
      sut.execute(makeRegisterDeviceInput(), makeIdentity({ roles: [DEVICE_ROLES.READ] })),
    ).rejects.toBeInstanceOf(InsufficientRolesError);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it("should propagate the domain error and not call the repository when input is invalid", async () => {
    const { sut, repository, eventPublisher } = makeSut();
    const saveSpy = vi.spyOn(repository, "save");
    await expect(
      sut.execute(
        makeRegisterDeviceInput({ name: "   " }),
        makeIdentity({ roles: [DEVICE_ROLES.WRITE] }),
      ),
    ).rejects.toThrow(DeviceNameRequiredError);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
```

**Assert:** the **role gate** (denies without the feature's role, and `save` is never
called — proving the gate runs first); that the domain was applied before persisting;
that a domain error **aborts** the `save`; that a repository error (`mockRejectedValue`)
**propagates**; and, whenever the usecase publishes an event, that failure paths
**never** call `eventPublisher.publish`. Role-denial lives under `when fails`
alongside the domain/repository failures — not a separate `authorization` describe.
`Object.assign(new Stub(), overrides)` lets you swap `savedDevice`/behavior per test.

**Asserting a published event — never cast the mock's captured argument.** The
temptation is to pull the event out of `vi.mocked(eventPublisher.publish).mock
.calls[0][0]` and cast it with `as DeviceRegisteredEvent` to inspect it. Don't: the
port's signature (`publish(event: DomainEventInterface)`) is intentionally generic,
so TypeScript can never narrow that captured argument to the concrete event class —
casting only silences the compiler, it doesn't test anything more. Use `toHaveBeenCalledWith`
with **asymmetric matchers** instead, exactly like the `should publish a
DeviceRegisteredEvent...` test above: `expect.any(DeviceRegisteredEvent)` proves the
concrete type (replaces `toBeInstanceOf`), `expect.objectContaining({ name, payload })`
proves the contents (and ignores `occurredAt`, which is non-deterministic and was
never comparable by `toEqual` anyway). Zero casts, zero intermediate variables.

### `inbound/http/` handler — unit test with Express + supertest

Builds a real `express()` with the handler, injects a `UsecaseStub implements
Authorized...UsecaseInterface` + an observability mock, wires a short middleware that
sets `req.identity`, and fires requests with `supertest`.

```ts
const makeSut = (
  overrides: Partial<UsecaseStub> = {},
  identity: AuthenticatedIdentity | null = makeIdentity(),
): MakeSutInterface => {
  const usecase = Object.assign(new UsecaseStub(), overrides);
  const observability = makeObservabilityMock();
  const handler = new RegisterDeviceHandler(usecase, observability);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (identity) req.identity = identity;
    next();
  });
  app.post("/devices", handler.handle.bind(handler));
  return { app, usecase, observability };
};

it("should return 401 when the request has no authenticated identity", async () => {
  const { app } = makeSut({}, null);
  const res = await request(app).post("/devices").send(makeRegisterDeviceInput());
  expect(res.status).toBe(401);
});

it("should return 422 with the domain error message", async () => {
  const { app, usecase } = makeSut();
  vi.spyOn(usecase, "execute").mockRejectedValue(new DeviceNameRequiredError());
  const res = await request(app).post("/devices").send(makeRegisterDeviceInput());
  expect(res.status).toBe(422);
  expect(res.body).toEqual({ error: true, message: "Device name is required." });
});
```

**Assert:** status + envelope on success (`201`), `401` with no identity, and every
error mapping (`422`/`409`/`403`/`500`); that `observability.capture` received the
error. No database is started — the usecase is a stub.

### `inbound/http/` response-mapper — unit test with a mocked `Response`

Tests the mapping in isolation, with no Express and no real HTTP.

```ts
const makeSut = (): MakeSutInterface => {
  const res = makeHttpResponseMock();
  return { sut: new RegisterDeviceHttpResponse(res), res };
};

it("should call res with status 409 and the domain error message", () => {
  const { sut, res } = makeSut();
  sut.mapError(new DeviceAlreadyExistsError("SN-123456"));
  expect(res.status).toHaveBeenCalledWith(409);
  expect(res.json).toHaveBeenCalledWith({ error: true, message: "...already registered." });
});
```

**Assert:** each branch of `mapError` (in specific→generic order) and `success`.
`makeHttpResponseMock` returns a `Response` with `status`/`json` as chainable
`vi.fn()`.

### `outbound/typeorm/` — integration test with testcontainers

Spins up a real, disposable Postgres; runs the migrations; uses the real repository
and the real domain.

```ts
beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  dataSource = await initializeDatabase(
    createDataSource({
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    }),
    { runMigrations: true },
  );
  repository = dataSource.getRepository(DeviceOrmEntity);
  sut = new RegisterDeviceTypeormRepository(repository);
}, 180_000);

afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
  if (container) await container.stop();
});

it("should store the row with the telemetry jsonb round-tripping", async () => {
  const device = DeviceRegister.create(
    makeRegisterDeviceInput({ telemetry: makeTelemetrySource({ address }) }),
  );
  const saved = await sut.save(device);
  const found = await repository.findOneByOrFail({ id: saved.id });
  expect(found.telemetry).toEqual({ protocol: INGEST_PROTOCOL.MQTT, address });
});
```

**Assert:** what only the database can prove — a generated `id`, `Date` timestamps,
`jsonb` round-tripping, auto-increment, persisted metadata. **Always** clean up in
`afterAll` (`destroy` + `stop`). Never mock the database here.

### `platform/` — tests depending on the piece

- **HttpServer**: `supertest` against `createServer()`, verifying that a route
  (liveness) responds and that `stop()` resolves with/without a started server.
- **PinoObservability**: an _integration-style_ test that injects a `pino` instance
  writing into a captured `Writable` and asserts the **actual emitted record**
  (level `50`, `err.type`/`message`, the `cause` chain, context fields). Proves the
  serializer + the SUT together, without mocking pino.

### `wire` — no unit test

It only calls `new`. It's covered by the **e2e** test (the real app exercises the
assembled graph). The layers it wires together have already been tested in
isolation.

## 4. Advanced patterns — rich features (the `create-account` reference)

`device/register` is a single-aggregate, single-repository, role-guarded feature.
When a feature does more — a **saga** across two aggregates in one transaction, an
**external identity provider**, a **transaction manager**, an **event consumer**, or
a **public endpoint** — the same conventions hold, with the extra shapes below.
Reference: `modules/account/features/create-account/**`.

### `application/` — multi-step usecase (saga + transaction + external port)

The `create-account` usecase validates the owner, checks uniqueness, provisions the
tenant in Keycloak (**external port**, _before_ the local transaction), persists
account + owner in a **single transaction**, publishes an event, and **compensates**
(deletes the Keycloak realm/user) if the transaction fails.

`makeSut` takes an **options object** (not a single stub) and exposes **every**
collaborator — including the repositories handed to the work callback _inside_ the
transaction — so tests can assert what was persisted transactionally:

```ts
const makeSut = (options: MakeSutOptions = {}): MakeSutInterface => {
  const accountRepo = options.accountRepo ?? makeAccountRepo();
  const userRepo = options.userRepo ?? makeUserRepo();
  const identityProvider = options.identityProvider ?? makeIdentityProvider();
  const eventPublisher = options.eventPublisher ?? makeEventPublisherMock(); // @shared mock
  const ctxAccountManager = options.ctxAccountManager ?? makeAccountRepo();
  const ctxUserManager = options.ctxUserManager ?? makeUserRepo();

  // the transaction mock runs the work with the ctx repos we can spy on
  const transaction: CreateAccountTransactionInterface = options.transaction ?? {
    run: vi.fn(async (work: (ctx: TransactionalContext) => Promise<unknown>) =>
      work({ accountManager: ctxAccountManager, userManager: ctxUserManager }),
    ) as CreateAccountTransactionInterface["run"],
  };

  const sut = new CreateAccountUsecase(
    accountRepo,
    userRepo,
    identityProvider,
    eventPublisher,
    transaction,
  );
  return {
    sut,
    accountRepo,
    userRepo,
    identityProvider,
    eventPublisher,
    transaction,
    ctxAccountManager,
    ctxUserManager,
  };
};
```

What the suite covers **beyond** the single-repo case:

- **Order across steps** (`when success`): the external provider is called **before**
  the transaction (`expect(order).toEqual(["identity", "transaction"])`), and the
  event is published **after** commit with the persisted ids.
- **Normalization flows through** the whole chain: feed `slug: "ACME-CORP"` and assert
  the IdP **and** the transactional `save` both receive `"acme-corp"`.
- **Compensation** (`when fails`): when `transaction.run` rejects, the usecase calls
  `identityProvider.deleteAccountWithOwner(provisionedId, slug)` and **re-throws the
  original error** — and still re-throws even when the compensation itself throws.
- **Not published on _any_ failure path**: assert `eventPublisher.publish` was **not**
  called for the uniqueness conflict, the IdP failure, **and** the transaction
  failure — one assertion per failure `it`.
- **Domain-abort ordering**: an invalid owner (`email: "not-an-email"`) rejects with
  the domain error and touches **nothing** — not even the uniqueness reads
  (`existsBySlug`), proving `validateOwner` runs first.

### `application/` — a public endpoint (no role required)

When `authorization.ts` declares `<FEAT>_ALLOWED_ROLES = []`, `AccessControl` lets any
identity through (`allowedRoles.length === 0 → true`). There's **no** role-denial
`when fails` case — instead **lock the public contract** with a `when success` test:

```ts
it("should allow an identity without any roles when create-account is a public endpoint", async () => {
  const { sut, identityProvider } = makeSut();
  await expect(
    sut.execute(makeCreateAccountInput(), makeIdentity({ roles: [] })),
  ).resolves.toBeDefined();
  expect(identityProvider.createAccountWithOwner).toHaveBeenCalledTimes(1);
});
```

Without this test, someone could later add a role to `allowedRoles` and silently
break public registration with nothing turning red.

### `outbound/` — transaction manager (unit test with a fake `QueryRunner`)

`CreateAccountTransactionManager.run(work)` owns a real DB transaction
(`connect → startTransaction → work(ctx) → commit`, `rollback` on throw, `release` in
`finally`). It's tested **twice**:

- **Integration** (real container): proves commit/rollback visibility and that the ctx
  repos share the same transactional `EntityManager` (a write is visible inside the
  transaction, but invisible to an outside connection before commit).
- **Unit** (fake `QueryRunner`): proves the manager's own control flow, cheaply, with
  no Docker. **Drive the SUT** — never reconstruct the try/finally by hand:

```ts
const makeSut = (queryRunner = makeQueryRunner()) => {
  const dataSource = {
    createQueryRunner: vi.fn(() => queryRunner as unknown as QueryRunner),
  } as unknown as DataSource;
  return { sut: new CreateAccountTransactionManager(dataSource), queryRunner };
};

it("should roll back and re-throw the original error when the work throws", async () => {
  const workError = new Error("work failed");
  const { sut, queryRunner } = makeSut();
  await expect(
    sut.run(async () => {
      throw workError;
    }),
  ).rejects.toThrow(workError);
  expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
  expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
});

it("should throw RepositoryError when releasing the query runner fails", async () => {
  const { sut } = makeSut(
    makeQueryRunner({
      release: vi.fn(async () => {
        throw new Error("pool exhausted");
      }),
    }),
  );
  await expect(sut.run(async () => "ok")).rejects.toThrow(RepositoryError);
});
```

The last case documents a real edge — a throw from the `finally` **masks** the
original error — which only a test that runs **through the SUT** can prove. A test
that rebuilds the `try/finally` around a raw `queryRunner` tests TypeORM, not your
manager, and is worthless.

### `outbound/` — external-service adapter with compensation

An outbound adapter doesn't have to be a database. `KeycloakIdentityProvider
implements IdentityProviderInterface` adapts an application port to an external IdP.
Its **unit** test mocks the `platform/` services (realm/user) and asserts: the call
**order** (realm before user), that any failure is translated into the **domain**
`IdentityProviderError` (never the raw SDK error), and that a partial failure triggers
**compensation** (`deleteRealm`). The best-effort `deleteAccountWithOwner` must **not**
throw even when its own steps fail. Same principle as persistence outbound: translate
infra → domain, own the cleanup, never let the raw error escape.

### `inbound/events/` — event consumer (listener)

The counterpart of publishing (`references/events.md`): a listener in **another**
module reacts to the event. `AccountCreatedListener implements EventHandlerInterface`
generates a set-password token, persists its **hash**, and emails the owner. Unit test
with collaborator mocks + `makeObservabilityMock`:

- `when success`: each collaborator is called with the right data; assert the **hash**
  is persisted, **never the raw token**; the email carries the link with the raw token.
- `when fails`: any failing step is **captured** via observability **and re-thrown**
  (so the transport can retry / DLQ), and later steps **don't run** (a
  token-generation failure never sends the email). One behavior per `it`.

## 5. Summary matrix

| Layer               | Level                    | SUT                | Test doubles                    | Assertion focus                                                                      |
| ------------------- | ------------------------ | ------------------ | ------------------------------- | ------------------------------------------------------------------------------------ |
| entity              | —                        | —                  | —                               | compiler                                                                             |
| domain              | unit                     | static class       | none                            | canonical output + error class/message                                               |
| application         | unit                     | usecase            | RepositoryStub + spy            | role gate; orchestration; abort on error; propagate                                  |
| inbound handler     | unit                     | Express+handler    | UsecaseStub + obs mock          | identity → status/envelope + capture                                                 |
| inbound mapper      | unit                     | mapper             | Response mock                   | each error→status branch                                                             |
| outbound            | integration              | real repository    | Postgres (testcontainers)       | real persistence / jsonb / id                                                        |
| application (saga)  | unit                     | multi-step usecase | repo stubs + IdP/tx/event mocks | step order; normalization flow; compensation; event **not** published on any failure |
| outbound tx manager | unit                     | transaction mgr    | fake `QueryRunner`              | commit / rollback+rethrow / always release / release-failure masking                 |
| outbound tx manager | integration              | transaction mgr    | Postgres (testcontainers)       | commit & rollback visibility; shared `EntityManager`                                 |
| outbound ext. port  | unit                     | IdP adapter        | platform service mocks          | call order; infra error → domain error; compensation                                 |
| inbound events      | unit                     | listener           | collaborator + obs mocks        | side effects on success; capture + re-throw; no later step on failure                |
| platform http       | unit                     | HttpServer         | supertest                       | route responds; stop resolves                                                        |
| platform obs        | unit (integration-style) | PinoObservability  | captured stream                 | actual record emitted                                                                |
| wire                | e2e                      | assembled app      | —                               | end-to-end flow                                                                      |

## 6. Common mistakes (what NOT to do)

- ❌ Mocking the database in the `outbound/` test. ✅ Real integration testing with
  testcontainers.
- ❌ Spinning up Postgres to test `domain/`/`application/`. ✅ Pure/stub, unit
  testing.
- ❌ Testing internal detail (private methods). ✅ Test the public behavior
  (input→output, calls to the collaborator through the interface).
- ❌ Duplicating test data by hand in every file. ✅ Use the
  `@shared/tests/factories/<module>/` factories.
- ❌ Asserting only the error's class. ✅ Assert **both class and message** (the
  message is a contract with the client).
- ❌ Naming an integration test `*.test.ts`. ✅ `*.integration.test.ts`, or it will
  run under `npm run test` and fail for lack of Docker.
- ❌ Forgetting `destroy()`/`stop()` in `afterAll`. ✅ Always release the container
  and the connection.
- ❌ A handler with no `.bind(handler)` on the test route. ✅ Always `bind` (`this`
  gets lost otherwise).
- ❌ Extracting a mocked call's argument with `vi.mocked(fn).mock.calls[0][0] as
ConcreteEvent` to inspect a published event. ✅
  `toHaveBeenCalledWith(expect.any(ConcreteEvent))` +
  `toHaveBeenCalledWith(expect.objectContaining({ name, payload }))` — no cast, no
  intermediate variable (see §3, `application/`).
- ❌ Re-declaring a local `makeObservability`/`makeEventPublisher`/`makeHttpResponse`
  in the feature test. ✅ Import the shared mock from `@shared` (`makeObservabilityMock`,
  `makeEventPublisherMock`, `makeHttpResponseMock`).
- ❌ Re-declaring the feature input or a shared constant (owner roles, etc.) by hand in
  each file. ✅ Put `make<Feat>Input` and the constant in
  `@shared/tests/factories/<module>/` and import them.
- ❌ Redeclaring the request payload (a local `makeValidBody`) or hand-writing an inline
  `{ userId, tenantId, roles, ... }` identity in an inbound (or any) test. ✅ The body
  comes from `make<Feat>Input` and the identity from `makeIdentity`
  (`@shared/tests/factories/auth/identity.factory`) — both already exist. The **only**
  local helper is the `makeSut`/`makeRequest` wrapper, and it **composes** those factories
  instead of duplicating the data.
- ❌ Re-creating a factory folder inside the module (`modules/<module>/@testing/`). ✅
  All data factories now live centralized under `@shared/tests/factories/<module>/`.
- ❌ Writing a test that **reconstructs the SUT's control flow by hand** (e.g. driving a
  raw `queryRunner` through your own try/finally) — it proves nothing about the SUT. ✅
  Always call the SUT (`sut.run(work)`) and force the branch with a fake collaborator.
- ❌ Treating a public endpoint (`allowedRoles = []`) as "no auth test needed". ✅ A
  `when success` case proving an identity **with no roles** is allowed, to lock the
  public contract.
- ❌ For a saga/multi-step usecase, asserting only the happy path. ✅ Assert
  **compensation** on partial failure and that the event is **never** published on
  **any** failure path.
