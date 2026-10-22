import { describe, expect, it, vi } from "vitest";
import type { AuditEventEntityInterface } from "../../../entity/audit-event.entity";
import type { OutboxMessageEnqueuerInterface, OutboxMessageInterface } from "@shared/events/outbox";
import { makeRecordAuditEventInput } from "@shared/tests/factories/audit-trail/record-event.factory";
import type {
  RecordAuditEventRepositoryInterface,
  RecordAuditEventTransactionContextInterface,
  RecordAuditEventTransactionInterface,
} from "./interfaces.js";
import { AUDIT_EVENT_RECORDED_EVENT, RecordAuditEventUsecase } from "./usecase.js";

class AuditEventRepositoryStub implements RecordAuditEventRepositoryInterface {
  public readonly insert = vi.fn(async (_event: AuditEventEntityInterface): Promise<void> => undefined);
}

class OutboxMessageEnqueuerStub implements OutboxMessageEnqueuerInterface {
  public readonly enqueue = vi.fn(async (_message: OutboxMessageInterface): Promise<void> => undefined);
}

class TransactionStub implements RecordAuditEventTransactionInterface {
  public readonly auditEvents: AuditEventRepositoryStub;
  public readonly outbox: OutboxMessageEnqueuerStub;
  public readonly runSpy = vi.fn();
  public aborted = false;

  public constructor(auditEventError?: Error, outboxError?: Error) {
    this.auditEvents = new AuditEventRepositoryStub();
    this.outbox = new OutboxMessageEnqueuerStub();
    this.auditEvents.insert.mockImplementation(async () => {
      if (auditEventError) throw auditEventError;
    });
    this.outbox.enqueue.mockImplementation(async () => {
      if (outboxError) throw outboxError;
    });
  }

  public async run<T>(
    work: (context: RecordAuditEventTransactionContextInterface) => Promise<T>,
  ): Promise<T> {
    this.runSpy();
    try {
      return await work({ auditEvents: this.auditEvents, outbox: this.outbox });
    } catch (error) {
      this.aborted = true;
      throw error;
    }
  }
}

interface MakeSutOptionsInterface {
  auditEventError?: Error;
  outboxError?: Error;
}

interface MakeSutInterface {
  sut: RecordAuditEventUsecase;
  transaction: TransactionStub;
  idGenerator: { generate: ReturnType<typeof vi.fn> };
}

const makeSut = (options: MakeSutOptionsInterface = {}): MakeSutInterface => {
  const transaction = new TransactionStub(options.auditEventError, options.outboxError);
  const idGenerator = {
    generate: vi
      .fn<() => string>()
      .mockReturnValueOnce("3f0df01f-d276-444e-9b53-527c17250133")
      .mockReturnValueOnce("6e52e58b-aa3e-463e-b7b2-3f12c3d17774"),
  };
  const sut = new RecordAuditEventUsecase(transaction, idGenerator, {
    now: () => new Date("2026-10-22T15:00:00.000Z"),
  });
  return { sut, transaction, idGenerator };
};

describe("RecordAuditEventUsecase", () => {
  describe("when the audit fact is valid and persistence succeeds", () => {
    it("should append the audit fact before its tenant-scoped outbox message in one transaction", async () => {
      const { sut, transaction, idGenerator } = makeSut();

      const event = await sut.execute(makeRecordAuditEventInput());

      expect(transaction.runSpy).toHaveBeenCalledTimes(1);
      expect(transaction.auditEvents.insert).toHaveBeenCalledWith(event);
      expect(transaction.outbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "6e52e58b-aa3e-463e-b7b2-3f12c3d17774",
          tenantId: event.tenantId,
          eventName: AUDIT_EVENT_RECORDED_EVENT,
          aggregateId: event.id,
          correlationId: event.correlationId,
          payload: expect.objectContaining({ auditEventId: event.id }),
        }),
      );
      const auditInsertOrder = transaction.auditEvents.insert.mock.invocationCallOrder[0];
      const outboxEnqueueOrder = transaction.outbox.enqueue.mock.invocationCallOrder[0];
      expect(auditInsertOrder).toBeDefined();
      expect(outboxEnqueueOrder).toBeDefined();
      expect(auditInsertOrder!).toBeLessThan(outboxEnqueueOrder!);
      expect(idGenerator.generate).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the audit fact is invalid", () => {
    it("should reject it before opening a transaction", async () => {
      const { sut, transaction } = makeSut();

      await expect(sut.execute(makeRecordAuditEventInput({ operationCode: " " }))).rejects.toThrow(
        "Audit event operation code is required.",
      );

      expect(transaction.runSpy).not.toHaveBeenCalled();
    });
  });

  describe("when appending the audit fact fails", () => {
    it("should abort the transaction and not enqueue an outbox message", async () => {
      const auditEventError = new Error("audit storage unavailable");
      const { sut, transaction } = makeSut({ auditEventError });

      await expect(sut.execute(makeRecordAuditEventInput())).rejects.toBe(auditEventError);

      expect(transaction.aborted).toBe(true);
      expect(transaction.outbox.enqueue).not.toHaveBeenCalled();
    });
  });

  describe("when enqueuing the outbox message fails", () => {
    it("should propagate the error so the transaction manager aborts both writes", async () => {
      const outboxError = new Error("outbox unavailable");
      const { sut, transaction } = makeSut({ outboxError });

      await expect(sut.execute(makeRecordAuditEventInput())).rejects.toBe(outboxError);

      expect(transaction.auditEvents.insert).toHaveBeenCalledTimes(1);
      expect(transaction.aborted).toBe(true);
    });
  });
});
