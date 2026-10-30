import { execFile, spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type { AddressInfo } from "node:net";
import { promisify } from "node:util";
import { Client } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import { HttpServer } from "platform/http/server";

interface MakeSutInterface {
  sut: ChildProcessWithoutNullStreams;
  output: () => string;
  exited: Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
  }>;
  port: number;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const children = new Set<MakeSutInterface>();
const servers = new Set<HttpServer>();

const makeSut = async (environment: NodeJS.ProcessEnv = {}): Promise<MakeSutInterface> => {
  const reservation = new HttpServer({
    host: "127.0.0.1",
    port: 0,
    routes: [],
  });
  servers.add(reservation);
  await reservation.start();
  const port = (reservation.server.address() as AddressInfo).port;
  await reservation.stop();
  const sut = spawn(process.execPath, ["dist/main.js"], {
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_HOST: postgres.connection.host,
      DATABASE_PORT: String(postgres.connection.port),
      DATABASE_USER: postgres.connection.username,
      DATABASE_PASSWORD: postgres.connection.password,
      DATABASE_NAME: postgres.connection.database,
      DATABASE_SSL: "false",
      DATABASE_LOGGING: "false",
      RUN_MIGRATIONS_ON_BOOT: "true",
      ENABLE_AUTHORIZATION_VALIDATION: "false",
      ...environment,
    },
    stdio: "pipe",
  });
  let output = "";
  sut.stdout.on("data", (data: Buffer) => { output += data.toString(); });
  sut.stderr.on("data", (data: Buffer) => { output += data.toString(); });
  const exited = new Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve, reject) => {
    sut.once("error", reject);
    sut.once("close", (code, signal) => resolve({
      code,
      signal,
    }));
  });
  const result = {
    sut,
    output: () => output,
    exited,
    port,
  };
  children.add(result);
  return result;
};

beforeAll(async () => {
  await promisify(execFile)("npm", ["run", "build"]);
  postgres = await setupPostgres();
  inspector = new Client({
    ...postgres.connection,
    user: postgres.connection.username,
  });
  await inspector.connect();
});

afterEach(async () => {
  for (const child of children) {
    if (child.sut.exitCode === null && child.sut.signalCode === null) child.sut.kill("SIGKILL");
    await child.exited;
  }
  await Promise.all([...servers].map((server) => server.stop()));
  children.clear();
  servers.clear();
});

afterAll(async () => {
  try { await inspector?.end(); } finally { await postgres?.teardown(); }
});

describe("main", () => {
  describe("when the built service receives a shutdown signal", () => {
    it.each(["SIGINT", "SIGTERM"] as const)("should serve health and release PostgreSQL sessions on %s", async (signal) => {
      const { sut, exited, output, port } = await makeSut();
      await vi.waitFor(() => expect(output()).toContain('"event":"service.started"'), {
        timeout: 15_000,
      });
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      const body: unknown = await health.json();
      const validation = await fetch(`http://127.0.0.1:${port}/api/v1/authorization/validate-good-report`, {
        method: "POST",
      });
      await validation.arrayBuffer();

      sut.kill(signal);
      const result = await exited;
      const sessions = await inspector.query("SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()");

      expect(health.status).toBe(200);
      expect(body).toEqual({
        error: false,
        data: {
          status: "ok",
        },
      });
      expect(validation.status).toBe(404);
      expect(result).toEqual({
        code: 0,
        signal: null,
      });
      expect(output()).toContain('"event":"service.stopped"');
      expect(sessions.rows).toEqual([{
        count: 0,
      }]);
      await expect(fetch(`http://127.0.0.1:${port}/health`)).rejects.toThrow();
    });
  });

  describe("when boot migrations are disabled", () => {
    it("should connect and serve health without creating a migration ledger", async () => {
      await inspector.query("DROP TABLE IF EXISTS migrations");
      const { sut, exited, output, port } = await makeSut({
        RUN_MIGRATIONS_ON_BOOT: "false",
      });
      await vi.waitFor(() => expect(output()).toContain('"event":"service.started"'), {
        timeout: 15_000,
      });

      const health = await fetch(`http://127.0.0.1:${port}/health`);
      await health.arrayBuffer();
      const ledger = await inspector.query("SELECT to_regclass('migrations') AS name");
      sut.kill("SIGTERM");
      const result = await exited;

      expect(health.status).toBe(200);
      expect(ledger.rows).toEqual([{
        name: null,
      }]);
      expect(result).toEqual({
        code: 0,
        signal: null,
      });
    });
  });

  describe("when startup fails", () => {
    it("should exit unsuccessfully with safe structured output for invalid configuration", async () => {
      const { exited, output } = await makeSut({
        PORT: "invalid-sensitive-port",
        DATABASE_PASSWORD: "sensitive-secret-config",
      });

      const result = await exited;

      expect(result).toEqual({
        code: 1,
        signal: null,
      });
      expect(JSON.parse(output())).toMatchObject({
        event: "error.captured",
        errorCategory: "unexpected_error",
      });
      expect(output()).not.toMatch(/sensitive|stack|cause|RuntimeConfigurationError/);
    });

    it("should exit safely without exposing database credentials or driver errors", async () => {
      const { exited, output } = await makeSut({
        DATABASE_PASSWORD: "sensitive-secret-password",
      });

      const result = await exited;

      expect(result).toEqual({
        code: 1,
        signal: null,
      });
      expect(JSON.parse(output())).toMatchObject({
        event: "error.captured",
        errorCategory: "unexpected_error",
      });
      expect(output()).not.toMatch(/sensitive|password|28P01|stack|cause/);
    });

    it("should release its database connection after a failed HTTP bind", async () => {
      const occupying = new HttpServer({
        host: "127.0.0.1",
        port: 0,
        routes: [],
      });
      servers.add(occupying);
      await occupying.start();
      const port = (occupying.server.address() as AddressInfo).port;
      const { exited, output } = await makeSut({
        PORT: String(port),
      });

      const result = await exited;
      const sessions = await inspector.query("SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()");

      expect(result).toEqual({
        code: 1,
        signal: null,
      });
      expect(JSON.parse(output())).toMatchObject({
        event: "error.captured",
        errorCategory: "unexpected_error",
      });
      expect(output()).not.toMatch(/EADDRINUSE|stack|cause/);
      expect(sessions.rows).toEqual([{
        count: 0,
      }]);
      expect(occupying.server.listening).toBe(true);
    });
  });
});
