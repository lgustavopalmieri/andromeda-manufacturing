# `outbound/` layer — output adapter (persistence)

> Reference for the `modular-feature-architecture` skill. Reference example:
> `src/modules/device/features/register/outbound/typeorm/`.

## 1. Core concept

`outbound/` is the **output adapter**: it implements a repository interface
declared in `application/` using a concrete technology (here, TypeORM/Postgres).
It's the end that actually talks to the outside world (database, queue, API), and
the only place in the feature that knows the details of that technology.

`outbound/typeorm/` is the TypeORM persistence adapter. The subfolder names the
technology: if we ever swap to another driver, `outbound/prisma/` is born without
touching domain/application.

## 2. Role and when to use it

Use `outbound/` to: implement `save`/`findById`/`update`... from the
`...RepositoryInterface`, convert the domain data into the ORM's format, run the
operation, and **translate technical errors** into domain errors
(`DeviceAlreadyExistsError`) or into the generic `RepositoryError`.

Don't put here: business rules (that's `domain/`), dependency assembly (that's
`wire`), column↔field mapping (that's the `EntitySchema` in `platform/`).

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

Key points:

- **`implements RegisterDeviceRepositoryInterface`**: the outbound layer fulfills
  the application's contract. It receives `RegisterDeviceOutputProps` (data already
  normalized by the domain) and returns the full `DeviceEntityInterface` (TypeORM
  fills in `id` and timestamps).
- **The dependency is TypeORM's `Repository<DeviceEntityInterface>`, injected
  through the constructor.** The one who creates this repository from the
  `EntitySchema` is the `wire` (`AppDataSource.getRepository(DeviceOrmEntity)`). The
  outbound layer knows nothing about the `DataSource` — only the generic
  `Repository`.
- **Error translation is the outbound layer's responsibility.** A Postgres
  uniqueness violation (code `23505`, detected by
  `PostgresError.isUniqueViolation`) becomes the **domain** error
  `DeviceAlreadyExistsError` — which the inbound layer maps to `409`. Any other
  failure becomes a `RepositoryError` with `{ cause: error }`, preserving the cause
  for observability while hiding the technical detail from the client (`500`).
- The technical detector (`PostgresError`) lives in `platform/` (it's infra), not in
  the feature.

## 3B. Variations (from the `create-account` feature)

`register` persists one aggregate through one repository. Richer features add two
outbound shapes — both still "implement an application port and translate infra
errors", just at a larger scope. Reference:
`modules/account/features/create-account/outbound/**`.

**Transaction spanning multiple aggregates — a transaction manager.** When a use case
must persist two aggregates atomically (account **and** owner user), the transaction
boundary is itself an outbound port: `CreateAccountTransactionInterface.run(work)`.
The `CreateAccountTransactionManager` opens a `QueryRunner` and hands the work a
`TransactionalContext` of repositories bound to the **same** `EntityManager`:

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

For this to work, the repositories accept **`DataSource | EntityManager`** in their
constructor, so the same class runs standalone (a uniqueness check outside a
transaction) or inside the transactional context. Error translation stays per repo
(uniqueness → the right domain error; else `RepositoryError`). It's tested with
**both** a unit test (fake `QueryRunner`) and an integration test (real
commit/rollback) — see `references/testing.md`.

**External-system adapter — a provider port.** An outbound adapter doesn't have to be
a database. `KeycloakIdentityProvider implements IdentityProviderInterface` adapts an
application port to an external IdP: it provisions the tenant realm + owner user, and
on partial failure runs **compensation** (delete the realm) before throwing the domain
`IdentityProviderError`. Same rules as persistence: speak the port's language,
translate the infra error into a domain error, and never leak the raw SDK error. The
usecase orchestrates the saga (provision before the local transaction; compensate if
the transaction fails); the adapter just owns the external call and its cleanup.

## 4. Interfaces and testability

The outbound layer is the one tested with an **integration test**, not a unit
test — because its value lies precisely in talking to a real database. The pattern
(see `references/testing.md`):

- File `device.repository.integration.test.ts`, run by
  `vitest.integration.config.ts` (`npm run test:integration`).
- Spins up a **real, disposable Postgres** with `@testcontainers/postgresql`
  (`postgres:16-alpine`), initializes the `DataSource`, and **runs the migrations**
  (`initializeDatabase(..., { runMigrations: true })`).
- Uses the real TypeORM repository (`dataSource.getRepository(DeviceOrmEntity)`) and
  the real domain (`DeviceRegister.create(...)`) to build the input.
- Verifies what only the database can prove: a generated numeric `id`, timestamps,
  `telemetry`'s `jsonb` round-tripping, auto-increment, persisted metadata.

The outbound layer is never tested with a mocked database: it's either a real
integration test, or it's worthless.

## 5. How to start (new feature)

1. Create `features/<feat>/outbound/<technology>/`.
2. A `<Feat><Technology>Repository implements <Feat>RepositoryInterface` class.
3. Receive the concrete client (e.g., TypeORM's `Repository<...>`) through the
   constructor.
4. Implement the methods speaking domain types in the signature; convert to the
   ORM's format internally (`repository.create(...)`).
5. Wrap the operation in `try/catch`: translate known errors (uniqueness →
   `<Feat>AlreadyExistsError`) and fall back to `RepositoryError` for the generic
   case, always with `{ cause: error }`.
6. Write the **integration** test with testcontainers.

## 6. Common mistakes (what NOT to do)

- ❌ Putting business rules in the repository. ✅ The rule belongs to `domain/`;
  the outbound layer only persists and translates technical errors.
- ❌ Letting the raw Postgres/TypeORM error bubble up. ✅ Translate it into a
  domain error or `RepositoryError` (with `cause`).
- ❌ The public signature exposing ORM types. ✅ The signature speaks domain
  (`RegisterDeviceOutputProps`/`DeviceEntityInterface`); the ORM is an internal
  detail.
- ❌ Instantiating the `DataSource`/connection here. ✅ It receives the ready-made
  `Repository` from the wire.
- ❌ Testing with a mocked database. ✅ Integration testing with testcontainers.
- ❌ Scattering error-code strings (`"23505"`). ✅ Use the `PostgresError` helper
  from `platform/`.
- ❌ A repository that only works standalone **or** only inside a transaction. ✅
  Accept `DataSource | EntityManager` so the same class serves the uniqueness check
  and the transactional `save`.
- ❌ Assuming an outbound adapter is always a database. ✅ An external system (an IdP,
  a queue, an API) is also `outbound/` — implement the port, translate errors into the
  domain, and own any compensation.
