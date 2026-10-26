# `platform/` layer — concrete infrastructure

> Reference for the `modular-feature-architecture` skill. Reference path:
> `src/platform/`. The stack (TypeORM/Postgres/Express/Pino) is the reference
> project's — **swappable**; what matters is isolating all infra here.

## 1. Core concept

`platform/` is the **concrete, business-agnostic infrastructure**: the HTTP server,
the database data-source, the ORM mapping, the migrations, the logger. It's the
technical implementation features consume through `wire`, but it **knows nothing
about business rules**.

Golden rule, inverted from the domain: if `domain/` is "business logic without a
framework", `platform/` is "framework without business logic". The only bridge is
the entity's **shape contract** (`DeviceEntityInterface`), which the ORM mapping
references to know which columns exist — but still with no business logic.

## 2. Structure

```
platform/
├── database/postgres/
│   ├── data-source.ts                 # createDataSource / initializeDatabase / AppDataSource
│   ├── errors/postgres-error.ts       # PostgresError.isUniqueViolation (code 23505)
│   ├── typeorm/entities/
│   │   └── device.orm-entity.ts       # EntitySchema<DeviceEntityInterface>
│   └── migrations/                    # SQL-first: .up.sql + .down.sql + a .ts wrapper
├── http/
│   ├── server.ts                      # HttpServer (Express)
│   └── routes/                        # api-routes, device.routes, liveness.routes
├── auth/                               # provider-neutral auth ports and errors
├── keycloak/                           # Keycloak-specific token/admin adapters
└── observability/
    └── pino-observability.ts          # implements @shared's ObservabilityInterface
```

### Technology-specific adapters

Keep capability contracts separate from provider implementations. For example,
`platform/auth/` owns a provider-neutral `TokenVerifierInterface` and generic
authentication errors, while a verifier that derives a Keycloak realm JWKS endpoint,
uses `KEYCLOAK_*` configuration, or calls the Keycloak Admin API belongs in
`platform/keycloak/`; its configuration belongs in `configs/keycloak.ts`.

The package used does not decide this boundary: a `KeycloakJwtTokenVerifier` can use
`jose` to verify the standard JWT/JWKS protocol without importing the Keycloak SDK.
It is still a Keycloak adapter when its endpoint and configuration follow Keycloak
conventions. If those conventions are removed, rename it as a generic OIDC/JWT
verifier and place it in `platform/auth/` with `configs/auth.ts`.

## 3. Database

### `data-source.ts` — the connection

```ts
export const createDataSource = (connection: DatabaseConnection): DataSource =>
  new DataSource({
    type: "postgres",
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password: connection.password,
    database: connection.database,
    ssl: connection.ssl ?? false,
    logging: connection.logging ?? false,
    synchronize: false,
    entities: [DeviceOrmEntity],
    migrations: [CreateDevices1752739200000],
  });

export const AppDataSource = createDataSource({/* from DATABASE_CONFIG */});

export const initializeDatabase = async (
  dataSource: DataSource,
  options: InitializeDatabaseOptions = {},
): Promise<DataSource> => {
  if (!dataSource.isInitialized) await dataSource.initialize();
  if (options.runMigrations ?? true) await dataSource.runMigrations();
  return dataSource;
};
```

Decisions that matter:

- **`createDataSource(connection)` is a factory**: it receives the connection as a
  parameter. This lets the integration test create a data-source pointing at the
  testcontainer's Postgres, while the app uses `AppDataSource` (built from
  `configs/database.ts`). The same function serves both worlds.
- **`synchronize: false` always.** The schema is managed by **migrations**, never by
  auto-sync. Auto-sync in production destroys data.
- **`initializeDatabase` decides whether to run migrations** via
  `options.runMigrations`. At boot, `main.ts` passes `shouldRunMigrationsOnBoot`
  (from `configs/env.ts`); in the integration test, it passes `true`.

### `device.orm-entity.ts` — the mapping (EntitySchema, not decorators)

```ts
import { EntitySchema } from "typeorm";
import type { DeviceEntityInterface } from "modules/device/entity/device.entity.js";

export const DEVICE_TABLE_NAME = "devices";

export const DeviceOrmEntity = new EntitySchema<DeviceEntityInterface>({
  name: "Device",
  tableName: DEVICE_TABLE_NAME,
  columns: {
    id: {
      type: "bigint",
      primary: true,
      generated: "increment",
      transformer: {/* bigint->number */},
    },
    plantId: { name: "plant_id", type: "uuid", nullable: true },
    name: { type: "varchar", length: 120 },
    type: { type: "varchar", length: 40 },
    telemetry: { type: "jsonb" },
    status: { type: "varchar", length: 20 },
    manufacturer: { type: "varchar", length: 120, nullable: true },
    model: { type: "varchar", length: 120, nullable: true },
    serialNumber: { name: "serial_number", type: "varchar", length: 120, nullable: true },
    createdAt: { name: "created_at", type: "timestamp with time zone", createDate: true },
    updatedAt: { name: "updated_at", type: "timestamp with time zone", updateDate: true },
    deletedAt: {
      name: "deleted_at",
      type: "timestamp with time zone",
      deleteDate: true,
      nullable: true,
    },
  },
});
```

Why **`EntitySchema` and not a decorator-based class**:

- It keeps the **business entity pure** (`entity/device.entity.ts` stays an
  `interface` with no `@Entity`/`@Column`). The ORM references that contract
  through `EntitySchema<DeviceEntityInterface>`, so TypeORM never invades the
  domain.
