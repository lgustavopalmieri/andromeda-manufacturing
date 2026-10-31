import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { Client } from "pg";
import { QueryFailedError } from "typeorm";
import type { DataSource } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { DatabaseConfigInterface } from "configs/database/interface";
import { RepositoryError } from "@shared/errors/repository.error";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import {
  closeDatabase,
  createDataSource,
  initializeDatabase,
} from "./data-source";
import { migrateDatabase } from "./migrate";

interface MakeSutOptionsInterface {
  migrate?: boolean;
  fixtures?: boolean;
}

interface MakeSutInterface {
  sut: DataSource;
  connection: DatabaseConfigInterface;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();

const makeSut = async (
  options: MakeSutOptionsInterface = {},
): Promise<MakeSutInterface> => {
  const database = `schema_case_${dataSources.size}`;
  await inspector.query(`CREATE DATABASE "${database}"`);
  const connection = {
    ...postgres.connection,
    database,
  };
  const sut = createDataSource(connection);
  sut.setOptions({
    entities: [],
  });
  dataSources.add(sut);
  await initializeDatabase(sut);
  if (options.migrate ?? true) {
    await migrateDatabase(sut);
    if (options.fixtures ?? true) {
      await sut.query(`
        INSERT INTO tenants (id, code) VALUES ('ta', 'A'), ('tb', 'B');
        INSERT INTO actors (id, name, kind, status, owner_actor_id) VALUES
          ('u-owner', 'Owner', 'human', 'active', NULL),
          ('u-dual', 'Dual', 'human', 'active', NULL),
          ('u-service', 'Service', 'service', 'inactive', 'u-owner'),
          ('u-agent', 'Agent', 'agent', 'active', 'u-owner');
        INSERT INTO tenant_memberships (tenant_id, actor_id, status) VALUES
          ('ta', 'u-dual', 'active'), ('tb', 'u-dual', 'suspended'), ('ta', 'u-owner', 'removed');
        INSERT INTO locations (id, tenant_id, code, kind, parent_location_id) VALUES
          ('pa', 'ta', 'P1', 'plant', NULL), ('aa', 'ta', 'A1', 'area', 'pa'),
          ('la', 'ta', 'L1', 'line', 'aa'), ('wa', 'ta', 'W1', 'warehouse', NULL),
          ('pb', 'tb', 'P1', 'plant', NULL), ('ab', 'tb', 'A1', 'area', 'pb'),
          ('lb', 'tb', 'L1', 'line', 'ab');
        INSERT INTO machines (id, tenant_id, code, location_id) VALUES
          ('ma', 'ta', 'M1', 'la'), ('mb', 'tb', 'M1', 'lb');
      `);
    }
  }
  return {
    sut,
    connection,
  };
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
  await Promise.all(
    [...dataSources].map((dataSource) => closeDatabase(dataSource)),
  );
});

afterAll(async () => {
  try {
    await Promise.all(
      [...dataSources].map((dataSource) => closeDatabase(dataSource)),
    );
  } finally {
    try {
      await inspector?.end();
    } finally {
      await postgres?.teardown();
    }
  }
});

