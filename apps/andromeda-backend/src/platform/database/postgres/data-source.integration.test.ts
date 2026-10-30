import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { EntitySchema } from "typeorm";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { DatabaseConfigInterface } from "configs/database/interface";
import { RepositoryError, RepositoryUnavailableError } from "@shared/errors/repository.error";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import { closeDatabase, createDataSource, initializeDatabase } from "./data-source";

interface MakeSutOptionsInterface {
  connection?: Partial<DatabaseConfigInterface>;
}

interface MakeSutInterface {
  sut: DataSource;
  applicationName: string;
  connection: DatabaseConfigInterface;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();

const makeSut = (options: MakeSutOptionsInterface = {}): MakeSutInterface => {
  const connection = {
    ...postgres.connection,
    ...options.connection,
  };
  const sut = createDataSource(connection);
  const applicationName = `connection-lifecycle-${randomUUID()}`;
  sut.setOptions({
    applicationName,
  });
  dataSources.add(sut);
  return {
    sut,
    applicationName,
    connection,
  };
};

beforeAll(async () => {
  postgres = await setupPostgres();
  inspector = new Client({
    host: postgres.connection.host,
    port: postgres.connection.port,
    user: postgres.connection.username,
    password: postgres.connection.password,
    database: postgres.connection.database,
  });
  try {
    await inspector.connect();
  } catch (error) {
    try {
      await inspector.end();
    } finally {
      await postgres.teardown();
    }
    throw error;
  }
});

afterAll(async () => {
  try {
    await Promise.all([...dataSources].map((dataSource) => closeDatabase(dataSource)));
  } finally {
    try {
      await inspector?.end();
    } finally {
      await postgres?.teardown();
    }
  }
});

describe("PostgreSQL data source lifecycle", () => {
  describe("when creating a configured data source", () => {
    it("should retain connection settings without opening connections or enabling schema automation", async () => {
      const { sut, connection, applicationName } = makeSut({
        connection: {
          ssl: true,
          logging: true,
        },
      });

      const sessions = await inspector.query("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE application_name = $1", [applicationName]);

      expect(sut.options).toMatchObject({
        type: "postgres",
        ...connection,
        synchronize: false,
        dropSchema: false,
        migrationsRun: false,
      });
      expect(sut.isInitialized).toBe(false);
      expect(sessions.rows).toEqual([{
        count: 0,
      }]);
    });
  });

  describe("when initializing a valid database connection", () => {
    it("should initialize once and execute real SQL using the configured database and user", async () => {
      const { sut, connection } = makeSut();

      const result = await initializeDatabase(sut);
      const repeated = await initializeDatabase(sut);
      const rows = await sut.query("SELECT current_database() AS database, current_user AS username");

      expect(result).toBe(sut);
      expect(repeated).toBe(sut);
      expect(sut.isInitialized).toBe(true);
      expect(rows).toEqual([{
        database: connection.database,
        username: connection.username,
      }]);
    });

    it("should preserve existing data without creating a mapped table", async () => {
      const { sut } = makeSut();
      await inspector.query("CREATE TABLE lifecycle_retained_probe (id integer PRIMARY KEY)");
      await inspector.query("INSERT INTO lifecycle_retained_probe VALUES (42)");
      sut.setOptions({
        entities: [new EntitySchema({
          name: "LifecycleUncreatedProbe",
          tableName: "lifecycle_uncreated_probe",
          columns: {
            id: {
              type: Number,
              primary: true,
            },
          },
        })],
      });

      await initializeDatabase(sut);
      const retained = await sut.query("SELECT id FROM lifecycle_retained_probe");
      const uncreated = await sut.query("SELECT to_regclass('public.lifecycle_uncreated_probe') AS relation");

      expect(retained).toEqual([{
        id: 42,
      }]);
      expect(uncreated).toEqual([{
        relation: null,
      }]);
    });
  });

  describe("when closing the database connection", () => {
    it("should resolve without connecting when the data source has never initialized", async () => {
      const { sut } = makeSut();

      await closeDatabase(sut);
      await closeDatabase(sut);

      expect(sut.isInitialized).toBe(false);
    });

    it("should release its PostgreSQL sessions and allow reopening after repeated close", async () => {
      const { sut, applicationName } = makeSut();
      await initializeDatabase(sut);
      const before = await inspector.query("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE application_name = $1", [applicationName]);

      await closeDatabase(sut);
      await closeDatabase(sut);

      expect(before.rows[0]?.count).toBeGreaterThan(0);
      expect(sut.isInitialized).toBe(false);
      await expect.poll(async () => {
        const result = await inspector.query("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE application_name = $1", [applicationName]);
        return result.rows[0]?.count;
      }).toBe(0);
      await initializeDatabase(sut);
      expect(await sut.query("SELECT 1 AS reopened")).toEqual([{
        reopened: 1,
      }]);
    });

    it("should preserve a failed close as a generic repository error and permit cleanup retry", async () => {
      const { sut } = makeSut();
      await initializeDatabase(sut);
      const cause = new Error("synthetic-private-close-failure");
      const destroySpy = vi.spyOn(sut, "destroy").mockRejectedValueOnce(cause);

      const failure = await closeDatabase(sut).catch((error: unknown) => error);
      destroySpy.mockRestore();
      await closeDatabase(sut);

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).not.toBeInstanceOf(RepositoryUnavailableError);
      expect(failure).toMatchObject({
        message: "Database connection could not be closed.",
        cause,
      });
      expect(JSON.stringify(failure)).not.toContain("synthetic-private");
      expect(sut.isInitialized).toBe(false);
    });
  });

  describe("when PostgreSQL is unavailable", () => {
    it("should translate a refused real connection without exposing driver details", async () => {
      const unavailable = await setupPostgres();
      await unavailable.teardown();
      const { sut } = makeSut({
        connection: unavailable.connection,
      });

      const failure = await initializeDatabase(sut).catch((error: unknown) => error);
      await closeDatabase(sut);

      expect(failure).toBeInstanceOf(RepositoryUnavailableError);
      expect(failure).toMatchObject({
        message: "Database unavailable.",
        cause: {
          code: "ECONNREFUSED",
        },
      });
      expect(JSON.stringify(failure)).toBe('{"name":"RepositoryUnavailableError"}');
      expect(sut.isInitialized).toBe(false);
    });
  });

  describe("when credentials or database configuration are invalid", () => {
    it.each([
      [{
        password: "synthetic-private-wrong-password",
      }, "28P01"],
      [{
        database: "synthetic_missing_database",
      }, "3D000"],
    ])("should keep configuration failure %s generic and permit corrected initialization", async (connection, code) => {
      const { sut } = makeSut({
        connection,
      });

      const failure = await initializeDatabase(sut).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).not.toBeInstanceOf(RepositoryUnavailableError);
      expect(failure).toMatchObject({
        message: "Database connection failed.",
        cause: {
          code,
        },
      });
      expect(JSON.stringify(failure)).toBe('{"name":"RepositoryError"}');
      expect(sut.isInitialized).toBe(false);
      sut.setOptions(postgres.connection);
      await initializeDatabase(sut);
      expect(await sut.query("SELECT 1 AS recovered")).toEqual([{
        recovered: 1,
      }]);
    });
  });

