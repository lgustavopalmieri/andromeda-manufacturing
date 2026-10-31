import { Client } from "pg";
import type { DataSource, Repository } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { TenantMembershipEntityInterface } from "modules/tenant/entity/tenant-membership.entity";
import { makeTenant } from "@shared/tests/factories/tenant/tenant.factory";
import { makeActor } from "@shared/tests/factories/identity/actor.factory";
import { makeTenantMembership } from "@shared/tests/factories/tenant/tenant-membership.factory";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import { closeDatabase, createDataSource, initializeDatabase } from "../data-source";
import { migrateDatabase } from "../migrate";
import { TenantOrmEntity } from "./tenant";
import { ActorOrmEntity } from "./actor";
import { TenantMembershipOrmEntity } from "./tenant-membership";

interface MakeSutInterface {
  sut: Repository<TenantMembershipEntityInterface>;
  dataSource: DataSource;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();

const makeSut = async (): Promise<MakeSutInterface> => {
  const database = `tenant-membership_mapping_${dataSources.size}`.replaceAll("-", "_");
  await inspector.query(`CREATE DATABASE "${database}"`);
  const dataSource = createDataSource({
    ...postgres.connection,
    database,
  });
  dataSources.add(dataSource);
  await initializeDatabase(dataSource);
  await migrateDatabase(dataSource);
  await dataSource.getRepository(TenantOrmEntity).insert([makeTenant(), makeTenant({
    id: "tb",
    code: "B",
  })]);
  await dataSource.getRepository(ActorOrmEntity).insert(makeActor());
  return {
    sut: dataSource.getRepository(TenantMembershipOrmEntity),
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

describe("TenantMembershipOrmEntity", () => {


  describe("when mapping tenant-specific participation", () => {
    it.each(["active", "suspended", "removed"] as const)("should round-trip %s and map the complete composite identity", async (status) => {
      const { sut, dataSource } = await makeSut();
      const membership = makeTenantMembership({
        status,
      });
      await sut.insert(membership);
      expect(await sut.findOneByOrFail({
        tenantId: membership.tenantId,
        actorId: membership.actorId,
      })).toEqual(membership);
      expect(await dataSource.query("SELECT tenant_id,actor_id,status FROM tenant_memberships")).toEqual([{
        tenant_id: membership.tenantId,
        actor_id: membership.actorId,
        status,
      }]);
      expect(sut.metadata.primaryColumns.map((column) => column.propertyName)).toEqual(["tenantId", "actorId"]);
    });

    it("should read directly inserted SQL without adding an artificial ID", async () => {
      const { sut, dataSource } = await makeSut();
      await dataSource.query("INSERT INTO tenant_memberships(tenant_id,actor_id,status) VALUES('ta','u-actor','active')");
      const found = await sut.findOneByOrFail({
        tenantId: "ta",
        actorId: "u-actor",
      });
      expect(found).toEqual(makeTenantMembership());
      expect(Object.keys(found).sort()).toEqual(["actorId", "status", "tenantId"]);
    });

    it("should update A independently of the same global actor's B participation", async () => {
      const { sut, dataSource } = await makeSut();
      await sut.save([makeTenantMembership(), makeTenantMembership({
        tenantId: "tb",
      })]);
      await sut.update({
        tenantId: "ta",
        actorId: "u-actor",
      }, {
        status: "suspended",
      });
      expect(await sut.findOneByOrFail({
        tenantId: "ta",
        actorId: "u-actor",
      })).toEqual(makeTenantMembership({
        status: "suspended",
      }));
      expect(await sut.findOneByOrFail({
        tenantId: "tb",
        actorId: "u-actor",
      })).toEqual(makeTenantMembership({
        tenantId: "tb",
      }));
      expect(await dataSource.getRepository(ActorOrmEntity).findOneByOrFail({
        id: "u-actor",
      })).toEqual(makeActor());
      await closeDatabase(dataSource);
      await initializeDatabase(dataSource);
      expect(await dataSource.getRepository(TenantMembershipOrmEntity).count()).toBe(2);
    });
  });

  describe("when a mapped write violates SQL integrity", () => {
    it.each([["tenantId", "tenant_id"], ["actorId", "actor_id"], ["status", "status"]] as const)("should reject missing %s", async (field, column) => {
      const { sut, dataSource } = await makeSut();
      const partial: Partial<TenantMembershipEntityInterface> = makeTenantMembership();
      delete partial[field];
      await expect(sut.insert(partial)).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(/violates (not-null|check|foreign key|unique) constraint/),
        driverError: {
          code: "23502",
          column,
        },
      });
      expect(await sut.count()).toBe(0);
    });

    it.each([["tenantId", "tenant_memberships_tenant_fk"], ["actorId", "tenant_memberships_actor_fk"]] as const)("should reject an orphan %s", async (field, constraint) => {
      const { sut, dataSource } = await makeSut();
      await expect(sut.insert(makeTenantMembership({
        [field]: "missing",
      }))).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(/violates (not-null|check|foreign key|unique) constraint/),
        driverError: {
          code: "23503",
          constraint,
        },
      });
      expect(await sut.count()).toBe(0);
    });

    it("should reject a status outside the retained catalog", async () => {
      const { sut, dataSource } = await makeSut();
      await expect(sut.createQueryBuilder().insert().values({
        ...makeTenantMembership(),
        status: () => "'invalid'",
      }).execute()).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(/violates (not-null|check|foreign key|unique) constraint/),
        driverError: {
          code: "23514",
          constraint: "tenant_memberships_status_check",
        },
      });
    });

    it("should reject duplicate participation and roll back a failed multi-tenant transaction", async () => {
      const { sut, dataSource } = await makeSut();
      await expect(dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(TenantMembershipOrmEntity);
        await repository.insert([makeTenantMembership(), makeTenantMembership({
          tenantId: "tb",
        })]);
        await repository.insert(makeTenantMembership({
          status: "removed",
        }));
      })).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(/violates (not-null|check|foreign key|unique) constraint/),
        driverError: {
          code: "23505",
          constraint: "tenant_memberships_pkey",
        },
      });
      expect(await sut.count()).toBe(0);
      await sut.insert(makeTenantMembership());
      expect(await sut.findOneByOrFail({
        tenantId: "ta",
        actorId: "u-actor",
      })).toEqual(makeTenantMembership());
    });
  });
});
