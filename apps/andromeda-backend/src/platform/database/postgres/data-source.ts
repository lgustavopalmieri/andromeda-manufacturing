import { DataSource } from "typeorm";
import type { DatabaseConfigInterface } from "configs/database/interface";
import { RepositoryError, RepositoryUnavailableError } from "@shared/errors/repository.error";

const CONNECTION_UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EHOSTUNREACH", "ENETUNREACH", "EPIPE", "EAI_AGAIN",
  "08000", "08001", "08003", "08006", "53300", "57P01", "57P02", "57P03",
]);

const mapPostgresConnectionFailure = (error: unknown, message: string): RepositoryError => {
  if (typeof error === "object" && error !== null && "code" in error
    && typeof error.code === "string" && CONNECTION_UNAVAILABLE_CODES.has(error.code)) {
    return new RepositoryUnavailableError("Database unavailable.", {
      cause: error,
    });
  }
  return new RepositoryError(message, {
    cause: error,
  });
};

export const createDataSource = (connection: DatabaseConfigInterface): DataSource => new DataSource({
  type: "postgres",
  host: connection.host,
  port: connection.port,
  username: connection.username,
  password: connection.password,
  database: connection.database,
  ssl: connection.ssl,
  logging: connection.logging,
  synchronize: false,
  dropSchema: false,
  migrationsRun: false,
});

export const initializeDatabase = async (dataSource: DataSource): Promise<DataSource> => {
  if (dataSource.isInitialized) return dataSource;
  try {
    return await dataSource.initialize();
  } catch (error) {
    throw mapPostgresConnectionFailure(error, "Database connection failed.");
  }
};

export const closeDatabase = async (dataSource: DataSource): Promise<void> => {
  if (!dataSource.isInitialized) return;
  try {
    await dataSource.destroy();
  } catch (error) {
    throw mapPostgresConnectionFailure(error, "Database connection could not be closed.");
  }
};
