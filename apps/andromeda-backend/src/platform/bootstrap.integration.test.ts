import express from "express";
import type { AddressInfo } from "node:net";
import { Client } from "pg";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { DataSource, MigrationInterface, QueryRunner } from "typeorm";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import { bootstrap } from "./bootstrap";
import type { RunningServiceInterface } from "./bootstrap";
import { closeDatabase, createDataSource, initializeDatabase } from "./database/postgres/data-source";
import { migrateDatabase } from "./database/postgres/migrate";
import { HttpServer } from "./http/server";

class FailingBootstrapMigration1800000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE TABLE bootstrap_rollback_probe (id integer)");
    await queryRunner.query("SELECT * FROM deliberately_absent_bootstrap_table");
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE bootstrap_rollback_probe");
  }
}

interface MakeSutOptionsInterface {
  port?: number;
  failMigration?: boolean;
  routes?: ConstructorParameters<typeof HttpServer>[0]["routes"];
}

interface MakeSutInterface {
  sut: () => Promise<RunningServiceInterface>;
  dataSource: DataSource;
  http: HttpServer;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();
const servers = new Set<HttpServer>();

const makeSut = (options: MakeSutOptionsInterface = {}): MakeSutInterface => {
  const dataSource = createDataSource(postgres.connection);
  dataSource.setOptions({ migrations: options.failMigration ? [FailingBootstrapMigration1800000000000] : [] });
  const http = new HttpServer({ host: "127.0.0.1", port: options.port ?? 0, routes: options.routes ?? [] });
  dataSources.add(dataSource);
  servers.add(http);
  return {
    sut: () => bootstrap({
      database: {
        initialize: async () => { await initializeDatabase(dataSource); },
        migrate: () => migrateDatabase(dataSource),
        close: () => closeDatabase(dataSource),
      },
      http,
      runMigrationsOnBoot: true,
    }),
    dataSource,
    http,
  };
};

beforeAll(async () => {
  postgres = await setupPostgres();
  inspector = new Client({ ...postgres.connection, user: postgres.connection.username });
  await inspector.connect();
});

afterEach(async () => {
  await Promise.all([...servers].map((server) => server.stop()));
  await Promise.all([...dataSources].map((dataSource) => closeDatabase(dataSource)));
  servers.clear();
  dataSources.clear();
});

afterAll(async () => {
  try { await inspector?.end(); } finally { await postgres?.teardown(); }
});

describe("bootstrap", () => {
  describe("when using real PostgreSQL and HTTP resources", () => {
    it("should migrate before serving health and release the listener and database sessions on stop", async () => {
      const { sut, dataSource, http } = makeSut();

      const service = await sut();
      const health = await request(http.server).get("/health");
      const migrations = await inspector.query("SELECT to_regclass('migrations') AS name");
      await service.stop();
      const sessions = await inspector.query("SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()");

      expect(health.body).toEqual({ error: false, data: { status: "ok" } });
      expect(migrations.rows).toEqual([{ name: "migrations" }]);
      expect(http.server.listening).toBe(false);
      expect(dataSource.isInitialized).toBe(false);
      expect(sessions.rows).toEqual([{ count: 0 }]);
    });

    it("should keep the database usable until an active HTTP request finishes", async () => {
      const requestStarted = Promise.withResolvers<void>();
      const releaseRequest = Promise.withResolvers<void>();
      const router = express.Router();
      const { sut, dataSource, http } = makeSut({ routes: [{ prefix: "/", router }] });
      router.get("/slow", async (_req, res) => {
        requestStarted.resolve();
        await releaseRequest.promise;
        const rows: { value: number }[] = await dataSource.query("SELECT 42::int AS value");
        res.json(rows);
      });
      const service = await sut();
      const responsePromise = request(http.server).get("/slow").then((response) => response);
      await requestStarted.promise;

      const stopping = service.stop();
      const databaseAvailableDuringDrain = dataSource.isInitialized;
      releaseRequest.resolve();
      const response = await responsePromise;
      await stopping;

      expect(databaseAvailableDuringDrain).toBe(true);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ value: 42 }]);
      expect(dataSource.isInitialized).toBe(false);
    });
  });

  describe("when startup cannot become ready", () => {
    it("should close the real database pool and leave no listener after a bind failure", async () => {
      const { http: occupying } = makeSut();
      await occupying.start();
      const port = (occupying.server.address() as AddressInfo).port;
      const { sut, dataSource, http } = makeSut({ port });

      const failure = await sut().catch((error: unknown) => error);
      const sessions = await inspector.query("SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()");

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({ message: "Service startup failed.", cause: { code: "EADDRINUSE" } });
      expect(http.server.listening).toBe(false);
      expect(dataSource.isInitialized).toBe(false);
      expect(sessions.rows).toEqual([{ count: 0 }]);
      expect((await request(occupying.server).get("/health")).status).toBe(200);
    });

    it("should roll back failed migrations and release the pool without opening HTTP", async () => {
      const { sut, dataSource, http } = makeSut({ failMigration: true });

      const failure = await sut().catch((error: unknown) => error);
      const probe = await inspector.query("SELECT to_regclass('bootstrap_rollback_probe') AS name");
      const history = await inspector.query("SELECT count(*)::int AS count FROM migrations");
      const sessions = await inspector.query("SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()");

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({ message: "Service startup failed.", cause: { message: "Database migrations failed." } });
      expect(probe.rows).toEqual([{ name: null }]);
      expect(history.rows).toEqual([{ count: 0 }]);
      expect(http.server.listening).toBe(false);
      expect(dataSource.isInitialized).toBe(false);
      expect(sessions.rows).toEqual([{ count: 0 }]);
    });
  });
});
