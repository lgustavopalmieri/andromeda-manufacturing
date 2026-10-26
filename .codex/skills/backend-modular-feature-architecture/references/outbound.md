# `outbound/` layer — output adapter (persistence)

Reference: `src/modules/device/features/register/outbound/typeorm/`.

## 1. Core concept

Outbound implements application ports using concrete databases, queues or APIs; only
this feature edge knows the technology. Name the subfolder after it (`outbound/typeorm/`);
swapping to `outbound/prisma/` must not change domain/application.

## 2. Role and when to use it

Implement repository operations (`save`/`findById`/`update`), convert domain input to ORM
format and translate technical failures into domain errors or `RepositoryError`.
Keep business rules in domain, dependency assembly in wire and column mapping in
platform's `EntitySchema`.

## 3. Real example (`register`)

```ts
import type { Repository } from "typeorm";
import type { DeviceEntityInterface } from "modules/device/entity/device.entity.js";
import { RepositoryError } from "modules/@shared/errors/repository.error.js";
import { PostgresError } from "platform/database/postgres/errors/postgres-error.js";
import type { RegisterDeviceRepositoryInterface } from "../../application/interfaces.js";
import type { RegisterDeviceOutputProps } from "../../domain/types.js";
import { DeviceAlreadyExistsError } from "../../domain/errors.js";

export class RegisterDeviceTypeormRepository implements RegisterDeviceRepositoryInterface {
  constructor(private readonly repository: Repository<DeviceEntityInterface>) {}

  public async save(device: RegisterDeviceOutputProps): Promise<DeviceEntityInterface> {
    try {
      const entity = this.repository.create(device);
      return await this.repository.save(entity);
    } catch (error) {
      if (PostgresError.isUniqueViolation(error)) {
        throw new DeviceAlreadyExistsError(device.serialNumber);
      }
      throw new RepositoryError("Error when trying to save the device", { cause: error });
    }
  }
}
```

- Implement `RegisterDeviceRepositoryInterface`: accept normalized
  `RegisterDeviceOutputProps`, return full `DeviceEntityInterface` with generated
  IDs/timestamps.
- Inject TypeORM `Repository<DeviceEntityInterface>`; wire obtains it with
  `AppDataSource.getRepository(DeviceOrmEntity)`. This simple adapter knows no DataSource.
- Translate Postgres uniqueness (`23505`, detected by platform's
  `PostgresError.isUniqueViolation`) into `DeviceAlreadyExistsError` (inbound → `409`).
  Wrap other failures in `RepositoryError` with `{ cause: error }` for observability,
  while clients receive generic `500`.

## 3B. Variations (from the `create-account` feature)

Reference: `modules/account/features/create-account/outbound/**`. Both variations
implement application ports and translate infrastructure errors.

**Multi-aggregate transactions.** For atomic account + owner persistence, expose
`CreateAccountTransactionInterface.run(work)`. `CreateAccountTransactionManager` opens
a QueryRunner and supplies a `TransactionalContext` whose repositories share one EntityManager:

```ts
public async run<T>(work: (ctx: TransactionalContext) => Promise<T>): Promise<T> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const ctx: TransactionalContext = {
      accountManager: new CreateAccountTypeormRepository(queryRunner.manager),
      userManager: new CreateUserTypeormRepository(queryRunner.manager),
    };
    const result = await work(ctx);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release().catch(() => {
      throw new RepositoryError("Failed to release query runner.");
    });
  }
}
```

