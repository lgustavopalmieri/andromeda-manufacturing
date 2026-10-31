import { Client } from "pg";
import type { DataSource, Repository } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { LocationEntityInterface } from "modules/location/entity/location.entity";
import { makeTenant } from "@shared/tests/factories/tenant/tenant.factory";
import { makeLocation } from "@shared/tests/factories/location/location.factory";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import {
  closeDatabase,
  createDataSource,
  initializeDatabase,
} from "../data-source";
import { migrateDatabase } from "../migrate";
import { TenantOrmEntity } from "./tenant";
import { LocationOrmEntity } from "./location";

interface MakeSutInterface {
  sut: Repository<LocationEntityInterface>;
  dataSource: DataSource;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();

interface MakeSutOptionsInterface {
  seedDependencies?: boolean;
}

const makeSut = async (
  options: MakeSutOptionsInterface = {},
): Promise<MakeSutInterface> => {
  const database = `location_mapping_${dataSources.size}`.replaceAll("-", "_");
  await inspector.query(`CREATE DATABASE "${database}"`);
  const dataSource = createDataSource({
    ...postgres.connection,
    database,
  });
  dataSources.add(dataSource);
  await initializeDatabase(dataSource);
  await migrateDatabase(dataSource);
  if (options.seedDependencies ?? true)
    await dataSource.getRepository(TenantOrmEntity).insert([
      makeTenant(),
      makeTenant({
        id: "tb",
        code: "B",
      }),
    ]);
  return {
    sut: dataSource.getRepository(LocationOrmEntity),
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

describe("LocationOrmEntity", () => {
  describe("when mapping tenant-owned hierarchy records", () => {
    it.each(["plant", "area", "line", "warehouse"] as const)(
      "should round-trip every field and the %s kind",
      async (kind) => {
        const { sut, dataSource } = await makeSut();
        const parent = makeLocation({
          id: "root",
          code: "ROOT",
        });
        const location = makeLocation({
          id: "000001",
          kind,
          parentLocationId: parent.id,
        });
        await sut.insert(parent);
        await sut.insert(location);
        expect(
          await sut.findOneByOrFail({
            tenantId: location.tenantId,
            id: location.id,
          }),
        ).toEqual(location);
        expect(
          await dataSource.query(
            "SELECT id,tenant_id,code,kind,parent_location_id FROM locations WHERE id=$1",
            [location.id],
          ),
        ).toEqual([
          {
            id: location.id,
            tenant_id: location.tenantId,
            code: location.code,
            kind,
            parent_location_id: parent.id,
          },
        ]);
      },
    );

    it("should preserve explicit NULL root parent in saved and hydrated complete entities", async () => {
      const { sut, dataSource } = await makeSut();
      const location = makeLocation();
      const saved = await sut.save(location);
      expect(saved).toEqual(location);
      expect(Object.hasOwn(saved, "parentLocationId")).toBe(true);
      const found = await sut.findOneByOrFail({
        id: location.id,
      });
      const queried = await sut
        .createQueryBuilder("location")
        .where("location.id = :id", {
          id: location.id,
        })
        .getOneOrFail();
      expect(found).toEqual(location);
      expect(Object.hasOwn(found, "parentLocationId")).toBe(true);
      expect(queried).toEqual(location);
      expect(Object.hasOwn(queried, "parentLocationId")).toBe(true);
      expect(
        await dataSource.query("SELECT parent_location_id FROM locations"),
      ).toEqual([
        {
          parent_location_id: null,
        },
      ]);
      await closeDatabase(dataSource);
      await initializeDatabase(dataSource);
      const reopened = await dataSource
        .getRepository(LocationOrmEntity)
        .findOneByOrFail({
          id: location.id,
        });
      expect(reopened).toEqual(location);
      expect(Object.hasOwn(reopened, "parentLocationId")).toBe(true);
    });

    it("should map a directly inserted SQL root to the exact pure contract", async () => {
      const { sut, dataSource } = await makeSut();
      const location = makeLocation();
      await dataSource.query(
        "INSERT INTO locations(id,tenant_id,code,kind,parent_location_id) VALUES($1,$2,$3,$4,NULL)",
        [location.id, location.tenantId, location.code, location.kind],
      );
      const found = await sut.findOneByOrFail({
        id: location.id,
      });
      expect(found).toEqual(location);
      expect(Object.keys(found).sort()).toEqual([
        "code",
        "id",
        "kind",
        "parentLocationId",
        "tenantId",
      ]);
    });

    it("should preserve parent on a partial update and clear it through a typed nullable update", async () => {
      const { sut, dataSource } = await makeSut();
      const root = makeLocation({
        id: "root",
        code: "ROOT",
      });
      const location = makeLocation();
      await sut.insert([root, location]);
      await sut.update(
        {
          id: location.id,
          tenantId: location.tenantId,
        },
        {
          parentLocationId: root.id,
        },
      );
      await sut.save({
        id: location.id,
        code: "RENAMED",
      });
      expect(
        await sut.findOneByOrFail({
          id: location.id,
        }),
      ).toEqual({
        ...location,
        code: "RENAMED",
        parentLocationId: root.id,
      });
      await sut.update(
        {
          id: location.id,
          tenantId: location.tenantId,
        },
        {
          parentLocationId: null,
        },
      );
      const found = await sut.findOneByOrFail({
        id: location.id,
      });
      expect(found).toEqual({
        ...location,
        code: "RENAMED",
      });
      expect(Object.hasOwn(found, "parentLocationId")).toBe(true);
    });

    it("should allow reused codes across tenants while stable scoped ID reads remain distinct", async () => {
      const { sut, dataSource } = await makeSut();
      const first = makeLocation();
      const second = makeLocation({
        id: "l1b",
        tenantId: "tb",
      });
      await sut.insert([first, second]);
      expect(
        await sut.findOneByOrFail({
          tenantId: "ta",
          id: first.id,
        }),
      ).toEqual(first);
      expect(
        await sut.findOneByOrFail({
          tenantId: "tb",
          id: second.id,
        }),
      ).toEqual(second);
      expect(
        await sut.findOneBy({
          tenantId: "ta",
          id: second.id,
        }),
      ).toBeNull();
    });
  });

  describe("when mapped writes violate SQL integrity", () => {
    it.each([
      ["id", "id"],
      ["tenantId", "tenant_id"],
      ["code", "code"],
      ["kind", "kind"],
    ] as const)("should reject missing %s", async (field, column) => {
      const { sut, dataSource } = await makeSut();
      const partial: Partial<LocationEntityInterface> = makeLocation();
      delete partial[field];
      await expect(sut.insert(partial)).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23502",
          column,
        },
      });
      expect(await sut.count()).toBe(0);
    });

    it("should reject kinds outside the SQL catalog", async () => {
      const { sut, dataSource } = await makeSut();
      await expect(
        sut
          .createQueryBuilder()
          .insert()
          .values({
            ...makeLocation(),
            kind: () => "'invalid'",
          })
          .execute(),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23514",
          constraint: "locations_kind_check",
        },
      });
    });

    it.each(["missing", "foreign"] as const)(
      "should reject a %s parent",
      async (variant) => {
        const { sut, dataSource } = await makeSut();
        if (variant === "foreign")
          await sut.insert(
            makeLocation({
              id: "foreign",
              tenantId: "tb",
            }),
          );
        await expect(
          sut.insert(
            makeLocation({
              parentLocationId: variant,
            }),
          ),
        ).rejects.toMatchObject({
          name: "QueryFailedError",
          message: expect.stringMatching(
            /violates (not-null|check|foreign key|unique) constraint/,
          ),
          driverError: {
            code: "23503",
            constraint: "locations_parent_fk",
          },
        });
        expect(
          await sut.findOneBy({
            id: "l1a",
          }),
        ).toBeNull();
      },
    );

    it("should reject an orphan tenant", async () => {
      const { sut } = await makeSut({
        seedDependencies: false,
      });
      await expect(sut.insert(makeLocation())).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "locations_tenant_fk",
        },
      });
    });

    it.each(["identity", "code"] as const)(
      "should preserve the original location after duplicate %s failure",
      async (variant) => {
        const { sut, dataSource } = await makeSut();
        const location = makeLocation();
        await sut.insert(location);
        const duplicate =
          variant === "identity"
            ? makeLocation({
                code: "OTHER",
              })
            : makeLocation({
                id: "other",
              });
        await expect(sut.insert(duplicate)).rejects.toMatchObject({
          name: "QueryFailedError",
          message: expect.stringMatching(
            /violates (not-null|check|foreign key|unique) constraint/,
          ),
          driverError: {
            code: "23505",
          },
        });
        expect(
          await sut.findOneByOrFail({
            id: location.id,
          }),
        ).toEqual(location);
        expect(await sut.count()).toBe(1);
      },
    );

    it("should roll back a failed hierarchy transaction, then allow a valid retry and restrict parent deletion", async () => {
      const { sut, dataSource } = await makeSut();
      const root = makeLocation({
        id: "root",
        code: "ROOT",
      });
      const child = makeLocation({
        parentLocationId: root.id,
      });
      await expect(
        dataSource.transaction(async (manager) => {
          const repository = manager.getRepository(LocationOrmEntity);
          await repository.insert(root);
          await repository.insert({
            ...child,
            parentLocationId: "missing",
          });
        }),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "locations_parent_fk",
        },
      });
      expect(await sut.count()).toBe(0);
      await sut.insert(root);
      await sut.insert(child);
      await expect(
        sut.delete({
          id: root.id,
        }),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "locations_parent_fk",
        },
      });
      expect(
        await sut.findOneByOrFail({
          id: child.id,
        }),
      ).toEqual(child);
    });
  });
});
