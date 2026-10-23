import "dotenv/config";
import { SQSClient } from "@aws-sdk/client-sqs";
import { loadDatabaseConfig } from "configs/database";
import { loadOutboxRelayConfig } from "configs/outbox-relay";
import { createDataSource, initializeDatabase } from "platform/database/postgres/data-source";
import { TypeormOutboxMessageRepository } from "platform/database/postgres/typeorm/outbox-message.typeorm-repository";
import { HttpServer } from "platform/http/server";
import { buildAuthMiddlewares } from "platform/http/middlewares/auth/build-auth-middlewares";
import { buildTenantContextMiddlewares } from "platform/http/middlewares/tenant-context/build-tenant-context-middleware";
import { buildApiRoutes } from "platform/http/routes/api-routes";
import { PinoOutboxRelayLogger } from "platform/outbox/pino-outbox-relay-logger";
import { OutboxRelay } from "platform/outbox/outbox-relay";
import { OutboxRelayWorker } from "platform/outbox/outbox-relay-worker";
import { SystemOutboxRelayClock } from "platform/outbox/system-outbox-relay-clock";
import { SqsOutboxMessagePublisher } from "platform/sqs/sqs-outbox-message-publisher";
import pino from "pino";

export const bootstrap = async (): Promise<void> => {
  const databaseConfig = loadDatabaseConfig();
  const dataSource = await initializeDatabase(createDataSource(databaseConfig), {
    runMigrations: databaseConfig.runMigrationsOnBoot,
  });
  const outboxRelayConfig = loadOutboxRelayConfig();

  if (outboxRelayConfig.enabled) {
    const logger = pino();
    const worker = new OutboxRelayWorker(
      new OutboxRelay(
        new TypeormOutboxMessageRepository(dataSource),
        new SqsOutboxMessagePublisher(
          new SQSClient({
            region: outboxRelayConfig.awsRegion,
            ...(outboxRelayConfig.awsEndpointUrl ? { endpoint: outboxRelayConfig.awsEndpointUrl } : {}),
          }),
          { queueUrl: outboxRelayConfig.queueUrl },
        ),
        new SystemOutboxRelayClock(),
        outboxRelayConfig,
      ),
      new PinoOutboxRelayLogger(logger),
      outboxRelayConfig.pollIntervalMs,
    );
    worker.start();
  }

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
