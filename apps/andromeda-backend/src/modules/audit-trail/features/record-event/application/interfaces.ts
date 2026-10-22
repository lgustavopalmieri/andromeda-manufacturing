import type { AuditEventEntityInterface } from "../../../entity/audit-event.entity";
import type { TransactionalOutboxContextInterface } from "@shared/events/outbox";

export interface AuditEventIdGeneratorInterface {
  generate(): string;
}

export interface AuditEventClockInterface {
  now(): Date;
}

export interface RecordAuditEventRepositoryInterface {
  insert(event: AuditEventEntityInterface): Promise<void>;
}

export interface RecordAuditEventTransactionContextInterface extends TransactionalOutboxContextInterface {
  auditEvents: RecordAuditEventRepositoryInterface;
}

export interface RecordAuditEventTransactionInterface {
  run<T>(
    work: (context: RecordAuditEventTransactionContextInterface) => Promise<T>,
  ): Promise<T>;
}
