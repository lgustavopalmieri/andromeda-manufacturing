import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type { DataSource, QueryRunner } from "typeorm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { RepositoryError } from "@shared/errors/repository.error";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import { closeDatabase, createDataSource, initializeDatabase } from "./data-source";
import { migrateDatabase } from "./migrate";
import { readMigrationSql } from "./read-migration-sql";

interface MakeSutOptionsInterface {
  secondSql?: string;
  initialize?: boolean;
}

interface ResourcesInterface {
  directory: string;
  postgres?: PostgresTestSetupInterface;
  dataSource?: DataSource;
}

interface MakeSutInterface {
  sut: typeof migrateDatabase;
  dataSource: DataSource;
  directory: string;
}

const resources = new Set<ResourcesInterface>();

const makeSut = async (options: MakeSutOptionsInterface = {}): Promise<MakeSutInterface> => {
  const directory = await mkdtemp(join(tmpdir(), "andromeda-migration-test-"));
  const acquired: ResourcesInterface = {
    directory,
  };
  resources.add(acquired);
  const postgres = await setupPostgres();
  acquired.postgres = postgres;
  await writeFile(join(directory, "0001-first.up.sql"),
    "CREATE TABLE migration_probe (id integer PRIMARY KEY); INSERT INTO migration_probe VALUES (1);");
  await writeFile(join(directory, "0001-first.down.sql"), "DROP TABLE migration_probe;");
  await writeFile(join(directory, "0002-second.up.sql"), options.secondSql ?? "INSERT INTO migration_probe VALUES (2);");
  await writeFile(join(directory, "0002-second.down.sql"), "DELETE FROM migration_probe WHERE id = 2;");
  const migrationUrl = pathToFileURL(join(directory, "fixture.ts")).href;

  class FirstProbe1700000000001 {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(readMigrationSql(migrationUrl, "0001-first.up.sql"));
    }
    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(readMigrationSql(migrationUrl, "0001-first.down.sql"));
    }
  }
  class SecondProbe1700000000002 {
    async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(readMigrationSql(migrationUrl, "0002-second.up.sql"));
    }
    async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(readMigrationSql(migrationUrl, "0002-second.down.sql"));
    }
  }

  const dataSource = createDataSource(postgres.connection);
  acquired.dataSource = dataSource;
  dataSource.setOptions({
    migrations: [SecondProbe1700000000002, FirstProbe1700000000001],
  });
  if (options.initialize ?? true) await initializeDatabase(dataSource);
  return {
    sut: migrateDatabase,
    dataSource,
    directory,
  };
};

afterAll(async () => {
  await Promise.all([...resources].map(async ({ dataSource, postgres, directory }) => {
    try {
      if (dataSource) await closeDatabase(dataSource);
    } finally {
      try {
        await postgres?.teardown();
      } finally {
        await rm(directory, {
          recursive: true,
          force: true,
        });
      }
    }
  }));
});

