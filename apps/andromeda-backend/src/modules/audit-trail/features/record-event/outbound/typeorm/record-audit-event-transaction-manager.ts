import type {
  RecordAuditEventTransactionContextInterface,
  RecordAuditEventTransactionInterface,
} from "../../application/interfaces.js";
import { TypeormOutboxMessageRepository } from "platform/database/postgres/typeorm/outbox-message.typeorm-repository";
import { TypeormTransactionRunner } from "platform/database/postgres/typeorm/typeorm-transaction-runner";
import { RecordAuditEventTypeormRepository } from "./record-audit-event.typeorm-repositories.js";

export class RecordAuditEventTransactionManager
  implements RecordAuditEventTransactionInterface
{
  public constructor(private readonly transactionRunner: TypeormTransactionRunner) {}

  public async run<T>(
    work: (context: RecordAuditEventTransactionContextInterface) => Promise<T>,
  ): Promise<T> {
    return await this.transactionRunner.run(async (manager) =>
      await work({
        auditEvents: new RecordAuditEventTypeormRepository(manager),
        outbox: new TypeormOutboxMessageRepository(manager),
      }),
    );
  }
}
