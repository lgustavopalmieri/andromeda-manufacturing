import { loadRuntimeConfig } from "configs/runtimeconfig/load-runtime-config";
import { bootstrap } from "platform/bootstrap";
import {
  closeDatabase,
  createDataSource,
  initializeDatabase,
} from "platform/database/postgres/data-source";
import { migrateDatabase } from "platform/database/postgres/migrate";
import { registerGracefulShutdown } from "platform/graceful-shutdown/register-graceful-shutdown";
import { HttpServer } from "platform/http/server";
import { PinoObservability } from "platform/observability/logger";

const observability = new PinoObservability();

const main = async (): Promise<void> => {
  const config = loadRuntimeConfig();
  const dataSource = createDataSource(config.database);
  const http = new HttpServer({
    ...config.http,
    routes: [],
  });
  const starting = bootstrap({
    database: {
      initialize: async () => {
        await initializeDatabase(dataSource);
      },
      migrate: () => migrateDatabase(dataSource),
      close: () => closeDatabase(dataSource),
    },
    http,
    runMigrationsOnBoot: config.runMigrationsOnBoot,
  });

  const removeSignalHandlers = registerGracefulShutdown({
    shutdown: async () => {
      const service = await starting;
      await service.stop();
      observability.event("service.stopped");
    },
    onError: (error: unknown) => {
      observability.capture(error);
      process.exitCode = 1;
    },
  });

  try {
    await starting;
    observability.event("service.started");
  } catch (error) {
    removeSignalHandlers();
    throw error;
  }
};

void main().catch((error: unknown) => {
  observability.capture(error);
  process.exitCode = 1;
});
