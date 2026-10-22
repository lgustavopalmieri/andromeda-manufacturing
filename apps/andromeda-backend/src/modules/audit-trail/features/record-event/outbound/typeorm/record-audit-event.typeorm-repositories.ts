import type { DataSource, EntityManager } from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";
import type { AuditEventEntityInterface } from "../../../../entity/audit-event.entity";
import { AuditEventOrmEntity } from "platform/database/postgres/typeorm/entities/audit-event.orm-entity";
import type { RecordAuditEventRepositoryInterface } from "../../application/interfaces.js";

type TypeormManager = DataSource | EntityManager;

export class RecordAuditEventTypeormRepository implements RecordAuditEventRepositoryInterface {
  public constructor(private readonly manager: TypeormManager) {}

  public async insert(event: AuditEventEntityInterface): Promise<void> {
    try {
      await this.manager.getRepository(AuditEventOrmEntity).insert(event);
    } catch (error) {
      throw new RepositoryError("Failed to append audit event.", { cause: error });
    }
  }
}
