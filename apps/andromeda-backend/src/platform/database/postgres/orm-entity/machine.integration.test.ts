import { Client } from "pg";
import type { DataSource, Repository } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { MachineEntityInterface } from "modules/machine/entity/machine.entity";
import { makeTenant } from "@shared/tests/factories/tenant/tenant.factory";
import { makeLocation } from "@shared/tests/factories/location/location.factory";
import { makeMachine } from "@shared/tests/factories/machine/machine.factory";
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
import { MachineOrmEntity } from "./machine";

interface MakeSutInterface {
  sut: Repository<MachineEntityInterface>;
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
  const database = `machine_mapping_${dataSources.size}`.replaceAll("-", "_");
  await inspector.query(`CREATE DATABASE "${database}"`);
  const dataSource = createDataSource({
    ...postgres.connection,
    database,
  });
  dataSources.add(dataSource);
  await initializeDatabase(dataSource);
  await migrateDatabase(dataSource);
  if (options.seedDependencies ?? true) {
    await dataSource.getRepository(TenantOrmEntity).insert([
      makeTenant(),
      makeTenant({
        id: "tb",
        code: "B",
      }),
    ]);
    await dataSource.getRepository(LocationOrmEntity).insert([
      makeLocation(),
      makeLocation({
        id: "l1b",
        tenantId: "tb",
      }),
      makeLocation({
        id: "l2a",
        code: "L2",
      }),
    ]);
  }
  return {
    sut: dataSource.getRepository(MachineOrmEntity),
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

describe("MachineOrmEntity", () => {
  describe("when mapping stable machine identity and current location", () => {
    it("should round-trip every field with a non-generated string ID", async () => {
      const { sut, dataSource } = await makeSut();
      const machine = makeMachine({
        id: "000001",
      });
      await sut.insert(machine);
      expect(
        await sut.findOneByOrFail({
          tenantId: machine.tenantId,
          id: machine.id,
        }),
      ).toEqual(machine);
      expect(
        await dataSource.query(
          "SELECT id,tenant_id,code,location_id FROM machines",
        ),
      ).toEqual([
        {
          id: machine.id,
          tenant_id: machine.tenantId,
          code: machine.code,
          location_id: machine.locationId,
        },
      ]);
    });

    it("should map direct SQL fields without adding authorization or location objects", async () => {
      const { sut, dataSource } = await makeSut();
      await dataSource.query(
        "INSERT INTO machines(id,tenant_id,code,location_id) VALUES('m1a','ta','M1','l1a')",
      );
      const found = await sut.findOneByOrFail({
        id: "m1a",
        tenantId: "ta",
      });
      expect(found).toEqual(makeMachine());
      expect(Object.keys(found).sort()).toEqual([
        "code",
        "id",
        "locationId",
        "tenantId",
      ]);
    });

    it("should preserve stable identity during location reassignment and persist across reconnect", async () => {
      const { sut, dataSource } = await makeSut();
      const machine = makeMachine();
      await sut.save(machine);
      await sut.update(
        {
          tenantId: machine.tenantId,
          id: machine.id,
        },
        {
          locationId: "l2a",
        },
      );
      await closeDatabase(dataSource);
      await initializeDatabase(dataSource);
      expect(
        await dataSource.getRepository(MachineOrmEntity).findOneByOrFail({
          tenantId: machine.tenantId,
          id: machine.id,
        }),
      ).toEqual({
        ...machine,
        locationId: "l2a",
      });
    });

    it("should keep reused display codes distinct by tenant and stable ID", async () => {
      const { sut, dataSource } = await makeSut();
      const first = makeMachine();
      const second = makeMachine({
        id: "m1b",
        tenantId: "tb",
        locationId: "l1b",
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
      expect(
        await sut.findOneBy({
          tenantId: "ta",
          id: first.code,
        }),
      ).toBeNull();
    });
  });

  describe("when mapped writes violate SQL integrity", () => {
    it.each([
      ["id", "id"],
      ["tenantId", "tenant_id"],
      ["code", "code"],
      ["locationId", "location_id"],
    ] as const)("should reject missing %s", async (field, column) => {
      const { sut, dataSource } = await makeSut();
      const partial: Partial<MachineEntityInterface> = makeMachine();
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

    it("should reject explicit NULL location, retaining the required location contract", async () => {
      const { sut, dataSource } = await makeSut();
      await expect(
        sut
          .createQueryBuilder()
          .insert()
          .values({
            ...makeMachine(),
            locationId: () => "NULL",
          })
          .execute(),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23502",
          column: "location_id",
        },
      });
    });

    it.each(["missing", "l1b"] as const)(
      "should reject missing or cross-tenant location %s",
      async (locationId) => {
        const { sut, dataSource } = await makeSut();
        await expect(
          sut.insert(
            makeMachine({
              locationId,
            }),
          ),
        ).rejects.toMatchObject({
          name: "QueryFailedError",
          message: expect.stringMatching(
            /violates (not-null|check|foreign key|unique) constraint/,
          ),
          driverError: {
            code: "23503",
            constraint: "machines_location_fk",
          },
        });
        expect(await sut.count()).toBe(0);
      },
    );

    it("should reject a nonexistent tenant", async () => {
      const { sut } = await makeSut({
        seedDependencies: false,
      });
      await expect(sut.insert(makeMachine())).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "machines_tenant_fk",
        },
      });
    });

    it.each(["identity", "code"] as const)(
      "should reject duplicate %s and preserve the original row",
      async (variant) => {
        const { sut, dataSource } = await makeSut();
        const machine = makeMachine();
        await sut.insert(machine);
        await expect(
          sut.insert(
            variant === "identity"
              ? makeMachine({
                  code: "OTHER",
                })
              : makeMachine({
                  id: "other",
                }),
          ),
        ).rejects.toMatchObject({
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
            id: machine.id,
          }),
        ).toEqual(machine);
        expect(await sut.count()).toBe(1);
      },
    );

    it("should roll back a failed reassignment, allow a corrected retry and restrict location deletion", async () => {
      const { sut, dataSource } = await makeSut();
      const machine = makeMachine();
      await sut.insert(machine);
      await expect(
        dataSource.transaction(async (manager) => {
          const repository = manager.getRepository(MachineOrmEntity);
          await repository.update(
            {
              id: machine.id,
              tenantId: machine.tenantId,
            },
            {
              code: "CHANGED",
            },
          );
          await repository.update(
            {
              id: machine.id,
              tenantId: machine.tenantId,
            },
            {
              locationId: "l1b",
            },
          );
        }),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "machines_location_fk",
        },
      });
      expect(
        await sut.findOneByOrFail({
          id: machine.id,
        }),
      ).toEqual(machine);
      await sut.update(
        {
          id: machine.id,
          tenantId: machine.tenantId,
        },
        {
          locationId: "l2a",
        },
      );
      await expect(
        dataSource.getRepository(LocationOrmEntity).delete({
          id: "l2a",
        }),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "machines_location_fk",
        },
      });
      expect(
        await sut.findOneByOrFail({
          id: machine.id,
        }),
      ).toEqual({
        ...machine,
        locationId: "l2a",
      });
    });
  });
});
