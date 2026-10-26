# Setting up a brand-new microservice

Use for new services; adapt reference names/stack, then follow `SKILL.md` Workflow B
for the first feature.

## 1. Core concept

Before business modules, establish ESM, strict TypeScript, aliases, three test levels
and business-agnostic platform/shared foundations: HTTP envelope, observability,
repository error, data-source and HTTP server. Later features add folders.

## 2. Prerequisites and dependencies

- Node.js 22+ for ESM nodenext and recent features.
- Swappable runtime choices: Express, TypeORM, pg and Pino, isolated in platform/outbound.
- Development: TypeScript, tsx, Vitest, supertest, `@testcontainers/<engine>`, `@types/*`.

```bash
npm i express pg pino typeorm
npm i -D typescript tsx vitest supertest @testcontainers/postgresql \
        @types/node @types/express @types/supertest @types/pg
```

## 3. `package.json` (ESM + scripts)

Require `"type": "module"`; standardize scripts for the three test levels.

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

The reference's nodenext mode requires `.js` on relative/aliased imports even in `.ts`.
For this repository's tsup/Bundler mode, use the extensionless convention in `SKILL.md` §8.
Strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` enforce checked index
access and omitted optionals rather than `undefined`. Configure `modules/`, `platform/`,
`configs/` and `@shared/` paths.

## 5. Test configs (unit / integration / e2e)

Repeat the same aliases in all three configs; tsconfig paths alone are insufficient.
Unit tests exclude integration/E2E to stay fast and independent of Docker.

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

For `vitest.e2e.config.ts`, reuse integration config with `include: **/*.e2e.test.ts`.
See `references/testing.md` for each level.

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

No business module yet; add it with Workflow B.

## 7. Base pieces to create first

1. `@shared/http/http-response.ts`: abstract `{ error:false, data }` /
   `{ error:true, message }` envelope (`references/shared.md`).
2. `@shared/observability/observability.ts`: `ObservabilityInterface` + `*.mock.ts`
   (`references/shared.md`).
3. `@shared/errors/repository.error.ts`: generic failure (`references/shared.md`).
4. `platform/observability/<logger>.ts`: concrete contract implementation (`references/platform.md`).
5. `platform/database/<engine>/data-source.ts`: `createDataSource(connection)`,
   `initializeDatabase(ds, { runMigrations })`, `AppDataSource` (`references/platform.md`).
6. `platform/http/server.ts`: generic `HttpServer({ port, routes })` (`references/platform.md`).
7. Configs: `env.ts` reads process.env/derives flags; `database.ts` supplies credentials;
   `api-versions.ts` supplies versioned prefixes.

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

Only main connects infrastructure to aggregated routes: initialize database with
migration behavior based on topology (`references/platform.md`), assemble/start server.
Routes call feature wires.

## 8. Recommended bootstrap order

1. Package + tsconfig + test configs.
2. Folder skeleton (§6).
3. Base pieces (§7): shared → platform → configs → main, with liveness to verify boot.
4. First module/feature (`SKILL.md` Workflow B).
5. Run `npm run test` (empty/liveness) and `npm run dev`.

## 9. Common mistakes (what NOT to do)

- Do not omit `"type": "module"` or add `.js` imports under tsup/Bundler.
- Define aliases in TypeScript **and** the test runner.
- Build foundations before business modules.
- Never hard-code credentials/secrets; read process.env through configs.
- Never ORM auto-sync; `synchronize: false` and migrations from the start.
- Do not mix test levels in one config; unit excludes integration/E2E.
