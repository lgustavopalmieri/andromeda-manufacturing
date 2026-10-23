import type { OutboxRelay } from "./outbox-relay";

export interface OutboxRelayLoggerInterface {
  capture(error: unknown, context: Readonly<Record<string, unknown>>): void;
}

export class OutboxRelayWorker {
  private timer: NodeJS.Timeout | undefined;
  private polling = false;

  public constructor(
    private readonly relay: OutboxRelay,
    private readonly logger: OutboxRelayLoggerInterface,
    private readonly pollIntervalMs: number,
  ) {}

  public start(): void {
    if (this.timer) return;

    void this.poll();
    this.timer = setInterval(() => {
      void this.poll();
    }, this.pollIntervalMs);
  }

  public stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;

    try {
      await this.relay.runOnce();
    } catch (error) {
      this.logger.capture(error, { component: "outbox-relay" });
    } finally {
      this.polling = false;
    }
  }
}
