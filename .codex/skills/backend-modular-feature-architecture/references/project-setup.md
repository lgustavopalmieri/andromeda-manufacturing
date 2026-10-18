# Setting up a brand-new microservice

> Reference for the `modular-feature-architecture` skill. Use this when **starting
> a new project**. The examples come from the reference project; adapt the names
> and the stack to your own service. After this setup, follow Workflow B in
> `SKILL.md` for the first feature.

## 1. Core concept

Before any business module, a service in this architecture needs a **skeleton**
that guarantees ESM + strict TypeScript + path aliases + the three test levels, and
a handful of **agnostic base pieces** in `platform/` and `@shared/` that every
feature will reuse (HTTP envelope, observability contract, repository error,
data-source, HTTP server). Once this is assembled once, new features only add
folders.

## 2. Prerequisites and dependencies

- **Node.js 22+** (for ESM `nodenext` and recent features).
- The reference project's typical runtime: an HTTP framework (Express), an ORM
  (TypeORM), a database driver (pg), and a logger (Pino). **All swappable** — the
  architecture isolates them in `platform/`/`outbound/`.
- Dev: `typescript`, `tsx` (dev/CLI runner), `vitest`, `supertest`,
  `@testcontainers/<engine>`, and the `@types/*` packages.

```bash
npm i express pg pino typeorm
npm i -D typescript tsx vitest supertest @testcontainers/postgresql \
        @types/node @types/express @types/supertest @types/pg
```

## 3. `package.json` (ESM + scripts)

The critical point is **`"type": "module"`**. The scripts standardize the three
test levels.

```jsonc
{
  "name": "<service-name>",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "NODE_ENV=development tsx watch src/main.ts",
    "build": "tsc && node scripts/copy-migrations-sql.mjs",
    "start": "NODE_ENV=production node dist/main.js",
    "test": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "migration:run": "tsx ./node_modules/typeorm/cli.js migration:run -d src/platform/database/postgres/data-source.ts",
  },
}
```

## 4. `tsconfig.json` (nodenext + strict + aliases)

```jsonc
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "es2024",
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "modules/*": ["./src/modules/*"],
      "platform/*": ["./src/platform/*"],
      "configs/*": ["./src/configs/*"],
      "@shared/*": ["./src/modules/@shared/*"],
    },
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"],
}
```

Why these flags matter:

- **`nodenext`** requires the **`.js`** extension on relative/aliased imports (even
  in `.ts` files). It's the rule that trips up beginners the most.
- **`strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`** push the
  code toward the domain's standard: optionals **omitted** instead of `undefined`,
  checked index access.
- **`paths`** enable the `modules/`, `platform/`, `configs/`, `@shared/` aliases.

## 5. Test configs (unit / integration / e2e)

