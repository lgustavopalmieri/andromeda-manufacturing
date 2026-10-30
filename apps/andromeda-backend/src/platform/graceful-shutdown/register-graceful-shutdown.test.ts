import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GracefulShutdownOptionsInterface } from "./interfaces";
import { registerGracefulShutdown } from "./register-graceful-shutdown";

interface MakeSutInterface {
  sut: () => void;
  signalSource: EventEmitter;
  shutdown: GracefulShutdownOptionsInterface["shutdown"];
  onError: GracefulShutdownOptionsInterface["onError"];
}

const disposers = new Set<() => void>();

const makeSut = (overrides: Partial<GracefulShutdownOptionsInterface> = {}): MakeSutInterface => {
  const signalSource = new EventEmitter();
  const shutdown = overrides.shutdown ?? vi.fn<GracefulShutdownOptionsInterface["shutdown"]>().mockResolvedValue(undefined);
  const onError = overrides.onError ?? vi.fn<GracefulShutdownOptionsInterface["onError"]>();
  const sut = registerGracefulShutdown({ signalSource, shutdown, onError, ...overrides });
  disposers.add(sut);
  return { sut, signalSource, shutdown, onError };
};

afterEach(() => {
  for (const dispose of disposers) dispose();
  disposers.clear();
});

describe("registerGracefulShutdown", () => {
  describe("when registering signal handlers", () => {
    it("should register both shutdown signals without initiating shutdown", () => {
      const { signalSource, shutdown, onError } = makeSut();

      signalSource.emit("unrelated");

      expect(signalSource.listenerCount("SIGINT")).toBe(1);
      expect(signalSource.listenerCount("SIGTERM")).toBe(1);
      expect(shutdown).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it("should register with process signals and remove only its own listeners", () => {
      const interrupts = process.listeners("SIGINT");
      const terminations = process.listeners("SIGTERM");
      const { sut } = makeSut({ signalSource: process });
      const registeredInterrupts = process.listeners("SIGINT").length;
      const registeredTerminations = process.listeners("SIGTERM").length;

      sut();
      sut();

      expect(registeredInterrupts).toBe(interrupts.length + 1);
      expect(registeredTerminations).toBe(terminations.length + 1);
      expect(process.listeners("SIGINT")).toEqual(interrupts);
      expect(process.listeners("SIGTERM")).toEqual(terminations);
    });

    it("should allow disposal before shutdown without invoking the callback", () => {
      const { sut, signalSource, shutdown } = makeSut();

      sut();
      sut();
      signalSource.emit("SIGINT");
      signalSource.emit("SIGTERM");

      expect(signalSource.listenerCount("SIGINT")).toBe(0);
      expect(signalSource.listenerCount("SIGTERM")).toBe(0);
      expect(shutdown).not.toHaveBeenCalled();
    });
  });

  describe("when a shutdown signal arrives", () => {
    it.each(["SIGINT", "SIGTERM"] as const)("should invoke shutdown once and remove handlers after %s", async (signal) => {
      const { signalSource, shutdown, onError } = makeSut();
      const existing = vi.fn();
      signalSource.on("SIGINT", existing);

      signalSource.emit(signal);
      await vi.waitFor(() => expect(signalSource.listeners("SIGINT")).toEqual([existing]));

      expect(shutdown).toHaveBeenCalledExactlyOnceWith();
      expect(onError).not.toHaveBeenCalled();
      expect(signalSource.listenerCount("SIGTERM")).toBe(0);
    });

    it("should absorb repeated signals while the injected callback waits for startup and shutdown", async () => {
      const startup = Promise.withResolvers<void>();
      const draining = Promise.withResolvers<void>();
      const stop = vi.fn(() => draining.promise);
      const shutdown = vi.fn(async () => {
        await startup.promise;
        await stop();
      });
      const { signalSource, onError } = makeSut({ shutdown });

      signalSource.emit("SIGTERM");
      signalSource.emit("SIGINT");
      await vi.waitFor(() => expect(shutdown).toHaveBeenCalledOnce());
      const stoppedBeforeStartup = stop.mock.calls.length;
      const listenersDuringStartup = signalSource.listenerCount("SIGTERM");
      startup.resolve();
      await vi.waitFor(() => expect(stop).toHaveBeenCalledOnce());
      signalSource.emit("SIGINT");
      signalSource.emit("SIGTERM");
      const listenersDuringDrain = signalSource.listenerCount("SIGINT");
      draining.resolve();
      await vi.waitFor(() => expect(signalSource.listenerCount("SIGINT")).toBe(0));

      expect(stoppedBeforeStartup).toBe(0);
      expect(listenersDuringStartup).toBe(1);
      expect(listenersDuringDrain).toBe(1);
      expect(shutdown).toHaveBeenCalledOnce();
      expect(stop).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();
      expect(signalSource.listenerCount("SIGTERM")).toBe(0);
    });

    it("should finish an in-progress callback when its signal handlers are manually removed", async () => {
      const draining = Promise.withResolvers<void>();
      const shutdown = vi.fn(() => draining.promise);
      const { sut, signalSource, onError } = makeSut({ shutdown });

      signalSource.emit("SIGTERM");
      await vi.waitFor(() => expect(shutdown).toHaveBeenCalledOnce());
      sut();
      draining.resolve();
      await draining.promise;

      expect(signalSource.listenerCount("SIGINT")).toBe(0);
      expect(signalSource.listenerCount("SIGTERM")).toBe(0);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("when the injected callback fails", () => {
    it("should report an asynchronous failure once and remove both listeners", async () => {
      const draining = Promise.withResolvers<void>();
      const failure = new Error("shutdown rejected");
      const shutdown = vi.fn(() => draining.promise);
      const { signalSource, onError } = makeSut({ shutdown });

      signalSource.emit("SIGTERM");
      signalSource.emit("SIGINT");
      await vi.waitFor(() => expect(shutdown).toHaveBeenCalledOnce());
      draining.reject(failure);
      await vi.waitFor(() => expect(signalSource.listenerCount("SIGTERM")).toBe(0));

      expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
      expect(failure).toBeInstanceOf(Error);
      expect(failure.message).toBe("shutdown rejected");
      expect(signalSource.listenerCount("SIGINT")).toBe(0);
    });

    it("should route a synchronous throw through the same error callback and cleanup", async () => {
      const failure = new Error("shutdown threw");
      const shutdown = vi.fn(() => { throw failure; });
      const { signalSource, onError } = makeSut({ shutdown });

      signalSource.emit("SIGINT");
      await vi.waitFor(() => expect(signalSource.listenerCount("SIGINT")).toBe(0));

      expect(shutdown).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
      expect(failure).toBeInstanceOf(Error);
      expect(failure.message).toBe("shutdown threw");
      expect(signalSource.listenerCount("SIGTERM")).toBe(0);
    });
  });
});