- The **camelCase → snake_case** mapping (`plantId`→`plant_id`) lives only here.
- `telemetry` becomes **`jsonb`** — the domain's value-object is persisted as JSON
  and round-trips (the integration test proves this).
- `id` is `bigint` in the database with a **`transformer`** to expose `number` in
  the application (bigint arrives as a string from the driver).
- `createDate`/`updateDate`/`deleteDate` let the database manage timestamps and
  the soft delete (`deleted_at`), consistent with `decommission`.

### Database errors — `postgres-error.ts`

```ts
export const POSTGRES_ERROR_CODE = { UNIQUE_VIOLATION: "23505" } as const;

export class PostgresError {
  public static isUniqueViolation(error: unknown): boolean {
    return PostgresError.codeOf(error) === POSTGRES_ERROR_CODE.UNIQUE_VIOLATION;
  }
  public static codeOf(error: unknown): string | undefined {
    /* reads error.code or error.driverError.code */
  }
}
```

Isolates reading the Postgres error code (including inside `driverError`) into an
infra helper. `outbound/` uses `PostgresError.isUniqueViolation(error)` without
knowing magic strings or the driver error's internal structure.

### Migrations — SQL-first

Each migration is **3 files** under `migrations/`:

- `<timestamp>-<Name>.up.sql` — the up DDL (plain SQL);
- `<timestamp>-<Name>.down.sql` — the rollback DDL;
- `<timestamp>-<Name>.ts` — a thin wrapper that reads its sibling `.sql` via
  `readMigrationSql` (which resolves the path through `import.meta.url`, working the
  same way in `src/` and `dist/`).

```ts
export class CreateDevices1752739200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      readMigrationSql(import.meta.url, "1752739200000-CreateDevices.up.sql"),
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      readMigrationSql(import.meta.url, "1752739200000-CreateDevices.down.sql"),
    );
  }
}
```

Why: the SQL is never locked to the ORM's syntax (you can swap runners without
losing migrations), yet TypeORM still acts as the **applier** (ordering,
transaction, the `migrations` table). Trade-off: you give up `migration:generate`
(automatic diffing) — the SQL is hand-written. If the build (`tsc`) doesn't copy the
`.sql` files to `dist/`, add a step that mirrors them. **Running migrations at boot
vs. in a dedicated step** depends on the deployment topology: a single instance can
migrate at boot (idempotent); with multiple instances, migrate in a single job
**before** bringing up the instances, to avoid a race (the decision lives in
`configs/env.ts`, e.g., `shouldRunMigrationsOnBoot`).

## 4. HTTP

### `server.ts` — the generic server

`HttpServer` receives `{ port, routes: { prefix, router }[] }`, creates an
`express()`, applies `express.json()`, registers each `router` under its `prefix`,
and exposes `start()`/`stop()`. It's **feature-agnostic**: it only mounts the
routers it's given.

### `routes/` — where the wire meets the route

```ts
// device.routes.ts
export class DeviceRouter {
  public static build(): Router {
    const router = Router();
    router.post("/", RegisterDeviceWire.provideHandler());
    return router;
  }
}

// api-routes.ts
export const buildApiRoutes = (): { prefix: string; router: Router }[] => [
  { prefix: `${API_VERSIONS.v1}/liveness`, router: LivenessRouter.build() },
  { prefix: `${API_VERSIONS.v1}/devices`, router: DeviceRouter.build() },
];
```

This is the point where `platform/` touches the feature: the route calls the
feature's wire `provideHandler()`. `buildApiRoutes()` aggregates the routers with
their versioned prefixes (`/api/v1/...`), and `main.ts` hands that to `HttpServer`.
When adding a new feature/route, register it here.

## 5. Observability

`pino-observability.ts` **implements** `@shared`'s `ObservabilityInterface` (the
contract lives in `@shared`; the concrete implementation, here). It logs the error
at `error` level with a serializer that preserves the `cause` chain. The `wire`
injects `new PinoObservability()` into the handler, but the handler only knows the
interface — you can swap Pino for another backend without touching the feature.

## 6. How to start / when to touch it

- New field/table → a new **migration** (`.up.sql` + `.down.sql` + wrapper) and an
  `EntitySchema` update.
- New feature with a route → register the wire in `routes/<module>.routes.ts` and in
  `buildApiRoutes()`.
- New infra backend (cache, queue, another logger) → implement the corresponding
  `@shared` interface here.

## 7. Common mistakes (what NOT to do)

- ❌ Putting business rules in `platform/`. ✅ It's infra only here; business logic
  belongs to `domain/`.
- ❌ Annotating the business entity with TypeORM decorators. ✅ Use `EntitySchema`
  referencing the pure interface.
- ❌ `synchronize: true`. ✅ Always migrations, `synchronize: false`.
- ❌ Writing DDL inside the migration's `.ts` file. ✅ DDL in the `.sql` files; the
  `.ts` only reads and applies them.
- ❌ Instantiating a handler/usecase in the routes. ✅ The route only calls
  `Wire.provideHandler()`.
- ❌ Reading a raw `error.code` in the outbound layer. ✅ Use `PostgresError`.
- ❌ Keeping `Keycloak...`, `Redis...`, or another named technology under a generic
  capability folder. ✅ Keep the generic port in the capability folder and the
  technology-bound adapter in `platform/<technology>/` with matching configuration.
