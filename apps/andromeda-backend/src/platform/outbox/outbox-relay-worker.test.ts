import { describe, expect, it, vi } from "vitest";
import type { OutboxRelay } from "./outbox-relay";
import { OutboxRelayWorker, type OutboxRelayLoggerInterface } from "./outbox-relay-worker";

class OutboxRelayLoggerStub implements OutboxRelayLoggerInterface {
  public readonly capture = vi.fn();
}

interface MakeSutInterface {
  sut: OutboxRelayWorker;
  relay: { runOnce: ReturnType<typeof vi.fn> };
  logger: OutboxRelayLoggerStub;
}

const makeSut = (): MakeSutInterface => {
  const relay = { runOnce: vi.fn(async (): Promise<void> => undefined) };
  const logger = new OutboxRelayLoggerStub();
  return {
    sut: new OutboxRelayWorker(relay as unknown as OutboxRelay, logger, 100),
    relay,
    logger,
  };
};

describe("OutboxRelayWorker", () => {
  describe("when a poll is still running", () => {
    it("should not start a concurrent poll", async () => {
      vi.useFakeTimers();
      let finishFirstPoll: (() => void) | undefined;
      const firstPoll = new Promise<void>((resolve) => {
        finishFirstPoll = resolve;
      });
      const { sut, relay } = makeSut();
      relay.runOnce.mockReturnValueOnce(firstPoll);

      sut.start();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(100);

      expect(relay.runOnce).toHaveBeenCalledTimes(1);

      finishFirstPoll?.();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(100);

      expect(relay.runOnce).toHaveBeenCalledTimes(2);
      sut.stop();
      vi.useRealTimers();
    });
  });

  describe("when a poll fails", () => {
    it("should capture the failure and continue scheduling the worker", async () => {
      vi.useFakeTimers();
      const { sut, relay, logger } = makeSut();
      const failure = new Error("database unavailable");
      relay.runOnce.mockRejectedValueOnce(failure);

      sut.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(logger.capture).toHaveBeenCalledWith(failure, { component: "outbox-relay" });

      await vi.advanceTimersByTimeAsync(100);

      expect(relay.runOnce).toHaveBeenCalledTimes(2);
      sut.stop();
      vi.useRealTimers();
    });
  });
});