describe("migrateDatabase", () => {
  describe("when ordered SQL migrations are pending", () => {
    it("should apply timestamp order and record each migration despite reversed registration", async () => {
      const { sut, dataSource } = await makeSut();
      const originalLogger = dataSource.logger;

      const applied = await sut(dataSource);

      expect(applied.map((migration) => migration.name)).toEqual(["FirstProbe1700000000001", "SecondProbe1700000000002"]);
      expect(dataSource.logger).toBe(originalLogger);
      expect(await dataSource.query("SELECT id FROM migration_probe ORDER BY id")).toEqual([{
        id: 1,
      }, {
        id: 2,
      }]);
      expect(await dataSource.query("SELECT name FROM migrations ORDER BY timestamp")).toEqual([
        {
          name: "FirstProbe1700000000001",
        }, {
          name: "SecondProbe1700000000002",
        },
      ]);
    });

    it("should leave already applied SQL unchanged on a second run", async () => {
      const { sut, dataSource } = await makeSut();
      await sut(dataSource);

      const applied = await sut(dataSource);

      expect(applied).toEqual([]);
      expect(await dataSource.query("SELECT id FROM migration_probe ORDER BY id")).toEqual([{
        id: 1,
      }, {
        id: 2,
      }]);
      expect(await dataSource.query("SELECT count(*)::integer AS count FROM migrations")).toEqual([{
        count: 2,
      }]);
    });
  });

  describe("when SQL execution fails within the migration transaction", () => {
    it("should roll back all pending changes and history, preserve the cause and allow a corrected retry", async () => {
      const { sut, dataSource, directory } = await makeSut({
        secondSql: "INSERT INTO migration_probe VALUES (2); INSERT INTO nonexistent_probe VALUES (9);",
      });
      const originalLogger = dataSource.logger;
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      let failure: unknown;
      try {
        failure = await sut(dataSource).catch((error: unknown) => error);
        expect(logSpy).not.toHaveBeenCalled();
      } finally {
        logSpy.mockRestore();
      }

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(dataSource.logger).toBe(originalLogger);
      expect(failure).toMatchObject({
        message: "Database migrations failed.",
        cause: {
          code: "42P01",
        },
      });
      expect(JSON.stringify(failure)).toBe('{"name":"RepositoryError"}');
      expect(await dataSource.query("SELECT to_regclass('public.migration_probe') AS relation")).toEqual([{
        relation: null,
      }]);
      expect(await dataSource.query("SELECT count(*)::integer AS count FROM migrations")).toEqual([{
        count: 0,
      }]);
      await writeFile(join(directory, "0002-second.up.sql"), "INSERT INTO migration_probe VALUES (2);");
      expect((await sut(dataSource)).map((migration) => migration.name)).toEqual(["FirstProbe1700000000001", "SecondProbe1700000000002"]);
      expect(await dataSource.query("SELECT id FROM migration_probe ORDER BY id")).toEqual([{
        id: 1,
      }, {
        id: 2,
      }]);
    });
  });

  describe("when a SQL asset is missing", () => {
    it("should fail safely without marking the missing migration as applied", async () => {
      const { sut, dataSource, directory } = await makeSut();
      await rm(join(directory, "0001-first.up.sql"));

      const failure = await sut(dataSource).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).toMatchObject({
        message: "Database migrations failed.",
        cause: {
          code: "ENOENT",
        },
      });
      expect(JSON.stringify(failure)).toBe('{"name":"RepositoryError"}');
      expect(await dataSource.query("SELECT count(*)::integer AS count FROM migrations")).toEqual([{
        count: 0,
      }]);
    });
  });

  describe("when the datasource has not initialized", () => {
    it("should report a safe migration failure without opening a connection", async () => {
      const { sut, dataSource } = await makeSut({
        initialize: false,
      });

      const failure = await sut(dataSource).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).toMatchObject({
        message: "Database migrations failed.",
        cause: {
          name: "CannotExecuteNotConnectedError",
        },
      });
      expect(dataSource.isInitialized).toBe(false);
    });
  });

  describe("when the production tsup configuration packages SQL-first wrappers", () => {
    it("should execute emitted wrappers with colocated assets and remove stale output on rebuild", async () => {
      const { dataSource, directory } = await makeSut({
        initialize: false,
      });
      const appDirectory = fileURLToPath(new URL("../../../../", import.meta.url));
      const fixtureRoot = join(directory, "build-fixture");
      const sourceDirectory = join(fixtureRoot, "src/platform/database/postgres/migrations");
      await mkdir(sourceDirectory, {
        recursive: true,
      });
      await writeFile(join(fixtureRoot, "package.json"), '{"type":"module"}');
      await writeFile(join(fixtureRoot, "src/main.ts"),
        'export { BuiltProbe1700000000003, migrateDatabase } from "./platform/database/postgres/migrations/0003-built";');
      const readerPath = fileURLToPath(new URL("./read-migration-sql.ts", import.meta.url));
      const runnerPath = fileURLToPath(new URL("./migrate.ts", import.meta.url));
      await writeFile(join(sourceDirectory, "0003-built.ts"), `
        import { readMigrationSql } from ${JSON.stringify(readerPath)};
        export { migrateDatabase } from ${JSON.stringify(runnerPath)};
        export class BuiltProbe1700000000003 {
          async up(queryRunner: { query(sql: string): Promise<unknown> }) { await queryRunner.query(readMigrationSql(import.meta.url, "0003-built.up.sql")); }
          async down(queryRunner: { query(sql: string): Promise<unknown> }) { await queryRunner.query(readMigrationSql(import.meta.url, "0003-built.down.sql")); }
        }
      `);
      const sql = "CREATE TABLE built_migration_probe (id integer PRIMARY KEY); INSERT INTO built_migration_probe VALUES (3);";
      await writeFile(join(sourceDirectory, "0003-built.up.sql"), sql);
      await writeFile(join(sourceDirectory, "0003-built.down.sql"), "DROP TABLE built_migration_probe;");
      const runBuild = promisify(execFile);
      const buildArguments = [
        "--config", resolve(appDirectory, "tsup.config.ts"),
        "--tsconfig", resolve(appDirectory, "tsconfig.json"),
      ];
      const buildExecutable = resolve(appDirectory, "node_modules/.bin/tsup");

      await runBuild(buildExecutable, buildArguments, {
        cwd: fixtureRoot,
      });
      const emittedWrapper = join(fixtureRoot, "dist/platform/database/postgres/migrations/0003-built.js");
      const emittedUpSql = join(dirname(emittedWrapper), "0003-built.up.sql");
      expect(await readFile(emittedUpSql, "utf8")).toBe(sql);
      expect(await readFile(join(dirname(emittedWrapper), "0003-built.down.sql"), "utf8")).toBe("DROP TABLE built_migration_probe;");
      const connectionFile = join(directory, "build-connection.json");
      await writeFile(connectionFile, JSON.stringify(dataSource.options));
      const executeArtifact = `
        import { readFileSync } from "node:fs";
        import { pathToFileURL } from "node:url";
        import { DataSource } from ${JSON.stringify(import.meta.resolve("typeorm"))};
        const built = await import(pathToFileURL(process.argv[1]).href);
        const connection = JSON.parse(readFileSync(process.argv[2], "utf8"));
        const dataSource = new DataSource({ ...connection, migrations: [built.BuiltProbe1700000000003] });
        await dataSource.initialize();
        try {
          if (process.argv[3] === "undo") await dataSource.undoLastMigration({ transaction: "all" });
          const applied = await built.migrateDatabase(dataSource);
          const rows = await dataSource.query("SELECT id FROM built_migration_probe");
          console.log(JSON.stringify({ applied: applied.map(migration => migration.name), rows }));
        } finally { await dataSource.destroy(); }
      `;
      const mainExecution = await runBuild(process.execPath, [
        "--input-type=module", "-e", executeArtifact, join(fixtureRoot, "dist/main.js"), connectionFile,
      ]);
      expect(JSON.parse(mainExecution.stdout)).toEqual({
        applied: ["BuiltProbe1700000000003"],
        rows: [{
          id: 3,
        }],
      });
      const standaloneExecution = await runBuild(process.execPath, [
        "--input-type=module", "-e", executeArtifact, emittedWrapper, connectionFile, "undo",
      ]);
      expect(JSON.parse(standaloneExecution.stdout)).toEqual({
        applied: ["BuiltProbe1700000000003"],
        rows: [{
          id: 3,
        }],
      });

      await writeFile(join(fixtureRoot, "src/main.ts"), "export const buildProbe = true;");
      await rm(join(sourceDirectory, "0003-built.up.sql"));
      await rm(join(sourceDirectory, "0003-built.down.sql"));
      await rm(join(sourceDirectory, "0003-built.ts"));
      await runBuild(buildExecutable, buildArguments, {
        cwd: fixtureRoot,
      });
      await expect(access(emittedUpSql)).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(access(join(dirname(emittedWrapper), "0003-built.down.sql"))).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(access(emittedWrapper)).rejects.toMatchObject({
        code: "ENOENT",
      });
    });
  });
});
