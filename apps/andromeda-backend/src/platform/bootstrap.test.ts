import { describe, expect, it, vi } from "vitest";
import { bootstrap } from "./bootstrap";
import type { BootstrapOptionsInterface, ServiceDatabaseInterface, ServiceHttpInterface } from "./bootstrap";

class DatabaseStub implements ServiceDatabaseInterface {
  async initialize(): Promise<void> {}
  async migrate(): Promise<void> {}
  async close(): Promise<void> {}
}

class HttpStub implements ServiceHttpInterface {
  async start(): Promise<void> {}
  async stop(): Promise<void> {}
}

interface MakeSutInterface {
  sut: () => ReturnType<typeof bootstrap>;
  database: DatabaseStub;
  http: HttpStub;
}

const makeSut = (overrides: Partial<BootstrapOptionsInterface> = {}): MakeSutInterface => {
  const database = new DatabaseStub();
  const http = new HttpStub();
  return {
    sut: () => bootstrap({ database, http, runMigrationsOnBoot: true, ...overrides }),
    database,
    http,
  };
};

describe("bootstrap", () => {
  describe("when starting the service", () => {
    it("should initialize and migrate the database before opening HTTP", async () => {
      const { sut, database, http } = makeSut();
      const initialize = vi.spyOn(database, "initialize");
      const migrate = vi.spyOn(database, "migrate");
      const start = vi.spyOn(http, "start");

      const service = await sut();

      expect(initialize).toHaveBeenCalledExactlyOnceWith();
      expect(migrate).toHaveBeenCalledExactlyOnceWith();
      expect(start).toHaveBeenCalledExactlyOnceWith();
      expect(initialize.mock.invocationCallOrder[0]).toBeLessThan(migrate.mock.invocationCallOrder[0]!);
      expect(migrate.mock.invocationCallOrder[0]).toBeLessThan(start.mock.invocationCallOrder[0]!);
      await service.stop();
    });

    it("should skip migrations only when the runtime flag is false", async () => {
      const { sut, database, http } = makeSut({ runMigrationsOnBoot: false });
      const initialize = vi.spyOn(database, "initialize");
      const migrate = vi.spyOn(database, "migrate");
      const start = vi.spyOn(http, "start");

      const service = await sut();

      expect(initialize).toHaveBeenCalledOnce();
      expect(migrate).not.toHaveBeenCalled();
      expect(start).toHaveBeenCalledOnce();
      await service.stop();
    });

    it("should keep HTTP closed while migrations are pending", async () => {
      const { sut, database, http } = makeSut();
      const pending = Promise.withResolvers<void>();
      vi.spyOn(database, "migrate").mockReturnValue(pending.promise);
      const start = vi.spyOn(http, "start");

      const starting = sut();
      await vi.waitFor(() => expect(database.migrate).toHaveBeenCalledOnce());
      const startedBeforeMigrations = start.mock.calls.length;
      pending.resolve();
      const service = await starting;

      expect(startedBeforeMigrations).toBe(0);
      expect(start).toHaveBeenCalledOnce();
      await service.stop();
    });
  });

  describe("when startup fails", () => {
    it("should close a partially initialized database without attempting migration or HTTP", async () => {
      const { sut, database, http } = makeSut();
      const cause = new Error("private connection failure");
      vi.spyOn(database, "initialize").mockRejectedValue(cause);
      const migrate = vi.spyOn(database, "migrate");
      const close = vi.spyOn(database, "close");
      const start = vi.spyOn(http, "start");
      const stop = vi.spyOn(http, "stop");

      const failure = await sut().catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({ message: "Service startup failed.", cause });
      expect(migrate).not.toHaveBeenCalled();
      expect(start).not.toHaveBeenCalled();
      expect(stop).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
    });

    it("should close the database and keep HTTP closed after a migration failure", async () => {
      const { sut, database, http } = makeSut();
      const cause = new Error("private migration failure");
      vi.spyOn(database, "migrate").mockRejectedValue(cause);
      const close = vi.spyOn(database, "close");
      const start = vi.spyOn(http, "start");

      const failure = await sut().catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({ message: "Service startup failed.", cause });
      expect(close).toHaveBeenCalledOnce();
      expect(start).not.toHaveBeenCalled();
    });

    it("should close attempted HTTP resources before the database after a listen failure", async () => {
      const { sut, database, http } = makeSut();
      const cause = new Error("private bind failure");
      vi.spyOn(http, "start").mockRejectedValue(cause);
      const stop = vi.spyOn(http, "stop");
      const close = vi.spyOn(database, "close");

      const failure = await sut().catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({ message: "Service startup failed.", cause });
      expect(stop).toHaveBeenCalledOnce();
      expect(close).toHaveBeenCalledOnce();
      expect(stop.mock.invocationCallOrder[0]).toBeLessThan(close.mock.invocationCallOrder[0]!);
    });

    it("should retain the startup error and both cleanup failures without skipping database cleanup", async () => {
      const { sut, database, http } = makeSut();
      const startupError = new Error("start failure");
      const httpError = new Error("http cleanup failure");
      const databaseError = new Error("database cleanup failure");
      vi.spyOn(http, "start").mockRejectedValue(startupError);
      vi.spyOn(http, "stop").mockRejectedValue(httpError);
      const close = vi.spyOn(database, "close").mockRejectedValue(databaseError);

      const failure = await sut().catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(AggregateError);
      expect(failure).toMatchObject({
        message: "Service startup and cleanup failed.", errors: [startupError, httpError, databaseError],
      });
      expect(close).toHaveBeenCalledOnce();
    });

    it("should retain initialization and database cleanup failures", async () => {
      const { sut, database } = makeSut();
      const startupError = new Error("initialization failure");
      const cleanupError = new Error("cleanup failure");
      vi.spyOn(database, "initialize").mockRejectedValue(startupError);
      vi.spyOn(database, "close").mockRejectedValue(cleanupError);

      const failure = await sut().catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(AggregateError);
      expect(failure).toMatchObject({
        message: "Service startup and cleanup failed.", errors: [startupError, cleanupError],
      });
    });
  });

  describe("when shutting down", () => {
    it("should drain HTTP before closing the database and share concurrent or repeated stops", async () => {
      const { sut, database, http } = makeSut();
      const drained = Promise.withResolvers<void>();
      const stop = vi.spyOn(http, "stop").mockReturnValue(drained.promise);
      const close = vi.spyOn(database, "close");
      const service = await sut();

      const stopping = service.stop();
      const concurrent = service.stop();
      const closedBeforeDrain = close.mock.calls.length;
      drained.resolve();
      await Promise.all([stopping, concurrent]);
      await service.stop();

      expect(concurrent).toBe(stopping);
      expect(closedBeforeDrain).toBe(0);
      expect(stop).toHaveBeenCalledOnce();
      expect(close).toHaveBeenCalledOnce();
    });

    it("should preserve the database for active HTTP work when draining fails and allow cleanup retry", async () => {
      const { sut, database, http } = makeSut();
      const cause = new Error("drain failure");
      const stop = vi.spyOn(http, "stop").mockRejectedValueOnce(cause).mockResolvedValue(undefined);
      const close = vi.spyOn(database, "close");
      const service = await sut();

      const failure = await service.stop().catch((error: unknown) => error);
      const closedAfterFailure = close.mock.calls.length;
      await service.stop();

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({ message: "Service shutdown failed.", cause });
      expect(closedAfterFailure).toBe(0);
      expect(stop).toHaveBeenCalledTimes(2);
      expect(close).toHaveBeenCalledOnce();
    });

    it("should retry database cleanup without stopping already closed HTTP again", async () => {
      const { sut, database, http } = makeSut();
      const cause = new Error("database close failure");
      const stop = vi.spyOn(http, "stop");
      const close = vi.spyOn(database, "close").mockRejectedValueOnce(cause).mockResolvedValue(undefined);
      const service = await sut();

      const failure = await service.stop().catch((error: unknown) => error);
      await service.stop();

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({ message: "Service shutdown failed.", cause });
      expect(stop).toHaveBeenCalledOnce();
      expect(close).toHaveBeenCalledTimes(2);
    });
  });
});
