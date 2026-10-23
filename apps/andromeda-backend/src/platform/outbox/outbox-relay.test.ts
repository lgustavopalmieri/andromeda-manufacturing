import { describe, expect, it, vi } from "vitest";
import type {
  ClaimPendingOutboxMessagesInputInterface,
  OutboxMessageLeaseInterface,
  OutboxMessagePublisherInterface,
  OutboxMessageRelayStoreInterface,
  RescheduleOutboxMessageInputInterface,
} from "@shared/events/outbox";
import { makeOutboxMessage } from "@shared/tests/factories/events/outbox-message.factory";
import { OutboxRelay, type OutboxRelayClockInterface } from "./outbox-relay";

class OutboxRelayStoreStub implements OutboxMessageRelayStoreInterface {
  public leases: OutboxMessageLeaseInterface[] = [];
  public readonly claimPending = vi.fn(
    async (_input: ClaimPendingOutboxMessagesInputInterface): Promise<OutboxMessageLeaseInterface[]> =>
      this.leases,
  );
  public readonly markPublished = vi.fn(async (): Promise<boolean> => true);
  public readonly rescheduleFailed = vi.fn(
    async (_input: RescheduleOutboxMessageInputInterface): Promise<boolean> => true,
  );
}

class OutboxMessagePublisherStub implements OutboxMessagePublisherInterface {
  public readonly publish = vi.fn(async (): Promise<void> => undefined);
}

class FixedClock implements OutboxRelayClockInterface {
  public constructor(private readonly date: Date) {}

  public now(): Date {
    return this.date;
  }
}

interface MakeSutOptionsInterface {
  leases?: OutboxMessageLeaseInterface[];
}

interface MakeSutInterface {
  sut: OutboxRelay;
  store: OutboxRelayStoreStub;
  publisher: OutboxMessagePublisherStub;
}

const relayClock = new FixedClock(new Date("2026-10-23T12:00:00.000Z"));

const makeSut = (options: MakeSutOptionsInterface = {}): MakeSutInterface => {
  const store = new OutboxRelayStoreStub();
  store.leases = options.leases ?? [];
  const publisher = new OutboxMessagePublisherStub();
  return {
    sut: new OutboxRelay(store, publisher, relayClock, {
      batchSize: 20,
      leaseDurationMs: 30_000,
      retryBaseDelayMs: 1_000,
      retryMaxDelayMs: 300_000,
    }),
    store,
    publisher,
  };
};

describe("OutboxRelay", () => {
  describe("when a pending message is claimed and the broker accepts it", () => {
    it("should publish its event id and mark the leased message as published", async () => {
      const message = makeOutboxMessage();
      const { sut, store, publisher } = makeSut({ leases: [{ message, token: "lease-token" }] });

      await sut.runOnce();

      expect(store.claimPending).toHaveBeenCalledWith(
        expect.objectContaining({
          now: new Date("2026-10-23T12:00:00.000Z"),
          leaseExpiresAt: new Date("2026-10-23T12:00:30.000Z"),
          limit: 20,
          leaseToken: expect.any(String),
        }),
      );
      expect(publisher.publish).toHaveBeenCalledWith(message);
      expect(store.markPublished).toHaveBeenCalledWith(
        { message, token: "lease-token" },
        new Date("2026-10-23T12:00:00.000Z"),
      );
      expect(store.rescheduleFailed).not.toHaveBeenCalled();
    });
  });

  describe("when the broker rejects a claimed message", () => {
    it("should preserve the event for a later exponential-backoff retry", async () => {
      const message = makeOutboxMessage({ attempts: 2 });
      const { sut, store, publisher } = makeSut({ leases: [{ message, token: "lease-token" }] });
      publisher.publish.mockRejectedValueOnce(new Error("broker unavailable"));

      await sut.runOnce();

      expect(store.markPublished).not.toHaveBeenCalled();
      expect(store.rescheduleFailed).toHaveBeenCalledWith({
        lease: { message, token: "lease-token" },
        now: new Date("2026-10-23T12:00:00.000Z"),
        availableAt: new Date("2026-10-23T12:00:04.000Z"),
        lastError: "broker unavailable",
      });
    });
  });

  describe("when a publication was accepted but recording its acknowledgement fails", () => {
    it("should reschedule the unchanged event id for at-least-once delivery", async () => {
      const message = makeOutboxMessage();
      const { sut, store, publisher } = makeSut({ leases: [{ message, token: "lease-token" }] });
      store.markPublished.mockRejectedValueOnce(new Error("database unavailable"));

      await sut.runOnce();

      expect(publisher.publish).toHaveBeenCalledWith(message);
      expect(store.rescheduleFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          lease: { message, token: "lease-token" },
          now: new Date("2026-10-23T12:00:00.000Z"),
          lastError: "database unavailable",
        }),
      );
    });
  });

  describe("when acknowledgement reports that the lease was no longer current", () => {
    it("should preserve the unchanged event id for at-least-once retry", async () => {
      const message = makeOutboxMessage();
      const { sut, store, publisher } = makeSut({ leases: [{ message, token: "lease-token" }] });
      store.markPublished.mockResolvedValueOnce(false);

      await sut.runOnce();

      expect(publisher.publish).toHaveBeenCalledWith(message);
      expect(store.rescheduleFailed).toHaveBeenCalledWith({
        lease: { message, token: "lease-token" },
        now: new Date("2026-10-23T12:00:00.000Z"),
        availableAt: new Date("2026-10-23T12:00:01.000Z"),
        lastError: "Outbox message publication acknowledgement was not persisted.",
      });
    });
  });
});
