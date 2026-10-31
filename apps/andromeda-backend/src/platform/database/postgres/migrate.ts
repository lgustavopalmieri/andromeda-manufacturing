import type { DataSource, Migration } from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";

export const migrateDatabase = async (
  dataSource: DataSource,
): Promise<Migration[]> => {
  const originalLogger = dataSource.logger;
  dataSource.logger = Object.assign(Object.create(originalLogger), {
    logMigration: () => {},
  });
  try {
    return await dataSource.runMigrations({
      transaction: "all",
    });
  } catch (error) {
    throw new RepositoryError("Database migrations failed.", {
      cause: error,
    });
  } finally {
    dataSource.logger = originalLogger;
  }
};
