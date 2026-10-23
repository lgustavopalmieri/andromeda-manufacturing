import { randomUUID } from "node:crypto";
import type {
  OutboxMessageInterface,
  OutboxMessagePublisherInterface,
  OutboxMessageRelayStoreInterface,
} from "@shared/events/outbox";

export interface OutboxRelayClockInterface {
  now(): Date;
}

export interface OutboxRelayOptionsInterface {
  batchSize: number;
  leaseDurationMs: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
}

const MAX_RETRY_EXPONENT = 30;

export class OutboxRelay {
  public constructor(
    private readonly store: OutboxMessageRelayStoreInterface,
    private readonly publisher: OutboxMessagePublisherInterface,
    private readonly clock: OutboxRelayClockInterface,
    private readonly options: OutboxRelayOptionsInterface,
  ) {}

  public async runOnce(): Promise<void> {
    const now = this.clock.now();
    const leases = await this.store.claimPending({
      now,
      leaseExpiresAt: new Date(now.getTime() + this.options.leaseDurationMs),
      leaseToken: randomUUID(),
      limit: this.options.batchSize,
    });

    for (const lease of leases) {
      await this.deliver(lease.message, lease.token);
    }
  }

  private async deliver(message: OutboxMessageInterface, token: string): Promise<void> {
    const lease = { message, token };

    try {
      await this.publisher.publish(message);
      const published = await this.store.markPublished(lease, this.clock.now());

      if (!published) {
        throw new Error("Outbox message publication acknowledgement was not persisted.");
      }
    } catch (error) {
      const now = this.clock.now();
      await this.store.rescheduleFailed({
        lease,
        now,
        availableAt: this.nextAttemptAt(message, now),
        lastError: this.errorMessage(error),
      });
    }
  }

  private nextAttemptAt(message: OutboxMessageInterface, now: Date): Date {
    const exponent = Math.min(message.attempts, MAX_RETRY_EXPONENT);
    const delay = Math.min(
      this.options.retryBaseDelayMs * 2 ** exponent,
      this.options.retryMaxDelayMs,
    );
    return new Date(now.getTime() + delay);
  }

  private errorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : "Unknown outbox publishing failure.";
    return message.slice(0, 2_000);
  }
}
