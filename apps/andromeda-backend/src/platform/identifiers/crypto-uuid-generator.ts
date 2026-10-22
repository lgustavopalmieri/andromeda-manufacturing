import { randomUUID } from "node:crypto";
import type { AuditEventIdGeneratorInterface } from "modules/audit-trail/features/record-event/application/interfaces";

export class CryptoUuidGenerator implements AuditEventIdGeneratorInterface {
  public generate(): string {
    return randomUUID();
  }
}
