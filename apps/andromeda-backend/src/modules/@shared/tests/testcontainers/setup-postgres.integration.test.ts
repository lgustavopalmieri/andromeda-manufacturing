import { randomUUID } from "node:crypto";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Client } from "pg";
import { Wait } from "testcontainers";
import { afterAll, describe, expect, it, vi } from "vitest";
import { setupPostgres } from "./setup-postgres";
import type { PostgresTestSetupInterface } from "./setup-postgres";

interface MakeSutOptionsInterface {
  container?: PostgreSqlContainer;
}

interface MakeSutInterface {
  sut: PostgresTestSetupInterface;
  client: Client;
}

const setups = new Set<PostgresTestSetupInterface>();
const clients = new Set<Client>();

const makeSut = async (
  options: MakeSutOptionsInterface = {},
): Promise<MakeSutInterface> => {
  const sut = await setupPostgres(options.container);
  setups.add(sut);
  const client = new Client({
    host: sut.connection.host,
    port: sut.connection.port,
    user: sut.connection.username,
    password: sut.connection.password,
    database: sut.connection.database,
    ssl: sut.connection.ssl,
    connectionTimeoutMillis: 5_000,
  });
  clients.add(client);
  try {
    await client.connect();
    return {
      sut,
      client,
    };
  } catch (error) {
    try {
      await client.end();
      clients.delete(client);
    } finally {
      await sut.teardown();
      setups.delete(sut);
    }
    throw error;
  }
};

afterAll(async () => {
  try {
    await Promise.all([...clients].map((client) => client.end()));
  } finally {
    await Promise.all([...setups].map((setup) => setup.teardown()));
  }
});

