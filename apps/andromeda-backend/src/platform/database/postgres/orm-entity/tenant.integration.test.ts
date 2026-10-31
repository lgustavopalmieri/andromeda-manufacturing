import { Client } from "pg";
import { QueryFailedError } from "typeorm";
import type { DataSource, Repository } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { TenantEntityInterface } from "modules/tenant/entity/tenant.entity";
import { makeTenant } from "@shared/tests/factories/tenant/tenant.factory";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import { closeDatabase, createDataSource, initializeDatabase } from "../data-source";
import { migrateDatabase } from "../migrate";
import { TenantOrmEntity } from "./tenant";

interface MakeSutOptionsInterface {
  migrate?: boolean;
}

interface MakeSutInterface {
  sut: Repository<TenantEntityInterface>;
  dataSource: DataSource;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();

const makeSut = async (options: MakeSutOptionsInterface = {}): Promise<MakeSutInterface> => {
  const database = `tenant_mapping_${dataSources.size}`;
  await inspector.query(`CREATE DATABASE "${database}"`);
  const dataSource = createDataSource({
    ...postgres.connection,
    database,
  });
  dataSources.add(dataSource);
  await initializeDatabase(dataSource);
  if (options.migrate ?? true) await migrateDatabase(dataSource);
  return {
    sut: dataSource.getRepository(TenantOrmEntity),
    dataSource,
  };
};

beforeAll(async () => {
  postgres = await setupPostgres();
  inspector = new Client({
    ...postgres.connection,
    user: postgres.connection.username,
  });
  await inspector.connect();
});

afterEach(async () => {
  await Promise.all([...dataSources].map((dataSource) => closeDatabase(dataSource)));
});

afterAll(async () => {
  try {
    await Promise.all([...dataSources].map((dataSource) => closeDatabase(dataSource)));
  } finally {
    try { await inspector?.end(); } finally { await postgres?.teardown(); }
  }
});

describe("TenantOrmEntity", () => {
  describe("when registered in the production datasource", () => {
    it("should require the SQL migration rather than creating a table from metadata", async () => {
      const { sut, dataSource } = await makeSut({
        migrate: false,
      });
      const tenant = makeTenant();

      const failure = await sut.insert(tenant).catch((error: unknown) => error);
      const relation = await dataSource.query("SELECT to_regclass('tenants') AS name");

      expect(dataSource.hasMetadata(TenantOrmEntity)).toBe(true);
      expect(dataSource.options).toMatchObject({
        synchronize: false,
        dropSchema: false,
        migrationsRun: false,
      });
      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: 'relation "tenants" does not exist',
        driverError: {
          code: "42P01",
        },
      });
      expect(relation).toEqual([{
        name: null,
      }]);
    });

    it("should round-trip every tenant field and preserve a string ID with leading zeroes", async () => {
      const { sut, dataSource } = await makeSut();
      const tenant = makeTenant({
        id: "000001",
        code: "CUSTOMER-A",
      });

      await sut.insert(tenant);
      const found = await sut.findOneByOrFail({
        id: tenant.id,
      });
      const stored = await dataSource.query("SELECT id, code FROM tenants WHERE id = $1", [tenant.id]);

      expect(found).toEqual(tenant);
      expect(typeof found.id).toBe("string");
      expect(stored).toEqual([tenant]);
    });

    it("should read a row inserted directly by SQL without adding fields or interpreting its display code", async () => {
      const { sut, dataSource } = await makeSut();
      const tenant = makeTenant({
        code: "OWNER",
      });
      await dataSource.query("INSERT INTO tenants (id, code) VALUES ($1, $2)", [tenant.id, tenant.code]);

      const found = await sut.findOneByOrFail({
        id: tenant.id,
      });

      expect(found).toEqual(tenant);
      expect(Object.keys(found).sort()).toEqual(["code", "id"]);
    });

    it("should preserve tenant identity when its display code changes", async () => {
      const { sut, dataSource } = await makeSut();
      const tenant = makeTenant();
      const changed = makeTenant({
        code: "RENAMED",
      });
      await sut.insert(tenant);

      await sut.update({
        id: tenant.id,
      }, {
        code: changed.code,
      });

      expect(await sut.findOneByOrFail({
        id: tenant.id,
      })).toEqual(changed);
      expect(await dataSource.query("SELECT id, code FROM tenants")).toEqual([changed]);
    });

    it("should keep tenants with the same display code distinct by stable ID", async () => {
      const { sut } = await makeSut();
      const first = makeTenant({
        id: "ta",
        code: "SHARED",
      });
      const second = makeTenant({
        id: "tb",
        code: "SHARED",
      });

      await sut.insert([first, second]);
      await sut.update({
        id: first.id,
      }, {
        code: "CHANGED",
      });

      expect(await sut.findOneByOrFail({
        id: first.id,
      })).toEqual({
        ...first,
        code: "CHANGED",
      });
      expect(await sut.findOneByOrFail({
        id: second.id,
      })).toEqual(second);
    });

    it("should return absence for a missing ID even when that text matches a display code", async () => {
      const { sut } = await makeSut();
      const tenant = makeTenant({
        code: "missing-id",
      });
      await sut.insert(tenant);

      const found = await sut.findOneBy({
        id: tenant.code,
      });

      expect(found).toBeNull();
      expect(await sut.findOneByOrFail({
        id: tenant.id,
      })).toEqual(tenant);
    });

    it("should preserve persisted fields after the pool closes and reopens", async () => {
      const { sut, dataSource } = await makeSut();
      const tenant = makeTenant();
      await sut.insert(tenant);
      await closeDatabase(dataSource);

      await initializeDatabase(dataSource);
      const found = await dataSource.getRepository(TenantOrmEntity).findOneByOrFail({
        id: tenant.id,
      });

      expect(found).toEqual(tenant);
    });
  });

  describe("when a mapped write violates the retained SQL contract", () => {
    it.each(["id", "code"] as const)("should reject a missing required %s field", async (column) => {
      const { sut } = await makeSut();
      const tenant = makeTenant();
      const partial = column === "id" ? {
        code: tenant.code,
      } : {
        id: tenant.id,
      };

      const failure = await sut.insert(partial).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: expect.stringContaining("violates not-null constraint"),
        driverError: {
          code: "23502",
          table: "tenants",
          column,
        },
      });
      expect(await sut.count()).toBe(0);
    });

    it("should reject a duplicate primary ID without replacing the existing tenant", async () => {
      const { sut } = await makeSut();
      const tenant = makeTenant();
      await sut.insert(tenant);

      const failure = await sut.insert(makeTenant({
        code: "OTHER",
      })).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: expect.stringContaining("violates unique constraint"),
        driverError: {
          code: "23505",
          constraint: "tenants_pkey",
        },
      });
      expect(await sut.findOneByOrFail({
        id: tenant.id,
      })).toEqual(tenant);
      expect(await sut.count()).toBe(1);
    });

    it("should roll back mapped writes on a transaction failure and allow a corrected retry", async () => {
      const { sut, dataSource } = await makeSut();
      const tenant = makeTenant();

      const failure = await dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(TenantOrmEntity);
        await repository.insert(tenant);
        await repository.insert(makeTenant({
          code: "DUPLICATE",
        }));
      }).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryFailedError);
      expect(failure).toMatchObject({
        message: expect.stringContaining("violates unique constraint"),
        driverError: {
          code: "23505",
          constraint: "tenants_pkey",
        },
      });
      expect(await sut.count()).toBe(0);
      await sut.insert(tenant);
      expect(await sut.findOneByOrFail({
        id: tenant.id,
      })).toEqual(tenant);
    });
  });
});
