import "dotenv/config";
import { loadDatabaseConfig } from "configs/database";
import { createDataSource, initializeDatabase } from "platform/database/postgres/data-source";
import { HttpServer } from "platform/http/server";
import { buildAuthMiddlewares } from "platform/http/middlewares/auth/build-auth-middlewares";
import { buildTenantContextMiddlewares } from "platform/http/middlewares/tenant-context/build-tenant-context-middleware";
import { buildApiRoutes } from "platform/http/routes/api-routes";

export const bootstrap = async (): Promise<void> => {
  const databaseConfig = loadDatabaseConfig();
  await initializeDatabase(createDataSource(databaseConfig), {
    runMigrations: databaseConfig.runMigrationsOnBoot,
  });

  const httpServer = new HttpServer({
    port: Number(process.env["PORT"] ?? 3000),
    routes: buildApiRoutes(buildAuthMiddlewares(), buildTenantContextMiddlewares()),
  });

  httpServer.start();
};

void bootstrap().catch((error: unknown) => {
  console.error("andromeda-backend failed to start", error);
  process.exitCode = 1;
});