describe("Foundation SQL schema", () => {
  describe("when applying the registered production migration", () => {
    it("should create exactly the five empty business tables without ORM mappings or seeds", async () => {
      const { sut } = await makeSut({
        migrate: false,
      });

      const applied = await migrateDatabase(sut);
      const tables: {
        tablename: string;
      }[] = await sut.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'migrations' ORDER BY tablename",
      );
      const counts = await sut.query(
        "SELECT (SELECT count(*) FROM tenants)::int AS tenants, (SELECT count(*) FROM actors)::int AS actors, (SELECT count(*) FROM tenant_memberships)::int AS memberships, (SELECT count(*) FROM locations)::int AS locations, (SELECT count(*) FROM machines)::int AS machines",
      );

      expect(sut.entityMetadatas).toEqual([]);
      expect(sut.options.synchronize).toBe(false);
      expect(applied.map((migration) => migration.name)).toEqual([
        "Foundation1793318400000",
      ]);
      expect(tables.map((row) => row.tablename)).toEqual([
        "actors",
        "locations",
        "machines",
        "tenant_memberships",
        "tenants",
      ]);
      expect(counts).toEqual([
        {
          tenants: 0,
          actors: 0,
          memberships: 0,
          locations: 0,
          machines: 0,
        },
      ]);
    });

    it("should create the nine unique indexes and four nonunique foreign-key indexes with the intended key order", async () => {
      const { sut } = await makeSut({
        fixtures: false,
      });

      const indexes: {
        table_name: string;
        index_name: string;
        method: string;
        columns: string[];
        is_unique: boolean;
        is_valid: boolean;
        is_ready: boolean;
        predicate: string | null;
        total_attributes: number;
        key_attributes: number;
      }[] = await sut.query(`
        SELECT tbl.relname AS table_name, idx.relname AS index_name, method.amname AS method,
               ARRAY(
                 SELECT attr.attname::text
                 FROM unnest(info.indkey::smallint[]) WITH ORDINALITY AS key(attnum, position)
                 JOIN pg_attribute attr ON attr.attrelid = tbl.oid AND attr.attnum = key.attnum
                 ORDER BY key.position
               ) AS columns,
               info.indisunique AS is_unique, info.indisvalid AS is_valid, info.indisready AS is_ready,
               pg_get_expr(info.indpred, info.indrelid) AS predicate,
               info.indnatts AS total_attributes, info.indnkeyatts AS key_attributes
        FROM pg_index info
        JOIN pg_class tbl ON tbl.oid = info.indrelid
        JOIN pg_class idx ON idx.oid = info.indexrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        JOIN pg_am method ON method.oid = idx.relam
        WHERE ns.nspname = 'public' AND tbl.relname <> 'migrations'
        ORDER BY tbl.relname, idx.relname
      `);

      expect(
        indexes.map((index) => [
          index.table_name,
          index.index_name,
          index.columns,
          index.is_unique,
        ]),
      ).toEqual([
        ["actors", "actors_owner_actor_id_idx", ["owner_actor_id"], false],
        ["actors", "actors_pkey", ["id"], true],
        ["locations", "locations_pkey", ["id"], true],
        ["locations", "locations_tenant_code_key", ["tenant_id", "code"], true],
        ["locations", "locations_tenant_id_key", ["tenant_id", "id"], true],
        [
          "locations",
          "locations_tenant_parent_location_id_idx",
          ["tenant_id", "parent_location_id"],
          false,
        ],
        ["machines", "machines_pkey", ["id"], true],
        ["machines", "machines_tenant_code_key", ["tenant_id", "code"], true],
        ["machines", "machines_tenant_id_key", ["tenant_id", "id"], true],
        [
          "machines",
          "machines_tenant_location_id_idx",
          ["tenant_id", "location_id"],
          false,
        ],
        [
          "tenant_memberships",
          "tenant_memberships_actor_id_idx",
          ["actor_id"],
          false,
        ],
        [
          "tenant_memberships",
          "tenant_memberships_pkey",
          ["tenant_id", "actor_id"],
          true,
        ],
        ["tenants", "tenants_pkey", ["id"], true],
      ]);
      for (const index of indexes) {
        expect(index).toMatchObject({
          method: "btree",
          is_valid: true,
          is_ready: true,
          predicate: null,
        });
        expect(index.total_attributes).toBe(index.key_attributes);
      }
    });

    it("should retain all relational constraints and required columns alongside the nonunique indexes", async () => {
      const { sut } = await makeSut({
        fixtures: false,
      });

      const constraints = await sut.query(`
        SELECT contype AS type, count(*)::int AS count
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace AND conrelid <> 'migrations'::regclass
        GROUP BY contype ORDER BY contype
      `);
      const required = await sut.query(`
        SELECT count(*)::int AS count FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name <> 'migrations' AND is_nullable = 'NO'
      `);

      expect(constraints).toEqual([
        {
          type: "c",
          count: 4,
        },
        {
          type: "f",
          count: 7,
        },
        {
          type: "p",
          count: 5,
        },
        {
          type: "u",
          count: 4,
        },
      ]);
      expect(required).toEqual([
        {
          count: 17,
        },
      ]);
    });

    it("should retain string identities and reused location and machine codes independently across tenants", async () => {
      const { sut } = await makeSut();

      const machines = await sut.query(
        "SELECT id, tenant_id, code, location_id FROM machines ORDER BY tenant_id",
      );
      const locations = await sut.query(
        "SELECT id, tenant_id, code FROM locations WHERE code = 'L1' ORDER BY tenant_id",
      );

      expect(machines).toEqual([
        {
          id: "ma",
          tenant_id: "ta",
          code: "M1",
          location_id: "la",
        },
        {
          id: "mb",
          tenant_id: "tb",
          code: "M1",
          location_id: "lb",
        },
      ]);
      expect(locations).toEqual([
        {
          id: "la",
          tenant_id: "ta",
          code: "L1",
        },
        {
          id: "lb",
          tenant_id: "tb",
          code: "L1",
        },
      ]);
    });

    it("should store nullable root parents and actor owners and preserve valid owner references", async () => {
      const { sut } = await makeSut();

      const roots = await sut.query(
        "SELECT id, parent_location_id FROM locations WHERE kind = 'plant' ORDER BY id",
      );
      const owners = await sut.query(
        "SELECT id, owner_actor_id FROM actors WHERE id IN ('u-owner', 'u-service') ORDER BY id",
      );

      expect(roots).toEqual([
        {
          id: "pa",
          parent_location_id: null,
        },
        {
          id: "pb",
          parent_location_id: null,
        },
      ]);
      expect(owners).toEqual([
        {
          id: "u-owner",
          owner_actor_id: null,
        },
        {
          id: "u-service",
          owner_actor_id: "u-owner",
        },
      ]);
    });

    it("should keep the same global actor's tenant memberships independent", async () => {
      const { sut } = await makeSut();

      await sut.query(
        "UPDATE tenant_memberships SET status = 'removed' WHERE tenant_id = 'ta' AND actor_id = 'u-dual'",
      );
      const memberships = await sut.query(
        "SELECT tenant_id, actor_id, status FROM tenant_memberships WHERE actor_id = 'u-dual' ORDER BY tenant_id",
      );

      expect(memberships).toEqual([
        {
          tenant_id: "ta",
          actor_id: "u-dual",
          status: "removed",
        },
        {
          tenant_id: "tb",
          actor_id: "u-dual",
          status: "suspended",
        },
      ]);
      expect(
        await sut.query("SELECT id FROM actors WHERE id = 'u-dual'"),
      ).toEqual([
        {
          id: "u-dual",
        },
      ]);
    });

    it("should leave applied records and migration history unchanged when run again", async () => {
      const { sut } = await makeSut();

      const applied = await migrateDatabase(sut);

      expect(applied).toEqual([]);
      expect(await sut.query("SELECT name FROM migrations")).toEqual([
        {
          name: "Foundation1793318400000",
        },
      ]);
      expect(
        await sut.query("SELECT count(*)::int AS count FROM machines"),
      ).toEqual([
        {
          count: 2,
        },
      ]);
    });
  });

  describe("when a required column is null", () => {
    it.each([
      ["tenants", "id"],
      ["tenants", "code"],
      ["actors", "id"],
      ["actors", "name"],
      ["actors", "kind"],
      ["actors", "status"],
      ["tenant_memberships", "tenant_id"],
      ["tenant_memberships", "actor_id"],
      ["tenant_memberships", "status"],
      ["locations", "id"],
      ["locations", "tenant_id"],
      ["locations", "code"],
      ["locations", "kind"],
      ["machines", "id"],
      ["machines", "tenant_id"],
      ["machines", "code"],
      ["machines", "location_id"],
    ])("should reject partial %s records missing %s", async (table, column) => {
      const { sut } = await makeSut();

      const failure = await sut
        .query(`UPDATE ${table} SET ${column} = NULL`)
        .catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: expect.stringContaining("violates not-null constraint"),
        driverError: {
          code: "23502",
          table,
          column,
        },
      });
    });
  });

  describe("when an identity, membership or tenant-owned display code is duplicated", () => {
    it.each([
      [
        "tenant identity",
        "INSERT INTO tenants VALUES ('ta', 'Other')",
        "tenants_pkey",
      ],
      [
        "global actor identity",
        "INSERT INTO actors (id, name, kind, status) VALUES ('u-dual', 'Other', 'human', 'active')",
        "actors_pkey",
      ],
      [
        "membership",
        "INSERT INTO tenant_memberships VALUES ('ta', 'u-dual', 'active')",
        "tenant_memberships_pkey",
      ],
      [
        "location identity",
        "INSERT INTO locations (id, tenant_id, code, kind) VALUES ('pa', 'ta', 'NEW', 'plant')",
        "locations_pkey",
      ],
      [
        "location code",
        "INSERT INTO locations (id, tenant_id, code, kind) VALUES ('other-location', 'ta', 'L1', 'line')",
        "locations_tenant_code_key",
      ],
      [
        "machine identity",
        "INSERT INTO machines VALUES ('ma', 'ta', 'NEW', 'la')",
        "machines_pkey",
      ],
      [
        "machine code",
        "INSERT INTO machines VALUES ('other-machine', 'ta', 'M1', 'la')",
        "machines_tenant_code_key",
      ],
    ])("should reject duplicate %s", async (_case, sql, constraint) => {
      const { sut } = await makeSut();

      const failure = await sut.query(sql).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: expect.stringContaining("violates unique constraint"),
        driverError: {
          code: "23505",
          constraint,
        },
      });
    });
  });

  describe("when a reference is missing or belongs to another tenant", () => {
    it.each([
      [
        "membership tenant",
        "INSERT INTO tenant_memberships VALUES ('missing', 'u-dual', 'active')",
        "tenant_memberships",
      ],
      [
        "membership actor",
        "INSERT INTO tenant_memberships VALUES ('ta', 'missing', 'active')",
        "tenant_memberships",
      ],
      [
        "actor owner",
        "UPDATE actors SET owner_actor_id = 'missing' WHERE id = 'u-service'",
        "actors",
      ],
      [
        "location tenant",
        "INSERT INTO locations (id, tenant_id, code, kind) VALUES ('orphan', 'missing', 'P1', 'plant')",
        "locations",
      ],
      [
        "missing parent",
        "UPDATE locations SET parent_location_id = 'missing' WHERE id = 'la'",
        "locations",
      ],
      [
        "foreign parent",
        "UPDATE locations SET parent_location_id = 'lb' WHERE id = 'la'",
        "locations",
      ],
      [
        "machine tenant",
        "INSERT INTO machines VALUES ('orphan', 'missing', 'M1', 'la')",
        "machines",
      ],
      [
        "missing machine location",
        "UPDATE machines SET location_id = 'missing' WHERE id = 'ma'",
        "machines",
      ],
      [
        "foreign machine location",
        "UPDATE machines SET location_id = 'lb' WHERE id = 'ma'",
        "machines",
      ],
    ])("should reject the %s reference", async (_case, sql, table) => {
      const { sut } = await makeSut();

      const failure = await sut.query(sql).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: expect.stringContaining("violates foreign key constraint"),
        driverError: {
          code: "23503",
          table,
        },
      });
      expect(
        await sut.query(
          "SELECT tenant_id, location_id FROM machines WHERE id = 'ma'",
        ),
      ).toEqual([
        {
          tenant_id: "ta",
          location_id: "la",
        },
      ]);
    });
  });

  describe("when catalog values or referenced records would become invalid", () => {
    it.each([
      ["actors", "kind", "actors_kind_check"],
      ["actors", "status", "actors_status_check"],
      ["tenant_memberships", "status", "tenant_memberships_status_check"],
      ["locations", "kind", "locations_kind_check"],
    ])(
      "should reject an unknown %s.%s value",
      async (table, column, constraint) => {
        const { sut } = await makeSut();

        const failure = await sut
          .query(`UPDATE ${table} SET ${column} = 'unknown'`)
          .catch((error: unknown) => error);

        expect(failure).toBeInstanceOf(QueryFailedError);
        expect(failure).toMatchObject({
          message: expect.stringContaining("violates check constraint"),
          driverError: {
            code: "23514",
            constraint,
          },
        });
      },
    );

    it.each([
      ["tenant", "DELETE FROM tenants WHERE id = 'ta'"],
      ["member actor", "DELETE FROM actors WHERE id = 'u-dual'"],
      ["actor owner", "DELETE FROM actors WHERE id = 'u-owner'"],
      ["parent location", "DELETE FROM locations WHERE id = 'aa'"],
      ["machine location", "DELETE FROM locations WHERE id = 'la'"],
    ])(
      "should refuse deleting a referenced %s without cascading business records",
      async (_case, sql) => {
        const { sut } = await makeSut();

        const failure = await sut.query(sql).catch((error: unknown) => error);

        expect(failure).toBeInstanceOf(QueryFailedError);
        expect(failure).toMatchObject({
          message: expect.stringContaining("violates foreign key constraint"),
          driverError: {
            code: "23503",
          },
        });
        expect(
          await sut.query("SELECT count(*)::int AS count FROM machines"),
        ).toEqual([
          {
            count: 2,
          },
        ]);
        expect(
          await sut.query(
            "SELECT count(*)::int AS count FROM tenant_memberships",
          ),
        ).toEqual([
          {
            count: 3,
          },
        ]);
      },
    );
  });

  describe("when a migration must fail or be reversed", () => {
    it("should roll back partially created tables and history on conflict and permit corrected retry", async () => {
      const { sut } = await makeSut({
        migrate: false,
      });
      await sut.query(
        "CREATE TABLE actors (retained integer); INSERT INTO actors VALUES (42)",
      );

      const failure = await migrateDatabase(sut).catch(
        (error: unknown) => error,
      );

      expect(failure).toBeInstanceOf(RepositoryError);
      expect(failure).toMatchObject({
        message: "Database migrations failed.",
        cause: {
          code: "42P07",
        },
      });
      expect(await sut.query("SELECT to_regclass('tenants') AS name")).toEqual([
        {
          name: null,
        },
      ]);
      expect(await sut.query("SELECT retained FROM actors")).toEqual([
        {
          retained: 42,
        },
      ]);
      expect(
        await sut.query("SELECT count(*)::int AS count FROM migrations"),
      ).toEqual([
        {
          count: 0,
        },
      ]);
      await sut.query("DROP TABLE actors");
      expect(
        (await migrateDatabase(sut)).map((migration) => migration.name),
      ).toEqual(["Foundation1793318400000"]);
    });

    it("should reverse in dependency order without removing unrelated tables and allow reapplication", async () => {
      const { sut } = await makeSut();
      await sut.query(
        "CREATE TABLE unrelated_probe (id integer); INSERT INTO unrelated_probe VALUES (42)",
      );

      await sut.undoLastMigration({
        transaction: "all",
      });
      const tables: {
        tablename: string;
      }[] = await sut.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
      );

      expect(tables.map((row) => row.tablename)).toEqual([
        "migrations",
        "unrelated_probe",
      ]);
      expect(
        await sut.query(
          "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename <> 'migrations'",
        ),
      ).toEqual([]);
      expect(await sut.query("SELECT id FROM unrelated_probe")).toEqual([
        {
          id: 42,
        },
      ]);
      expect(
        await sut.query("SELECT count(*)::int AS count FROM migrations"),
      ).toEqual([
        {
          count: 0,
        },
      ]);
      expect(
        (await migrateDatabase(sut)).map((migration) => migration.name),
      ).toEqual(["Foundation1793318400000"]);
      expect(
        await sut.query(
          "SELECT count(*)::int AS count FROM pg_indexes WHERE schemaname = 'public' AND tablename <> 'migrations'",
        ),
      ).toEqual([
        {
          count: 13,
        },
      ]);
      expect(
        await sut.query("SELECT count(*)::int AS count FROM machines"),
      ).toEqual([
        {
          count: 0,
        },
      ]);
    });

    it("should keep the schema and history when an unrelated dependent table prevents rollback", async () => {
      const { sut } = await makeSut();
      await sut.query(
        "CREATE TABLE unrelated_dependent_probe (machine_id text REFERENCES machines(id))",
      );

      const failure = await sut
        .undoLastMigration({
          transaction: "all",
        })
        .catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: expect.stringContaining("other objects depend on it"),
        driverError: {
          code: "2BP01",
        },
      });
      expect(
        await sut.query("SELECT count(*)::int AS count FROM machines"),
      ).toEqual([
        {
          count: 2,
        },
      ]);
      expect(
        await sut.query("SELECT count(*)::int AS count FROM migrations"),
      ).toEqual([
        {
          count: 1,
        },
      ]);
      await sut.query("DROP TABLE unrelated_dependent_probe");
      await sut.undoLastMigration({
        transaction: "all",
      });
    });
  });

  describe("when the production build packages the foundation migration", () => {
    it("should execute the emitted standalone wrapper and both SQL assets with native Node", async () => {
      const { sut, connection } = await makeSut({
        migrate: false,
      });
      await closeDatabase(sut);
      const sourceDirectory = "src/platform/database/postgres/migrations/";
      const outputDirectory = "dist/platform/database/postgres/migrations/";
      for (const suffix of ["up.sql", "down.sql"]) {
        expect(
          await readFile(`${outputDirectory}0001-foundation.${suffix}`, "utf8"),
        ).toBe(
          await readFile(`${sourceDirectory}0001-foundation.${suffix}`, "utf8"),
        );
      }

      const result = await promisify(execFile)(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `
        import { DataSource } from "typeorm";
        import { Foundation1793318400000 } from "./dist/platform/database/postgres/migrations/0001-foundation.js";
        const connection = JSON.parse(process.env.FOUNDATION_TEST_CONNECTION);
        const source = new DataSource({ ...connection, type: "postgres", synchronize: false, migrations: [Foundation1793318400000] });
        await source.initialize();
        try {
          await source.runMigrations({ transaction: "all" });
          const rows = await source.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'migrations' ORDER BY tablename");
          if (rows.map(row => row.tablename).join(",") !== "actors,locations,machines,tenant_memberships,tenants") throw new Error("Packaged schema mismatch");
          await source.undoLastMigration({ transaction: "all" });
          const [{ count }] = await source.query("SELECT count(*)::int AS count FROM migrations");
          if (count !== 0) throw new Error("Packaged rollback mismatch");
          console.log("foundation-packaged-verification-ok");
        } finally { await source.destroy(); }
      `,
        ],
        {
          env: {
            ...process.env,
            FOUNDATION_TEST_CONNECTION: JSON.stringify(connection),
          },
        },
      );

      expect(result.stdout).toContain("foundation-packaged-verification-ok");
      expect(result.stderr).toBe("");
    });
  });
});