Repositories accept `DataSource | EntityManager` so the same class supports standalone
uniqueness checks and transactional writes. Each repository still translates its own
errors. Test the manager with both a fake-QueryRunner unit test and real commit/rollback
integration tests (see [transaction manager tests](#transaction-manager)).

**External provider.** `KeycloakIdentityProvider implements IdentityProviderInterface`
provisions realm + owner and compensates partial failure (delete realm) before throwing
`IdentityProviderError`. Never leak SDK errors. The usecase orchestrates provisioning
before the local transaction and compensation if that transaction fails; the adapter
owns external calls and their cleanup.

## 4. Interfaces and testability

Read [common testing rules](testing.md) before writing this layer's tests.

### Persistence integration

Use real disposable Postgres, migrations, repository and domain.

```ts
interface MakeSutInterface {
  sut: RegisterDeviceTypeormRepository;
  repository: Repository<DeviceEntityInterface>;
  dataSource: DataSource;
  container: StartedPostgreSqlContainer;
}

const makeSut = async (): Promise<MakeSutInterface> => {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const dataSource = await initializeDatabase(
    createDataSource({
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    }),
    { runMigrations: true },
  );
  const repository = dataSource.getRepository(DeviceOrmEntity);
  return { sut: new RegisterDeviceTypeormRepository(repository), repository, dataSource, container };
};

describe("RegisterDeviceTypeormRepository", () => {
  let context: MakeSutInterface;

  beforeAll(async () => {
    context = await makeSut();
  }, 180_000);

  afterAll(async () => {
    await context.dataSource.destroy();
    await context.container.stop();
  });

  describe("when saving a valid device", () => {
    it("should store the row with the telemetry jsonb round-tripping", async () => {
      const device = DeviceRegister.create(
        makeRegisterDeviceInput({ telemetry: makeTelemetrySource({ address }) }),
      );
      const saved = await context.sut.save(device);
      const found = await context.repository.findOneByOrFail({ id: saved.id });
      expect(found.telemetry).toEqual({ protocol: INGEST_PROTOCOL.MQTT, address });
    });
  });
});
```

Assert generated ID, Date timestamps, JSONB round-trip, auto-increment and metadata.
Always destroy DataSource and stop container in afterAll; never mock this database.

Use `vitest.integration.config.ts` / `npm run test:integration`. The reference uses
`@testcontainers/postgresql` with `postgres:16-alpine`; initialize with
`initializeDatabase(..., { runMigrations: true })` and the real TypeORM repository.

### Transaction manager

Manager owns connect → startTransaction → work(ctx) → commit; rollback on error,
release in finally. Test both:

- Real-container integration: commit/rollback visibility and shared transactional
  EntityManager; writes visible inside but not on another connection before commit.
- Unit fake QueryRunner: the manager's actual control flow, without Docker.
  **Call the SUT**, never reproduce its try/finally:

```ts
interface MakeSutInterface {
  sut: CreateAccountTransactionManager;
  queryRunner: QueryRunner;
}

const makeSut = (queryRunner = makeQueryRunner()): MakeSutInterface => {
  const dataSource = {
    createQueryRunner: vi.fn(() => queryRunner as unknown as QueryRunner),
  } as unknown as DataSource;
  return { sut: new CreateAccountTransactionManager(dataSource), queryRunner };
};

describe("CreateAccountTransactionManager", () => {
  describe("when the transactional work throws", () => {
    it("should roll back and re-throw the original error", async () => {
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
  });

  describe("when releasing the query runner fails", () => {
    it("should throw RepositoryError", async () => {
      const { sut } = makeSut(
        makeQueryRunner({
          release: vi.fn(async () => {
            throw new Error("pool exhausted");
          }),
        }),
      );
      await expect(sut.run(async () => "ok")).rejects.toThrow(RepositoryError);
    });
  });
});
```

A release throw in finally can mask the original error; prove it through the manager,
not a hand-rebuilt flow around raw QueryRunner (which only tests TypeORM).

### External-service adapters

Unit-test KeycloakIdentityProvider using mocked platform realm/user services: realm
before user; failures → domain IdentityProviderError, never raw SDK error; partial
failure → deleteRealm compensation. Best-effort deleteAccountWithOwner must not throw,
even if its steps fail. Adapter owns cleanup and infrastructure → domain translation.

## 5. How to start (new feature)

1. Create `features/<feat>/outbound/<technology>/`.
2. Define `<Feat><Technology>Repository implements <Feat>RepositoryInterface`.
3. Inject the concrete client (e.g. TypeORM `Repository<...>`).
4. Keep signatures domain-typed; convert internally (`repository.create(...)`).
5. In try/catch, map known failures (uniqueness → `<Feat>AlreadyExistsError`), otherwise
   throw `RepositoryError`, preserving `{ cause: error }`.
6. Add testcontainer integration tests.

## 6. Common mistakes (what NOT to do)

- No business rules here; persist and translate errors only.
- Never leak raw Postgres/TypeORM errors; use domain errors/`RepositoryError` with cause.
- No ORM types in public contracts; domain input/entity output only.
- Do not create DataSource/connections here; wire supplies the ready client.
- Never mock persistence; use real testcontainers.
- Do not scatter `23505`; use platform's `PostgresError` helper.
- Transaction-capable repositories must support both standalone and transactional use
  through `DataSource | EntityManager`.
- Outbound also includes IdPs, queues and APIs: implement the port, translate failures
  and own required compensation.
