import type { OutboxRelayClockInterface } from "./outbox-relay";

export class SystemOutboxRelayClock implements OutboxRelayClockInterface {
  public now(): Date {
    return new Date();
  }
}
