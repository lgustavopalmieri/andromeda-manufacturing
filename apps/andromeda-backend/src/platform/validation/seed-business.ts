import type {
  DataSource,
  EntityManager,
  EntitySchema,
  FindOptionsWhere,
  ObjectLiteral,
} from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";
import { ActorOrmEntity } from "platform/database/postgres/orm-entity/actor";
import { LocationOrmEntity } from "platform/database/postgres/orm-entity/location";
import { MachineOrmEntity } from "platform/database/postgres/orm-entity/machine";
import { TenantOrmEntity } from "platform/database/postgres/orm-entity/tenant";
import { TenantMembershipOrmEntity } from "platform/database/postgres/orm-entity/tenant-membership";
import { createBusinessFixture } from "./business-fixture";
import { validateBusinessHierarchy } from "./validate-business-hierarchy";

export class BusinessSeedConflictError extends Error {
  public readonly name = "BusinessSeedConflictError";

  public constructor() {
    super("Business seed conflicts with existing records.");
  }
}

const insertOrVerify = async <Entity extends ObjectLiteral>(
  manager: EntityManager,
  schema: EntitySchema<Entity>,
  records: Entity[],
  identity: (record: Entity) => FindOptionsWhere<Entity>,
): Promise<void> => {
  const repository = manager.getRepository(schema);
  for (const record of records) {
    await repository
      .createQueryBuilder()
      .insert()
      .values(record)
      .orIgnore()
      .execute();
    const existing = await repository.findOneBy(identity(record));
    if (
      !existing ||
      Object.keys(record).some((key) => existing[key] !== record[key])
    ) {
      throw new BusinessSeedConflictError();
    }
  }
};

export const seedBusiness = async (dataSource: DataSource): Promise<void> => {
  const fixture = createBusinessFixture();
  const locations = validateBusinessHierarchy(fixture);
  try {
    await dataSource.transaction(async (manager) => {
      await insertOrVerify(
        manager,
        TenantOrmEntity,
        fixture.tenants,
        (record) => ({
          id: record.id,
        }),
      );
      await insertOrVerify(
        manager,
        ActorOrmEntity,
        fixture.actors,
        (record) => ({
          id: record.id,
        }),
      );
      await insertOrVerify(
        manager,
        TenantMembershipOrmEntity,
        fixture.memberships,
        (record) => ({
          tenantId: record.tenantId,
          actorId: record.actorId,
        }),
      );
      await insertOrVerify(manager, LocationOrmEntity, locations, (record) => ({
        tenantId: record.tenantId,
        id: record.id,
      }));
      await insertOrVerify(
        manager,
        MachineOrmEntity,
        fixture.machines,
        (record) => ({
          tenantId: record.tenantId,
          id: record.id,
        }),
      );
    });
  } catch (error) {
    if (error instanceof BusinessSeedConflictError) throw error;
    throw new RepositoryError("Business fixture seed failed.", {
      cause: error,
    });
  }
};
