import { describe, expect, it, vi } from "vitest";
import type { EntityManager } from "typeorm";
import { makeOutboxMessage } from "@shared/tests/factories/events/outbox-message.factory";
import { makeAuditEventEntity } from "@shared/tests/factories/audit-trail/record-event.factory";
import { AuditEventOrmEntity } from "platform/database/postgres/typeorm/entities/audit-event.orm-entity";
import { OutboxMessageOrmEntity } from "platform/database/postgres/typeorm/entities/outbox-message.orm-entity";
import { TypeormTransactionRunner } from "platform/database/postgres/typeorm/typeorm-transaction-runner";
import { RecordAuditEventTransactionManager } from "./record-audit-event-transaction-manager.js";

interface MakeSutInterface {
  sut: RecordAuditEventTransactionManager;
  transactionRunner: TypeormTransactionRunner;
  manager: EntityManager;
  insert: ReturnType<typeof vi.fn>;
}

const makeSut = (): MakeSutInterface => {
  const insert = vi.fn(async (): Promise<void> => undefined);
  const manager = {
    getRepository: vi.fn(() => ({ insert })),
  } as unknown as EntityManager;
  const transactionRunner = {
    run: vi.fn(async (work: (transactionManager: EntityManager) => Promise<unknown>) =>
      await work(manager),
    ),
  } as unknown as TypeormTransactionRunner;

  return { sut: new RecordAuditEventTransactionManager(transactionRunner), transactionRunner, manager, insert };
};

describe("RecordAuditEventTransactionManager", () => {
  describe("when recording an audit event", () => {
    it("should provide audit and shared outbox repositories through one transaction", async () => {
      const { sut, transactionRunner, manager, insert } = makeSut();

      await expect(
        sut.run(async ({ auditEvents, outbox }) => {
          await auditEvents.insert(makeAuditEventEntity());
          await outbox.enqueue(makeOutboxMessage());
          return "recorded";
        }),
      ).resolves.toBe("recorded");

      expect(transactionRunner.run).toHaveBeenCalledOnce();
      expect(manager.getRepository).toHaveBeenNthCalledWith(1, AuditEventOrmEntity);
      expect(manager.getRepository).toHaveBeenNthCalledWith(2, OutboxMessageOrmEntity);
      expect(insert).toHaveBeenCalledTimes(2);
    });
  });

  describe("when transactional work fails", () => {
    it("should propagate failures so the shared transaction runner rolls back", async () => {
      const { sut, transactionRunner } = makeSut();

      await expect(sut.run(async () => Promise.reject(new Error("outbox unavailable")))).rejects.toThrow(
        "outbox unavailable",
      );

      expect(transactionRunner.run).toHaveBeenCalledOnce();
    });
  });
});
