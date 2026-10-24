import type { DataSource, EntityManager } from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";
import { TypeormOutboxMessageRepository } from "platform/database/postgres/typeorm/outbox-message.typeorm-repository";
import {
  AccessPolicyRevisionOrmEntity,
  PermissionDefinitionOrmEntity,
  RoleDefinitionOrmEntity,
  RoleRevisionOrmEntity,
} from "platform/database/postgres/typeorm/entities/access-catalog.orm-entities";
import {
  OwnerAppointmentOrmEntity,
  TenantOnboardingRequestOrmEntity,
  TenantOrmEntity,
} from "platform/database/postgres/typeorm/entities/tenant.orm-entities";
import type {
  AccessPolicyRevisionEntityInterface,
  PermissionDefinitionEntityInterface,
  RoleDefinitionEntityInterface,
  RoleRevisionEntityInterface,
} from "../../../../../access-governance/entity/access-catalog.entity";
import type {
  OwnerAppointmentEntityInterface,
  TenantEntityInterface,
  TenantOnboardingRequestEntityInterface,
} from "../../../../entity/tenant.entity";
import { RecordAuditEventTypeormRepository } from "../../../../../audit-trail/features/record-event/outbound/typeorm/record-audit-event.typeorm-repositories";
import type { RequestOnboardingTransactionContextInterface } from "../../application/interfaces.js";

type TypeormManager = DataSource | EntityManager;

export class RequestOnboardingTypeormRepositories
  implements RequestOnboardingTransactionContextInterface
{
  public readonly auditEvents: RecordAuditEventTypeormRepository;
  public readonly outbox: TypeormOutboxMessageRepository;

  public constructor(private readonly manager: TypeormManager) {
    this.auditEvents = new RecordAuditEventTypeormRepository(manager);
    this.outbox = new TypeormOutboxMessageRepository(manager);
  }

  public readonly onboardingRequests = {
    lockByCorrelationId: async (correlationId: string): Promise<void> => {
      try {
        await this.manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [correlationId]);
      } catch (error) {
        throw new RepositoryError("Failed to lock onboarding correlation.", { cause: error });
      }
    },
    findByCorrelationId: async (correlationId: string): Promise<TenantOnboardingRequestEntityInterface | null> => {
      try {
        return await this.manager
          .getRepository(TenantOnboardingRequestOrmEntity)
          .findOneBy({ correlationId });
      } catch (error) {
        throw new RepositoryError("Failed to load onboarding request.", { cause: error });
      }
    },
    insert: async (request: TenantOnboardingRequestEntityInterface): Promise<void> => {
      try {
        await this.manager.getRepository(TenantOnboardingRequestOrmEntity).insert(request);
      } catch (error) {
        throw new RepositoryError("Failed to store onboarding request.", { cause: error });
      }
    },
  };

  public readonly tenants = {
    insert: async (tenant: TenantEntityInterface): Promise<void> => {
      try {
        await this.manager.getRepository(TenantOrmEntity).insert(tenant);
      } catch (error) {
        throw new RepositoryError("Failed to store tenant.", { cause: error });
      }
    },
  };

  public readonly ownerAppointments = {
    insert: async (appointment: OwnerAppointmentEntityInterface): Promise<void> => {
      try {
        await this.manager.getRepository(OwnerAppointmentOrmEntity).insert(appointment);
      } catch (error) {
        throw new RepositoryError("Failed to store owner appointment.", { cause: error });
      }
    },
  };

  public readonly accessCatalog = {
    ensurePermissionDefinitions: async (
      definitions: readonly PermissionDefinitionEntityInterface[],
    ): Promise<void> => {
      try {
        await this.manager
          .getRepository(PermissionDefinitionOrmEntity)
          .createQueryBuilder()
          .insert()
          .values([...definitions])
          .orIgnore()
          .execute();
      } catch (error) {
        throw new RepositoryError("Failed to bootstrap permission catalog.", { cause: error });
      }
    },
    insertPolicy: async (policy: AccessPolicyRevisionEntityInterface): Promise<void> => {
      try {
        await this.manager.getRepository(AccessPolicyRevisionOrmEntity).insert(policy);
      } catch (error) {
        throw new RepositoryError("Failed to store access policy.", { cause: error });
      }
    },
    insertRole: async (
      definition: RoleDefinitionEntityInterface,
      revision: RoleRevisionEntityInterface,
    ): Promise<void> => {
      try {
        await this.manager.getRepository(RoleDefinitionOrmEntity).insert(definition);
        await this.manager.getRepository(RoleRevisionOrmEntity).insert(revision);
      } catch (error) {
        throw new RepositoryError("Failed to bootstrap role catalog.", { cause: error });
      }
    },
  };

}
