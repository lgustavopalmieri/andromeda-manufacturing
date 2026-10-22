import type { AuditEventEntityInterface } from "../../../entity/audit-event.entity";
import type { OutboxMessageInterface } from "@shared/events/outbox";
import { AuditEventRecord } from "../domain/audit-event-record.js";
import type { RecordAuditEventInputProps } from "../domain/types.js";
import type {
  AuditEventClockInterface,
  AuditEventIdGeneratorInterface,
  RecordAuditEventTransactionInterface,
} from "./interfaces.js";

export const AUDIT_EVENT_RECORDED_EVENT = "audit-event.recorded";

export class RecordAuditEventUsecase {
  public constructor(
    private readonly transaction: RecordAuditEventTransactionInterface,
    private readonly idGenerator: AuditEventIdGeneratorInterface,
    private readonly clock: AuditEventClockInterface,
  ) {}

  public async execute(input: RecordAuditEventInputProps): Promise<AuditEventEntityInterface> {
    const occurredAt = this.clock.now();
    const auditEvent = AuditEventRecord.create(input, this.idGenerator.generate(), occurredAt);
    const outboxMessage = this.createOutboxMessage(auditEvent);

    await this.transaction.run(async ({ auditEvents, outbox }) => {
      await auditEvents.insert(auditEvent);
      await outbox.enqueue(outboxMessage);
    });

    return auditEvent;
  }

  private createOutboxMessage(event: AuditEventEntityInterface): OutboxMessageInterface {
    return {
      id: this.idGenerator.generate(),
      tenantId: event.tenantId,
      eventName: AUDIT_EVENT_RECORDED_EVENT,
      aggregateType: "audit-event",
      aggregateId: event.id,
      correlationId: event.correlationId,
      payload: {
        auditEventId: event.id,
        operationCode: event.operationCode,
        decision: event.decision,
        occurredAt: event.occurredAt.toISOString(),
      },
      occurredAt: event.occurredAt,
      availableAt: event.occurredAt,
      attempts: 0,
    };
  }
}