  describe("when metadata validation fails after a connection is acquired", () => {
    it("should keep the mapping failure generic and release the acquired pool", async () => {
      const { sut, applicationName } = makeSut();
      sut.setOptions({
        entities: [new EntitySchema({
          name: "LifecycleInvalidMapping",
          columns: {
            value: {
              type: String,
            },
          },
        })],
      });

      const failure = await initializeDatabase(sut).catch((error: unknown) => error);
      await closeDatabase(sut);

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).not.toBeInstanceOf(RepositoryUnavailableError);
      expect(failure).toMatchObject({
        message: "Database connection failed.",
        cause: {
          name: "MissingPrimaryColumnError",
        },
      });
      expect(sut.isInitialized).toBe(false);
      await expect.poll(async () => {
        const result = await inspector.query("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE application_name = $1", [applicationName]);
        return result.rows[0]?.count;
      }).toBe(0);
    });
  });

  describe("when initialization rejects with a classified technical failure", () => {
    it.each([
      "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EHOSTUNREACH", "ENETUNREACH", "EPIPE", "EAI_AGAIN",
      "08000", "08001", "08003", "08006", "53300", "57P01", "57P02", "57P03",
    ])("should recognize only the explicit connection or outage category %s", async (code) => {
      const { sut } = makeSut();
      const cause = Object.assign(new Error("synthetic-private-driver-details"), {
        code,
      });
      const initializeSpy = vi.spyOn(sut, "initialize").mockRejectedValueOnce(cause);

      const failure = await initializeDatabase(sut).catch((error: unknown) => error);
      initializeSpy.mockRestore();

      expect(failure).toBeInstanceOf(RepositoryUnavailableError);
      expect(failure).toMatchObject({
        message: "Database unavailable.",
        cause,
      });
      expect(JSON.stringify(failure)).not.toContain("synthetic-private");
    });

    it.each(["28P01", "3D000", "23505", "42601", "08P01", "08004", "ENOTFOUND", "SYNTHETIC_UNKNOWN"])("should keep non-outage code %s generic", async (code) => {
      const { sut } = makeSut();
      const cause = Object.assign(new Error("synthetic-private-driver-details"), {
        code,
      });
      const initializeSpy = vi.spyOn(sut, "initialize").mockRejectedValueOnce(cause);

      const failure = await initializeDatabase(sut).catch((error: unknown) => error);
      initializeSpy.mockRestore();

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).not.toBeInstanceOf(RepositoryUnavailableError);
      expect(failure).toMatchObject({
        message: "Database connection failed.",
        cause,
      });
    });

    it.each([null, undefined, "synthetic-private-error", 42, {
      code: 53300,
    }])("should keep an unrecognized thrown value %s generic", async (cause) => {
      const { sut } = makeSut();
      const initializeSpy = vi.spyOn(sut, "initialize").mockRejectedValueOnce(cause);

      const failure = await initializeDatabase(sut).catch((error: unknown) => error);
      initializeSpy.mockRestore();

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).not.toBeInstanceOf(RepositoryUnavailableError);
      expect(failure).toMatchObject({
        message: "Database connection failed.",
        cause,
      });
    });
  });
});
