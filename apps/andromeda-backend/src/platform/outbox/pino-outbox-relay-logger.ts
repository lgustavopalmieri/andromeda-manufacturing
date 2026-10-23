import type { Logger } from "pino";
import type { OutboxRelayLoggerInterface } from "./outbox-relay-worker";

export class PinoOutboxRelayLogger implements OutboxRelayLoggerInterface {
  public constructor(private readonly logger: Logger) {}

  public capture(error: unknown, context: Readonly<Record<string, unknown>>): void {
    this.logger.error({ err: error, ...context }, "Outbox relay poll failed.");
  }
}