Three files, each with the **same aliases** (the runner needs to resolve them; the
`tsconfig` alone isn't enough). The unit one **excludes** integration and e2e to
stay fast and not require Docker.

```ts
// vitest.config.ts  (unit)
import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      modules: path.resolve(__dirname, "./src/modules"),
      platform: path.resolve(__dirname, "./src/platform"),
      configs: path.resolve(__dirname, "./src/configs"),
      "@shared": path.resolve(__dirname, "./src/modules/@shared"),
    },
  },
  test: {
    exclude: [
      ...configDefaults.exclude,
      "**/dist/**",
      "**/*.integration.test.ts",
      "**/*.e2e.test.ts",
    ],
  },
});
```

```ts
// vitest.integration.config.ts  (same aliases; integration only; high timeouts)
export default defineConfig({
  resolve: { alias: {/* same */} },
  test: {
    include: ["**/*.integration.test.ts"],
    exclude: [...configDefaults.exclude, "**/dist/**"],
    testTimeout: 120_000,
    hookTimeout: 180_000,
  },
});
```

`vitest.e2e.config.ts` is the same as the integration one, swapping `include` for
`**/*.e2e.test.ts`. Details for each level are in `references/testing.md`.

## 6. Initial folder skeleton

```
src/
├── configs/            # env.ts, database.ts, api-versions.ts
├── main.ts             # bootstrap
├── platform/
│   ├── database/<engine>/   # data-source, orm-entity(ies), migrations, errors
│   ├── http/                # server.ts, routes/
│   └── observability/       # concrete logger
└── modules/
    └── @shared/
        ├── errors/          # repository.error.ts
        ├── http/            # http-response.ts (+ .mock.ts)
        └── observability/   # observability.ts (+ .mock.ts, composite)
```

Still **no business module** — that comes in Workflow B.

## 7. Base pieces to create first

These are business-agnostic and underpin every feature. Each has detail in its own
reference file:

1. **`@shared/http/http-response.ts`** — the abstract envelope base
   (`{ error:false, data }` / `{ error:true, message }`). → `references/shared.md`
2. **`@shared/observability/observability.ts`** — `ObservabilityInterface` (the
   contract) + `*.mock.ts`. → `references/shared.md`
3. **`@shared/errors/repository.error.ts`** — the generic `RepositoryError`.
   → `references/shared.md`
4. **`platform/observability/<logger>.ts`** — the interface's concrete
   implementation. → `references/platform.md`
5. **`platform/database/<engine>/data-source.ts`** — `createDataSource(connection)`
   (factory) + `initializeDatabase(ds, { runMigrations })` + `AppDataSource`.
   → `references/platform.md`
6. **`platform/http/server.ts`** — a generic `HttpServer` that receives
   `{ port, routes }` and starts the web framework. → `references/platform.md`
7. **`configs/`** — `env.ts` (reads `process.env`, derives flags), `database.ts`
   (credentials), `api-versions.ts` (versioned prefixes).

### `main.ts` — the bootstrap

```ts
import { HttpServer } from "platform/http/server.js";
import { buildApiRoutes } from "platform/http/routes/api-routes.js";
import { shouldRunMigrationsOnBoot } from "configs/env.js";
import { AppDataSource, initializeDatabase } from "platform/database/postgres/data-source.js";

const bootstrap = async (): Promise<void> => {
  await initializeDatabase(AppDataSource, { runMigrations: shouldRunMigrationsOnBoot });
  const httpServer = new HttpServer({
    port: Number(process.env.PORT ?? 3000),
    routes: buildApiRoutes(),
  });
  httpServer.start();
};

bootstrap().catch((error) => {
  console.error("Failed to start the application", error);
  process.exit(1);
});
```

`main.ts` is the only place that **connects infra and routes**: it initializes the
database (deciding whether to run migrations based on the topology — see
`references/platform.md`), assembles the server with the aggregated routes, and
starts it. Routes call the features' `wire`s.

## 8. Recommended bootstrap order

1. `package.json` + `tsconfig.json` + test configs.
2. Folder skeleton (section 6).
3. Base pieces (section 7), in this order: `@shared/` → `platform/` → `configs/` →
   `main.ts` (with a liveness route to validate the boot).
4. First module + first feature (Workflow B in `SKILL.md`).
5. Run `npm run test` (should pass empty/liveness) and start `npm run dev`.

## 9. Common mistakes (what NOT to do)

- ❌ Forgetting `"type": "module"` or adding `.js` extensions to imports. ✅ With
  `moduleResolution: "Bundler"` + tsup, imports have no extension.
- ❌ Defining aliases only in `tsconfig` and not in the test runner's config. ✅
  Both need the aliases.
- ❌ Starting by creating a business module before the base pieces. ✅ Base first;
  features after.
- ❌ Hard-coding a credential/secret. ✅ Everything through `process.env` in
  `configs/`.
- ❌ `synchronize: true` on the ORM "to move fast". ✅ Migrations from the start
  (`synchronize: false`).
- ❌ A single `vitest.config`, mixing levels. ✅ Three configs; unit excludes
  integration/e2e.