describe("setupPostgres", () => {
  describe("when starting a disposable PostgreSQL instance", () => {
    it("should expose usable connection settings for a ready database without application tables", async () => {
      const { sut, client } = await makeSut();

      const result = await client.query(
        "SELECT current_database() AS database, current_user AS username",
      );
      const tables = await client.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
      );

      expect(sut.connection).toEqual({
        host: sut.container.getHost(),
        port: sut.container.getPort(),
        username: sut.container.getUsername(),
        password: sut.container.getPassword(),
        database: sut.container.getDatabase(),
        ssl: false,
        logging: false,
      });
      expect(sut.connection.port).toBeGreaterThan(0);
      expect(result.rows).toEqual([
        {
          database: sut.connection.database,
          username: sut.connection.username,
        },
      ]);
      expect(tables.rows).toEqual([]);
    });

    it("should honor an explicitly configured PostgreSQL container", async () => {
      const container = new PostgreSqlContainer("postgres:16-alpine")
        .withDatabase("custom_database")
        .withUsername("custom_user")
        .withPassword("custom_test_password");
      const { sut, client } = await makeSut({
        container,
      });

      const result = await client.query(
        "SELECT current_database() AS database, current_user AS username",
      );

      expect(sut.connection).toMatchObject({
        database: "custom_database",
        username: "custom_user",
        password: "custom_test_password",
      });
      expect(result.rows).toEqual([
        {
          database: "custom_database",
          username: "custom_user",
        },
      ]);
    });

    it("should isolate concurrently created instances even when their database names match", async () => {
      const [first, second] = await Promise.all([makeSut(), makeSut()]);

      await first.client.query(
        "CREATE TABLE disposable_marker (id integer PRIMARY KEY)",
      );
      await first.client.query("INSERT INTO disposable_marker VALUES (1)");
      const firstResult = await first.client.query(
        "SELECT id FROM disposable_marker",
      );
      const secondResult = await second.client.query(
        "SELECT to_regclass('public.disposable_marker') AS relation",
      );

      expect(first.sut.container.getId()).not.toBe(
        second.sut.container.getId(),
      );
      expect(first.sut.connection.database).toBe(
        second.sut.connection.database,
      );
      expect(first.sut.connection.port).not.toBe(second.sut.connection.port);
      expect(firstResult.rows).toEqual([
        {
          id: 1,
        },
      ]);
      expect(secondResult.rows).toEqual([
        {
          relation: null,
        },
      ]);
    });
  });

  describe("when tearing down a started instance", () => {
    it("should remove the container and tolerate concurrent or repeated teardown", async () => {
      const { sut, client } = await makeSut();
      await client.end();
      clients.delete(client);

      await Promise.all([sut.teardown(), sut.teardown()]);
      await sut.teardown();
      const failure = await sut.container
        .exec(["true"])
        .catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({
        message: expect.stringContaining("No such container"),
      });
    });

    it("should surface a teardown failure and allow cleanup to be retried", async () => {
      const { sut, client } = await makeSut();
      await client.end();
      clients.delete(client);
      const cleanupError = new Error("synthetic-teardown-failure");
      const stopSpy = vi
        .spyOn(sut.container, "stop")
        .mockRejectedValueOnce(cleanupError);

      const failure = await sut.teardown().catch((error: unknown) => error);
      stopSpy.mockRestore();
      await sut.teardown();

      expect(failure).toBe(cleanupError);
      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({
        message: "synthetic-teardown-failure",
      });
    });
  });

  describe("when readiness fails after a container has started", () => {
    it("should reject setup and release the failed container before returning control", async () => {
      const name = `andromeda-postgres-failure-${randomUUID()}`;
      const container = new PostgreSqlContainer("postgres:16-alpine")
        .withName(name)
        .withWaitStrategy(
          Wait.forLogMessage("synthetic-unreachable-readiness-marker"),
        )
        .withStartupTimeout(1_000);

      const failure = await makeSut({
        container,
      }).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({
        message: expect.stringContaining(
          "synthetic-unreachable-readiness-marker",
        ),
      });
      const { sut, client } = await makeSut({
        container: new PostgreSqlContainer("postgres:16-alpine").withName(name),
      });
      expect(sut.container.getName()).toBe(`/${name}`);
      expect((await client.query("SELECT 1 AS ready")).rows).toEqual([
        {
          ready: 1,
        },
      ]);
    });
  });

  describe("when preparing connection settings fails after startup", () => {
    it("should remove the acquired container and preserve the setup failure", async () => {
      const name = `andromeda-postgres-settings-${randomUUID()}`;
      const setupError = new Error("synthetic-settings-failure");
      const hostSpy = vi
        .spyOn(StartedPostgreSqlContainer.prototype, "getHost")
        .mockImplementationOnce(() => {
          throw setupError;
        });
      let failure: unknown;
      try {
        failure = await makeSut({
          container: new PostgreSqlContainer("postgres:16-alpine").withName(
            name,
          ),
        }).catch((error: unknown) => error);
      } finally {
        hostSpy.mockRestore();
      }

      expect(failure).toBe(setupError);
      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({
        message: "synthetic-settings-failure",
      });
      const { client } = await makeSut({
        container: new PostgreSqlContainer("postgres:16-alpine").withName(name),
      });
      expect((await client.query("SELECT 1 AS ready")).rows).toEqual([
        {
          ready: 1,
        },
      ]);
    });

    it("should report both failures if acquired-container cleanup also fails", async () => {
      const setupError = new Error("synthetic-settings-failure");
      const cleanupError = new Error("synthetic-cleanup-failure");
      let acquiredContainer: StartedPostgreSqlContainer | undefined;
      const hostSpy = vi
        .spyOn(StartedPostgreSqlContainer.prototype, "getHost")
        .mockImplementationOnce(function (this: StartedPostgreSqlContainer) {
          acquiredContainer = this;
          throw setupError;
        });
      const stopSpy = vi
        .spyOn(StartedPostgreSqlContainer.prototype, "stop")
        .mockRejectedValueOnce(cleanupError);
      let failure: unknown;
      try {
        failure = await makeSut().catch((error: unknown) => error);
      } finally {
        hostSpy.mockRestore();
        stopSpy.mockRestore();
        await acquiredContainer?.stop({
          remove: true,
          removeVolumes: true,
        });
      }

      expect(failure).toBeInstanceOf(AggregateError);
      expect(failure).toMatchObject({
        message: "PostgreSQL test setup and cleanup failed.",
        errors: [setupError, cleanupError],
      });
    });
  });
});
