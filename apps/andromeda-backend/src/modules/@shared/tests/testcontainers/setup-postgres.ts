import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { DatabaseConfigInterface } from "configs/database/interface";

export interface PostgresTestSetupInterface {
  readonly container: StartedPostgreSqlContainer;
  readonly connection: DatabaseConfigInterface;
  teardown(): Promise<void>;
}

export const setupPostgres = async (
  definition = new PostgreSqlContainer("postgres:16-alpine"),
): Promise<PostgresTestSetupInterface> => {
  const container = await definition.start();
  const teardown = async (): Promise<void> => {
    await container.stop({ timeout: 10_000, remove: true, removeVolumes: true });
  };

  try {
    return {
      container,
      connection: {
        host: container.getHost(),
        port: container.getPort(),
        username: container.getUsername(),
        password: container.getPassword(),
        database: container.getDatabase(),
        ssl: false,
        logging: false,
      },
      teardown,
    };
  } catch (error) {
    try {
      await teardown();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "PostgreSQL test setup and cleanup failed.");
    }
    throw error;
  }
};
