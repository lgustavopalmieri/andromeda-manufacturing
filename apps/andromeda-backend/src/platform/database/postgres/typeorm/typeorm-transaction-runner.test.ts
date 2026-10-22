import { describe, expect, it, vi } from "vitest";
import type { DataSource, EntityManager, QueryRunner } from "typeorm";
import { TypeormTransactionRunner } from "./typeorm-transaction-runner.js";

interface QueryRunnerMockInterface {
  queryRunner: QueryRunner;
  calls: string[];
  manager: EntityManager;
  connect: ReturnType<typeof vi.fn>;
  startTransaction: ReturnType<typeof vi.fn>;
  commitTransaction: ReturnType<typeof vi.fn>;
  rollbackTransaction: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
}

interface MakeSutOptionsInterface {
  connectError?: Error;
  startTransactionError?: Error;
  commitTransactionError?: Error;
  rollbackTransactionError?: Error;
  releaseError?: Error;
}

interface MakeSutInterface extends QueryRunnerMockInterface {
  sut: TypeormTransactionRunner;
}

const makeSut = (options: MakeSutOptionsInterface = {}): MakeSutInterface => {
  const calls: string[] = [];
  const manager = {} as EntityManager;
  let isTransactionActive = false;
  const connect = vi.fn(async (): Promise<void> => {
    calls.push("connect");
    if (options.connectError) throw options.connectError;
  });
  const startTransaction = vi.fn(async (): Promise<void> => {
    calls.push("startTransaction");
    if (options.startTransactionError) throw options.startTransactionError;
    isTransactionActive = true;
  });
  const commitTransaction = vi.fn(async (): Promise<void> => {
    calls.push("commitTransaction");
    if (options.commitTransactionError) throw options.commitTransactionError;
    isTransactionActive = false;
  });
  const rollbackTransaction = vi.fn(async (): Promise<void> => {
    calls.push("rollbackTransaction");
    if (options.rollbackTransactionError) throw options.rollbackTransactionError;
    isTransactionActive = false;
  });
  const release = vi.fn(async (): Promise<void> => {
    calls.push("release");
    if (options.releaseError) throw options.releaseError;
  });
  const queryRunner = {
    connect,
    startTransaction,
    commitTransaction,
    rollbackTransaction,
    release,
    manager,
    get isTransactionActive(): boolean {
      return isTransactionActive;
    },
  } as unknown as QueryRunner;
  const sut = new TypeormTransactionRunner({
    createQueryRunner: vi.fn(() => queryRunner),
  } as unknown as DataSource);

  return {
    sut,
    queryRunner,
    calls,
    manager,
    connect,
    startTransaction,
    commitTransaction,
    rollbackTransaction,
    release,
  };
};

describe("TypeormTransactionRunner", () => {
  describe("when the transactional work succeeds", () => {
    it("should connect, execute, commit, and release in order", async () => {
      const { sut, calls, manager, rollbackTransaction } = makeSut();

      await expect(
        sut.run(async (receivedManager) => {
          calls.push("work");
          expect(receivedManager).toBe(manager);
          return "recorded";
        }),
      ).resolves.toBe("recorded");

      expect(calls).toEqual(["connect", "startTransaction", "work", "commitTransaction", "release"]);
      expect(rollbackTransaction).not.toHaveBeenCalled();
    });
  });

  describe("when the transactional work fails", () => {
    it("should roll back, release, and propagate the work error", async () => {
      const { sut, calls, commitTransaction } = makeSut();
      const workError = new Error("outbox unavailable");

      await expect(
        sut.run(async () => {
          calls.push("work");
          return await Promise.reject(workError);
        }),
      ).rejects.toBe(workError);

      expect(calls).toEqual(["connect", "startTransaction", "work", "rollbackTransaction", "release"]);
      expect(commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe("when committing fails", () => {
    it("should roll back, release, and propagate the commit error", async () => {
      const commitError = new Error("commit unavailable");
      const { sut, calls } = makeSut({ commitTransactionError: commitError });

      await expect(sut.run(async () => "recorded")).rejects.toBe(commitError);

      expect(calls).toEqual([
        "connect",
        "startTransaction",
        "commitTransaction",
        "rollbackTransaction",
        "release",
      ]);
    });
  });

  describe("when rolling back fails", () => {
    it("should still release the query runner and propagate the rollback error", async () => {
      const rollbackError = new Error("rollback unavailable");
      const { sut, calls } = makeSut({ rollbackTransactionError: rollbackError });

      await expect(sut.run(async () => Promise.reject(new Error("outbox unavailable")))).rejects.toBe(
        rollbackError,
      );

      expect(calls).toEqual(["connect", "startTransaction", "rollbackTransaction", "release"]);
    });
  });

  describe("when connecting fails", () => {
    it("should release the query runner without starting or rolling back a transaction", async () => {
      const connectError = new Error("database unavailable");
      const { sut, calls, startTransaction, rollbackTransaction } = makeSut({ connectError });

      await expect(sut.run(async () => "recorded")).rejects.toBe(connectError);

      expect(calls).toEqual(["connect", "release"]);
      expect(startTransaction).not.toHaveBeenCalled();
      expect(rollbackTransaction).not.toHaveBeenCalled();
    });
  });

  describe("when starting the transaction fails", () => {
    it("should release the query runner without rolling back an inactive transaction", async () => {
      const startTransactionError = new Error("cannot start transaction");
      const { sut, calls, rollbackTransaction } = makeSut({ startTransactionError });

      await expect(sut.run(async () => "recorded")).rejects.toBe(startTransactionError);

      expect(calls).toEqual(["connect", "startTransaction", "release"]);
      expect(rollbackTransaction).not.toHaveBeenCalled();
    });
  });

  describe("when releasing the query runner fails after a committed transaction", () => {
    it("should propagate the release error", async () => {
      const releaseError = new Error("release unavailable");
      const { sut, calls } = makeSut({ releaseError });

      await expect(sut.run(async () => "recorded")).rejects.toBe(releaseError);

      expect(calls).toEqual(["connect", "startTransaction", "commitTransaction", "release"]);
    });
  });
});
