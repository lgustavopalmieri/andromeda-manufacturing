import { Client } from "pg";
import type { DataSource } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { RepositoryError } from "@shared/errors/repository.error";
import { makeFoundation } from "@shared/tests/factories/foundation";
import { makeTenant } from "@shared/tests/factories/tenant/tenant.factory";
import { makeActor } from "@shared/tests/factories/identity/actor.factory";
import { makeLocation } from "@shared/tests/factories/location/location.factory";
import { makeMachine } from "@shared/tests/factories/machine/machine.factory";
import { setupPostgres } from "@shared/tests/testcontainers/setup-postgres";
import type { PostgresTestSetupInterface } from "@shared/tests/testcontainers/setup-postgres";
import {
  closeDatabase,
  createDataSource,
  initializeDatabase,
} from "platform/database/postgres/data-source";
import { migrateDatabase } from "platform/database/postgres/migrate";
import { ActorOrmEntity } from "platform/database/postgres/orm-entity/actor";
import { LocationOrmEntity } from "platform/database/postgres/orm-entity/location";
import { MachineOrmEntity } from "platform/database/postgres/orm-entity/machine";
import { TenantOrmEntity } from "platform/database/postgres/orm-entity/tenant";
import { TenantMembershipOrmEntity } from "platform/database/postgres/orm-entity/tenant-membership";
import type { BusinessFixtureInterface } from "./business-fixture";
import { BusinessSeedConflictError, seedBusiness } from "./seed-business";

interface MakeSutInterface {
  sut(): Promise<void>;
  dataSource: DataSource;
  snapshot(): Promise<BusinessFixtureInterface>;
}

let postgres: PostgresTestSetupInterface;
let inspector: Client;
const dataSources = new Set<DataSource>();

