import { Client } from "pg";
import type { DataSource, Repository } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { ActorEntityInterface } from "modules/identity/entity/actor.entity";
import { makeTenant } from "@shared/tests/factories/tenant/tenant.factory";
import { makeActor } from "@shared/tests/factories/identity/actor.factory";
import { makeTenantMembership } from "@shared/tests/factories/tenant/tenant-membership.factory";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import {
  closeDatabase,
  createDataSource,
  initializeDatabase,
} from "../data-source";
import { migrateDatabase } from "../migrate";
import { TenantOrmEntity } from "./tenant";
import { ActorOrmEntity } from "./actor";
import { TenantMembershipOrmEntity } from "./tenant-membership";

interface MakeSutInterface {
  sut: Repository<ActorEntityInterface>;
  dataSource: DataSource;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();

const makeSut = async (): Promise<MakeSutInterface> => {
  const database = `actor_mapping_${dataSources.size}`.replaceAll("-", "_");
  await inspector.query(`CREATE DATABASE "${database}"`);
  const dataSource = createDataSource({
    ...postgres.connection,
    database,
  });
  dataSources.add(dataSource);
  await initializeDatabase(dataSource);
  await migrateDatabase(dataSource);
  return {
    sut: dataSource.getRepository(ActorOrmEntity),
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

describe("ActorOrmEntity", () => {
  describe("when reading and writing the global directory", () => {
    it.each(["human", "service", "agent"] as const)(
      "should round-trip every field of a %s actor including its owner",
      async (kind) => {
        const { sut, dataSource } = await makeSut();
        const owner = makeActor({
          id: "000001",
          name: "Owner",
        });
        const actor = makeActor({
          kind,
          status: "inactive",
          ownerActorId: owner.id,
        });
        await sut.insert(owner);
        await sut.insert(actor);

        expect(
          await sut.findOneByOrFail({
            id: actor.id,
          }),
        ).toEqual(actor);
        expect(
          await dataSource.query(
            "SELECT id, name, kind, status, owner_actor_id FROM actors WHERE id=$1",
            [actor.id],
          ),
        ).toEqual([
          {
            id: actor.id,
            name: actor.name,
            kind,
            status: "inactive",
            owner_actor_id: owner.id,
          },
        ]);
        expect(await dataSource.getRepository(TenantOrmEntity).count()).toBe(0);
        expect(
          await dataSource.getRepository(TenantMembershipOrmEntity).count(),
        ).toBe(0);
      },
    );

    it("should preserve explicit NULL owner in saved and hydrated complete entities", async () => {
      const { sut, dataSource } = await makeSut();
      const actor = makeActor();
      const saved = await sut.save(actor);
      expect(saved).toEqual(actor);
      expect(Object.hasOwn(saved, "ownerActorId")).toBe(true);
      const found = await sut.findOneByOrFail({
        id: actor.id,
      });
      const queried = await sut
        .createQueryBuilder("actor")
        .where("actor.id = :id", {
          id: actor.id,
        })
        .getOneOrFail();
      expect(found).toEqual(actor);
      expect(Object.hasOwn(found, "ownerActorId")).toBe(true);
      expect(queried).toEqual(actor);
      expect(Object.hasOwn(queried, "ownerActorId")).toBe(true);
      expect(
        await dataSource.query("SELECT owner_actor_id FROM actors"),
      ).toEqual([
        {
          owner_actor_id: null,
        },
      ]);
      await closeDatabase(dataSource);
      await initializeDatabase(dataSource);
      const reopened = await dataSource
        .getRepository(ActorOrmEntity)
        .findOneByOrFail({
          id: actor.id,
        });
      expect(reopened).toEqual(actor);
      expect(Object.hasOwn(reopened, "ownerActorId")).toBe(true);
    });

    it("should read SQL NULL as an explicit owner field without adding membership or roles", async () => {
      const { sut, dataSource } = await makeSut();
      const actor = makeActor({
        name: "OWNER",
      });
      await dataSource.query(
        "INSERT INTO actors(id,name,kind,status,owner_actor_id) VALUES($1,$2,$3,$4,NULL)",
        [actor.id, actor.name, actor.kind, actor.status],
      );
      const found = await sut.findOneByOrFail({
        id: actor.id,
      });
      expect(found).toEqual(actor);
      expect(Object.keys(found).sort()).toEqual([
        "id",
        "kind",
        "name",
        "ownerActorId",
        "status",
      ]);
    });

    it("should preserve owner on a partial update and clear it through a typed nullable update", async () => {
      const { sut, dataSource } = await makeSut();
      const owner = makeActor({
        id: "owner",
      });
      const actor = makeActor();
      await sut.insert([owner, actor]);
      await sut.update(
        {
          id: actor.id,
        },
        {
          ownerActorId: owner.id,
        },
      );
      await sut.save({
        id: actor.id,
        name: "Renamed",
      });
      expect(
        await sut.findOneByOrFail({
          id: actor.id,
        }),
      ).toEqual({
        ...actor,
        name: "Renamed",
        ownerActorId: owner.id,
      });
      await sut.update(
        {
          id: actor.id,
        },
        {
          ownerActorId: null,
        },
      );
      const found = await sut.findOneByOrFail({
        id: actor.id,
      });
      expect(found).toEqual({
        ...actor,
        name: "Renamed",
      });
      expect(Object.hasOwn(found, "ownerActorId")).toBe(true);
      expect(
        await dataSource.query(
          "SELECT owner_actor_id FROM actors WHERE id=$1",
          [actor.id],
        ),
      ).toEqual([
        {
          owner_actor_id: null,
        },
      ]);
    });

    it("should keep one global actor linked to independent tenant memberships", async () => {
      const { sut, dataSource } = await makeSut();
      const actor = makeActor();
      await sut.insert(actor);
      await dataSource.getRepository(TenantOrmEntity).insert([
        makeTenant(),
        makeTenant({
          id: "tb",
          code: "B",
        }),
      ]);
      await dataSource.getRepository(TenantMembershipOrmEntity).insert([
        makeTenantMembership(),
        makeTenantMembership({
          tenantId: "tb",
          status: "suspended",
        }),
      ]);
      await sut.update(
        {
          id: actor.id,
        },
        {
          status: "inactive",
        },
      );
      expect(await sut.count()).toBe(1);
      expect(
        await dataSource.getRepository(TenantMembershipOrmEntity).find({
          order: {
            tenantId: "ASC",
          },
        }),
      ).toEqual([
        makeTenantMembership(),
        makeTenantMembership({
          tenantId: "tb",
          status: "suspended",
        }),
      ]);
    });
  });

  describe("when the retained SQL contract rejects a write", () => {
    it.each(["id", "name", "kind", "status"] as const)(
      "should reject omitted required %s",
      async (field) => {
        const { sut } = await makeSut();
        const partial: Partial<ActorEntityInterface> = makeActor();
        delete partial[field];
        await expect(sut.insert(partial)).rejects.toMatchObject({
          name: "QueryFailedError",
          message: expect.stringMatching(
            /violates (not-null|check|foreign key|unique) constraint/,
          ),
          driverError: {
            code: "23502",
            column: field,
          },
        });
        expect(await sut.count()).toBe(0);
      },
    );

    it.each(["kind", "status"] as const)(
      "should reject an invalid %s through SQL catalog checks",
      async (field) => {
        const { sut } = await makeSut();
        await expect(
          sut
            .createQueryBuilder()
            .insert()
            .values({
              ...makeActor(),
              [field]: () => "'invalid'",
            })
            .execute(),
        ).rejects.toMatchObject({
          name: "QueryFailedError",
          message: expect.stringMatching(
            /violates (not-null|check|foreign key|unique) constraint/,
          ),
          driverError: {
            code: "23514",
            constraint: `actors_${field}_check`,
          },
        });
        expect(await sut.count()).toBe(0);
      },
    );

    it("should reject missing owners and deletion of a referenced owner", async () => {
      const { sut } = await makeSut();
      const owner = makeActor({
        id: "owner",
      });
      const actor = makeActor({
        ownerActorId: owner.id,
      });
      await expect(sut.insert(actor)).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "actors_owner_actor_fk",
        },
      });
      await sut.insert(owner);
      await sut.insert(actor);
      await expect(
        sut.delete({
          id: owner.id,
        }),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23503",
          constraint: "actors_owner_actor_fk",
        },
      });
      expect(
        await sut.findOneByOrFail({
          id: actor.id,
        }),
      ).toEqual(actor);
    });

    it("should roll back duplicate identity writes and allow a corrected retry", async () => {
      const { sut, dataSource } = await makeSut();
      const actor = makeActor();
      await expect(
        dataSource.transaction(async (manager) => {
          const repository = manager.getRepository(ActorOrmEntity);
          await repository.insert(actor);
          await repository.insert({
            ...actor,
            name: "Duplicate",
          });
        }),
      ).rejects.toMatchObject({
        name: "QueryFailedError",
        message: expect.stringMatching(
          /violates (not-null|check|foreign key|unique) constraint/,
        ),
        driverError: {
          code: "23505",
          constraint: "actors_pkey",
        },
      });
      expect(await sut.count()).toBe(0);
      await sut.insert(actor);
      expect(
        await sut.findOneByOrFail({
          id: actor.id,
        }),
      ).toEqual(actor);
    });
  });
});
