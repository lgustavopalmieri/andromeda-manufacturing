import type { AuditEventClockInterface } from "modules/audit-trail/features/record-event/application/interfaces";

export class SystemClock implements AuditEventClockInterface {
  public now(): Date {
    return new Date();
  }
}
