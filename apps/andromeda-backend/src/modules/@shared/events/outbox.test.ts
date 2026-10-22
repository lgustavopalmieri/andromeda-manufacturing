import { describe, expect, it, vi } from "vitest";
import type { OutboxMessageEnqueuerInterface, OutboxMessageInterface } from "./outbox.js";
import { makeOutboxMessage } from "@shared/tests/factories/events/outbox-message.factory";

class OutboxMessageEnqueuerStub implements OutboxMessageEnqueuerInterface {
  public readonly enqueue = vi.fn(async (_message: OutboxMessageInterface): Promise<void> => undefined);
}

class ProductionOrderReleaseConsumer {
  public constructor(private readonly outbox: OutboxMessageEnqueuerInterface) {}

  public async release(): Promise<void> {
    await this.outbox.enqueue(
      makeOutboxMessage({
        eventName: "production-order.released",
        aggregateType: "production-order",
      }),
    );
  }
}

interface MakeSutInterface {
  sut: ProductionOrderReleaseConsumer;
  outbox: OutboxMessageEnqueuerStub;
}

const makeSut = (): MakeSutInterface => {
  const outbox = new OutboxMessageEnqueuerStub();
  return { sut: new ProductionOrderReleaseConsumer(outbox), outbox };
};

describe("ProductionOrderReleaseConsumer", () => {
  describe("when another feature records a released production order", () => {
    it("should depend only on the shared outbox enqueuer contract", async () => {
      const { sut, outbox } = makeSut();

      await expect(sut.release()).resolves.toBeUndefined();

      expect(outbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "production-order.released",
          aggregateType: "production-order",
        }),
      );
    });
  });
});