const makeSut = async (migrate = true): Promise<MakeSutInterface> => {
  const database = `business_seed_${dataSources.size}`;
  await inspector.query(`CREATE DATABASE "${database}"`);
  const dataSource = createDataSource({
    ...postgres.connection,
    database,
  });
  dataSources.add(dataSource);
  await initializeDatabase(dataSource);
  if (migrate) await migrateDatabase(dataSource);
  return {
    sut: () => seedBusiness(dataSource),
    dataSource,
    snapshot: async () => ({
      tenants: await dataSource.getRepository(TenantOrmEntity).find({
        order: {
          id: "ASC",
        },
      }),
      actors: await dataSource.getRepository(ActorOrmEntity).find({
        order: {
          id: "ASC",
        },
      }),
      memberships: await dataSource
        .getRepository(TenantMembershipOrmEntity)
        .find({
          order: {
            tenantId: "ASC",
            actorId: "ASC",
          },
        }),
      locations: await dataSource.getRepository(LocationOrmEntity).find({
        order: {
          id: "ASC",
        },
      }),
      machines: await dataSource.getRepository(MachineOrmEntity).find({
        order: {
          id: "ASC",
        },
      }),
    }),
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

describe("seedBusiness", () => {
  describe("when initializing the controlled business fixture", () => {
    it("should persist exactly two tenants, nine accountable global actors and the independent membership baseline", async () => {
      const { sut, snapshot } = await makeSut();

      await sut();

      const actual = await snapshot();
      expect(actual.tenants).toEqual([
        {
          id: "ta",
          code: "A",
        },
        {
          id: "tb",
          code: "B",
        },
      ]);
      expect(actual.actors.map((actor) => actor.id)).toEqual([
        "u-agent",
        "u-b-operator",
        "u-disabled",
        "u-dual",
        "u-none",
        "u-operator",
        "u-outsider",
        "u-owner",
        "u-service",
      ]);
      expect(actual.actors.every((actor) => actor.status === "active")).toBe(
        true,
      );
      const humans = actual.actors.filter((actor) => actor.kind === "human");
      expect(humans).toHaveLength(7);
      expect(humans.every((actor) => actor.ownerActorId === null)).toBe(true);
      expect(actual.actors.filter((actor) => actor.kind !== "human")).toEqual([
        {
          id: "u-agent",
          name: "AGENT",
          kind: "agent",
          status: "active",
          ownerActorId: "u-owner",
        },
        {
          id: "u-service",
          name: "SERVICE",
          kind: "service",
          status: "active",
          ownerActorId: "u-owner",
        },
      ]);
      expect(
        actual.memberships.map(
          ({ tenantId, actorId, status }) => `${tenantId}/${actorId}/${status}`,
        ),
      ).toEqual([
        "ta/u-disabled/suspended",
        "ta/u-dual/active",
        "ta/u-none/active",
        "ta/u-operator/active",
        "ta/u-owner/active",
        "tb/u-b-operator/active",
        "tb/u-dual/active",
      ]);
    });

    it("should retain the exact tenant-owned plant, area, line and machine identities", async () => {
      const { sut, snapshot } = await makeSut();
      await sut();

      const actual = await snapshot();

      expect(
        actual.locations.map(({ id, tenantId, kind, parentLocationId }) => [
          id,
          tenantId,
          kind,
          parentLocationId,
        ]),
      ).toEqual([
        ["a1a", "ta", "area", "p1a"],
        ["a1b", "tb", "area", "p1b"],
        ["l1a", "ta", "line", "a1a"],
        ["l1b", "tb", "line", "a1b"],
        ["p1a", "ta", "plant", null],
        ["p1b", "tb", "plant", null],
      ]);
      expect(actual.machines).toEqual([
        {
          id: "m1a",
          tenantId: "ta",
          code: "M1",
          locationId: "l1a",
        },
        {
          id: "m1b",
          tenantId: "tb",
          code: "M1",
          locationId: "l1b",
        },
        {
          id: "m2a",
          tenantId: "ta",
          code: "M2",
          locationId: "l1a",
        },
      ]);
    });

    it("should round-trip all complete fixture fields and actual SQL NULL values", async () => {
      const { sut, snapshot, dataSource } = await makeSut();
      const expected = makeFoundation();
      await sut();
      const actual = await snapshot();
      for (const key of [
        "tenants",
        "actors",
        "memberships",
        "locations",
        "machines",
      ] as const) {
        expect(actual[key]).toHaveLength(expected[key].length);
        expect(actual[key]).toEqual(
          expect.arrayContaining<unknown>(expected[key]),
        );
      }
      expect(
        await dataSource.query(
          "SELECT count(*)::integer AS count FROM actors WHERE owner_actor_id IS NULL",
        ),
      ).toEqual([
        {
          count: 7,
        },
      ]);
      expect(
        await dataSource.query(
          "SELECT id,kind,owner_actor_id FROM actors WHERE owner_actor_id IS NOT NULL ORDER BY id",
        ),
      ).toEqual([
        {
          id: "u-agent",
          kind: "agent",
          owner_actor_id: "u-owner",
        },
        {
          id: "u-service",
          kind: "service",
          owner_actor_id: "u-owner",
        },
      ]);
      expect(
        await dataSource.query(
          "SELECT id FROM locations WHERE parent_location_id IS NULL ORDER BY id",
        ),
      ).toEqual([
        {
          id: "p1a",
        },
        {
          id: "p1b",
        },
      ]);
    });

    it("should repeat identically without duplicating or changing rows", async () => {
      const { sut, snapshot } = await makeSut();
      await sut();
      const before = await snapshot();

      await sut();

      expect(await snapshot()).toEqual(before);
    });

    it("should preserve business state across reconnect and a repeated initializer", async () => {
      const { sut, snapshot, dataSource } = await makeSut();
      await sut();
      const before = await snapshot();
      await closeDatabase(dataSource);
      await initializeDatabase(dataSource);

      await sut();

      expect(await snapshot()).toEqual(before);
    });

    it("should complete an identical partial baseline without overwriting existing records", async () => {
      const { sut, snapshot, dataSource } = await makeSut();
      const fixture = makeFoundation();
      await dataSource.getRepository(TenantOrmEntity).insert(fixture.tenants);
      await dataSource.getRepository(ActorOrmEntity).insert(fixture.actors);

      await sut();

      const actual = await snapshot();
      expect(actual.memberships).toHaveLength(7);
      expect(actual.locations).toHaveLength(6);
      expect(actual.machines).toHaveLength(3);
      expect(actual.actors).toEqual(expect.arrayContaining(fixture.actors));
    });

    it("should preserve unrelated tenant and same-tenant records during initialization and repeat", async () => {
      const { sut, dataSource } = await makeSut();
      await dataSource.getRepository(TenantOrmEntity).insert([
        makeTenant(),
        makeTenant({
          id: "unrelated",
          code: "Other",
        }),
      ]);
      const actor = makeActor();
      const location = makeLocation({
        id: "extra-location",
        code: "EXTRA",
      });
      const machine = makeMachine({
        id: "extra-machine",
        code: "EXTRA",
        locationId: location.id,
      });
      await dataSource.getRepository(ActorOrmEntity).insert(actor);
      await dataSource.getRepository(LocationOrmEntity).insert(location);
      await dataSource.getRepository(MachineOrmEntity).insert(machine);

      await sut();
      await sut();

      expect(await dataSource.getRepository(TenantOrmEntity).count()).toBe(3);
      expect(
        await dataSource.getRepository(ActorOrmEntity).findOneByOrFail({
          id: actor.id,
        }),
      ).toEqual(actor);
      expect(
        await dataSource.getRepository(LocationOrmEntity).findOneByOrFail({
          id: location.id,
        }),
      ).toEqual(location);
      expect(
        await dataSource.getRepository(MachineOrmEntity).findOneByOrFail({
          id: machine.id,
        }),
      ).toEqual(machine);
    });

    it("should keep repeated M1 codes independently addressable by tenant and stable ID", async () => {
      const { sut, dataSource } = await makeSut();
      await sut();
      const repository = dataSource.getRepository(MachineOrmEntity);
      expect(
        await repository.findOneBy({
          tenantId: "ta",
          id: "m1b",
        }),
      ).toBeNull();
      expect(
        (
          await repository.findBy({
            tenantId: "ta",
            code: "M1",
          })
        ).map((row) => row.id),
      ).toEqual(["m1a"]);
      expect(
        (
          await repository.findBy({
            tenantId: "tb",
            code: "M1",
          })
        ).map((row) => row.id),
      ).toEqual(["m1b"]);
    });
  });

  describe("when existing fixture identities conflict", () => {
    it.each([
      ["tenant code", "UPDATE tenants SET code='Changed' WHERE id='ta'"],
      ["actor name", "UPDATE actors SET name='Changed' WHERE id='u-operator'"],
      [
        "actor status",
        "UPDATE actors SET status='inactive' WHERE id='u-disabled'",
      ],
      [
        "service owner",
        "UPDATE actors SET owner_actor_id=NULL WHERE id='u-service'",
      ],
      [
        "membership status",
        "UPDATE tenant_memberships SET status='suspended' WHERE tenant_id='ta' AND actor_id='u-dual'",
      ],
      ["location kind", "UPDATE locations SET kind='warehouse' WHERE id='l1a'"],
      [
        "location parent",
        "UPDATE locations SET parent_location_id='p1a' WHERE id='l1a'",
      ],
      ["machine code", "UPDATE machines SET code='Changed' WHERE id='m1b'"],
      [
        "machine location",
        "UPDATE machines SET location_id='a1a' WHERE id='m1a'",
      ],
    ])(
      "should refuse changed %s without repairing or deleting rows",
      async (_, query) => {
        const { sut, snapshot, dataSource } = await makeSut();
        await sut();
        await dataSource.query(query);
        const before = await snapshot();

        await expect(sut()).rejects.toThrowError(BusinessSeedConflictError);
        await expect(sut()).rejects.toThrowError(
          "Business seed conflicts with existing records.",
        );

        expect(await snapshot()).toEqual(before);
      },
    );

    it("should refuse a display code occupied by a different identity and roll back earlier inserts", async () => {
      const { sut, snapshot, dataSource } = await makeSut();
      await sut();
      await dataSource.getRepository(MachineOrmEntity).update(
        {
          id: "m1b",
        },
        {
          id: "different-id",
        },
      );
      await dataSource.getRepository(MachineOrmEntity).delete({
        id: "m2a",
      });
      await dataSource.getRepository(TenantMembershipOrmEntity).delete({
        tenantId: "ta",
        actorId: "u-none",
      });
      const before = await snapshot();

      await expect(sut()).rejects.toThrowError(BusinessSeedConflictError);

      expect(await snapshot()).toEqual(before);
    });

    it("should roll back all new tenant, actor, membership, location and machine rows on a late conflict", async () => {
      const { sut, snapshot, dataSource } = await makeSut();
      const fixture = makeFoundation();
      await dataSource
        .getRepository(TenantOrmEntity)
        .insert(fixture.tenants.filter((row) => row.id === "tb"));
      for (const location of fixture.locations.filter(
        (row) => row.tenantId === "tb",
      )) {
        await dataSource.getRepository(LocationOrmEntity).insert(location);
      }
      await dataSource.getRepository(MachineOrmEntity).insert(
        makeMachine({
          id: "m1b",
          tenantId: "tb",
          locationId: "l1b",
          code: "Changed",
        }),
      );
      const before = await snapshot();

      await expect(sut()).rejects.toThrowError(BusinessSeedConflictError);

      expect(await snapshot()).toEqual(before);
      await dataSource.getRepository(MachineOrmEntity).update(
        {
          id: "m1b",
        },
        {
          code: "M1",
        },
      );
      await sut();
      expect((await snapshot()).machines).toHaveLength(3);
    });
  });

  describe("when SQL initialization fails", () => {
    it("should roll back a mid-transaction database failure and allow explicit retry", async () => {
      const { sut, snapshot, dataSource } = await makeSut();
      await dataSource.query(`CREATE FUNCTION fail_seed_machine() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'injected fixture write failure'; END $$`);
      await dataSource.query(`CREATE TRIGGER fail_seed_machine BEFORE INSERT ON machines
        FOR EACH ROW WHEN (NEW.id='m2a') EXECUTE FUNCTION fail_seed_machine()`);
      const before = await snapshot();

      await expect(sut()).rejects.toThrowError(RepositoryError);
      await expect(sut()).rejects.toMatchObject({
        name: "RepositoryError",
        message: "Business fixture seed failed.",
      });

      expect(await snapshot()).toEqual(before);
      await dataSource.query("DROP TRIGGER fail_seed_machine ON machines");
      await dataSource.query("DROP FUNCTION fail_seed_machine()");
      await sut();
      expect((await snapshot()).machines).toHaveLength(3);
    });

    it("should require explicit migrations rather than generating the schema", async () => {
      const { sut, dataSource } = await makeSut(false);
      await expect(sut()).rejects.toThrowError(RepositoryError);
      await expect(sut()).rejects.toThrowError("Business fixture seed failed.");
      expect(
        await dataSource.query(
          "SELECT tablename FROM pg_tables WHERE schemaname='public'",
        ),
      ).toEqual([]);
      await migrateDatabase(dataSource);
      await sut();
      expect(await dataSource.getRepository(MachineOrmEntity).count()).toBe(3);
    });
  });
});
