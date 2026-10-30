# `platform/` layer — concrete infrastructure

Reference: `src/platform/`. TypeORM/Postgres/Express/Pino are swappable reference choices.

## 1. Core concept

Platform is business-agnostic infrastructure: HTTP server, data-source, ORM mappings,
migrations and logger, consumed through wire. No business rules; the ORM may reference
the entity's pure shape contract (`DeviceEntityInterface`), not its behavior.

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

Separate capability contracts from providers. `platform/auth/` owns neutral
`TokenVerifierInterface`/errors; Keycloak realm JWKS endpoints, `KEYCLOAK_*` config or
Admin API calls belong in `platform/keycloak/`, configured by `configs/keycloak.ts`.
Using `jose` instead of the Keycloak SDK does not make those conventions generic.
Without provider-specific conventions, rename as a generic OIDC/JWT verifier and use
`platform/auth/` + `configs/auth.ts`.

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

- `createDataSource(connection)` accepts parameters for both testcontainer connections
  and the app datasource (configured from `loadRuntimeConfig().database`).
- Always `synchronize: false`; manage schema with migrations, never destructive auto-sync.
- `initializeDatabase` uses `options.runMigrations`: main passes
  `runtimeConfig.runMigrationsOnBoot` from `configs/runtimeconfig/load-runtime-config.ts`;
  integration tests pass `true`.

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

Use `EntitySchema<DeviceEntityInterface>`, leaving the business interface free of
`@Entity`/`@Column`. Only this mapping owns camelCase → snake_case (`plantId` → `plant_id`),
telemetry JSONB, and the `bigint` → numeric ID transformer (the driver returns a string).
`createDate`/`updateDate`/`deleteDate` manage timestamps and `deleted_at` soft deletion,
consistent with decommissioning. Integration tests prove JSONB round-tripping.

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

This infrastructure helper reads codes, including nested `driverError`.
Outbound calls `PostgresError.isUniqueViolation(error)` without driver internals/magic strings.

### Migrations — SQL-first

Each migration has three sibling files:

- `<timestamp>-<Name>.up.sql`: plain SQL DDL.
- `<timestamp>-<Name>.down.sql`: rollback DDL.
- `<timestamp>-<Name>.ts`: thin wrapper using `readMigrationSql` and `import.meta.url`
  to read SQL in both `src/` and `dist/`.

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

Hand-written SQL remains runner-independent; TypeORM applies ordering, transactions
and the migrations table. This gives up automatic `migration:generate` diffing.
If `tsc` does not copy SQL into dist, add a mirroring build step.

A single instance may run idempotent migrations at boot; multiple instances require
one migration job **before** startup to avoid races. Configure that deployment decision
in `configs/runtimeconfig/load-runtime-config.ts` (`runtimeConfig.runMigrationsOnBoot`).

## 4. HTTP

### `server.ts` — the generic server

`HttpServer({ port, routes: { prefix, router }[] })` creates Express, applies
`express.json()`, mounts supplied routers and exposes `start()`/`stop()` without feature logic.

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

Routes call feature `Wire.provideHandler()`. `buildApiRoutes()` aggregates versioned
prefixes (`/api/v1/...`); main supplies them to HttpServer. Register new routes here.

## 5. Observability

Platform `pino-observability.ts` implements shared `ObservabilityInterface`, logging
errors at error level with the cause chain preserved. Wire injects `PinoObservability`;
handlers depend only on the interface so logger changes do not affect features.

### Testing platform infrastructure

Read [common testing rules](testing.md).

- HttpServer: supertest + createServer, liveness response and stop resolution with/without start.
- PinoObservability: integration-style unit test with real Pino writing to captured
  Writable; assert emitted level 50, err.type/message, cause chain and context.
  Exercise serializer + SUT together; do not mock Pino.

For authentication infrastructure, use the [auth-specific tests](auth.md#5-testing).

## 6. How to start / when to touch it

- New field/table: migration (up SQL + down SQL + wrapper) and EntitySchema update.
- New feature route: register wire in `routes/<module>.routes.ts` and `buildApiRoutes()`.
- New cache/queue/logger backend: implement the corresponding shared interface here.

## 7. Common mistakes (what NOT to do)

- No business rules; domain owns them.
- No decorators on business entities; use EntitySchema over the pure interface.
- Never `synchronize: true`; migrations from the start.
- No DDL in migration TypeScript; read/apply sibling SQL.
- Routes call wire, never instantiate handlers/usecases.
- Use `PostgresError`, not raw `error.code`, in outbound.
- Keep named technologies (`Keycloak...`, `Redis...`) in `platform/<technology>/`
  with matching config; neutral ports stay in capability folders.
