import { describe, expect, it, vi } from "vitest";
import type { DataSource, EntityManager } from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";
import { makeOutboxMessage } from "@shared/tests/factories/events/outbox-message.factory";
import { OutboxMessageOrmEntity } from "./entities/outbox-message.orm-entity.js";
import { TypeormOutboxMessageRepository } from "./outbox-message.typeorm-repository.js";

interface MakeSutInterface {
  sut: TypeormOutboxMessageRepository;
  manager: DataSource | EntityManager;
  repository: { insert: ReturnType<typeof vi.fn> };
  query: ReturnType<typeof vi.fn>;
}

const makeSut = (): MakeSutInterface => {
  const repository = {
    insert: vi.fn(async (): Promise<void> => undefined),
  };
  const query = vi.fn();
  const manager = {
    getRepository: vi.fn(() => repository),
    query,
  } as unknown as DataSource;

  return {
    sut: new TypeormOutboxMessageRepository(manager),
    manager,
    repository,
    query,
  };
};

describe("TypeormOutboxMessageRepository", () => {
  describe("when a valid outbox message is enqueued", () => {
    it("should insert the exact message through the outbox ORM repository", async () => {
      const { sut, manager, repository } = makeSut();
      const message = makeOutboxMessage();

      await expect(sut.enqueue(message)).resolves.toBeUndefined();

      expect(manager.getRepository).toHaveBeenCalledWith(OutboxMessageOrmEntity);
      expect(repository.insert).toHaveBeenCalledWith(message);
    });
  });

  describe("when TypeORM rejects the insert", () => {
    it("should translate the infrastructure error to RepositoryError while preserving its cause", async () => {
      const { sut, repository } = makeSut();
      const infrastructureError = new Error("duplicate key");
      repository.insert.mockRejectedValueOnce(infrastructureError);

      const error = await sut.enqueue(makeOutboxMessage()).catch((caughtError: unknown) => caughtError);

      expect(error).toBeInstanceOf(RepositoryError);
      expect(error).toMatchObject({
        message: "Failed to enqueue outbox message.",
        cause: infrastructureError,
      });
    });
  });

  describe("when a relay claims pending messages", () => {
    it("should use a lease and skip rows held by another relay", async () => {
      const { sut, query } = makeSut();
      const now = new Date("2026-10-23T12:00:00.000Z");
      const leaseExpiresAt = new Date("2026-10-23T12:00:30.000Z");
      const message = makeOutboxMessage();
      query.mockResolvedValueOnce([
        [
          {
            id: message.id,
          tenantId: message.tenantId,
          eventName: message.eventName,
          aggregateType: message.aggregateType,
          aggregateId: message.aggregateId,
          correlationId: message.correlationId,
          payload: message.payload,
          occurredAt: message.occurredAt,
          availableAt: message.availableAt,
          publishedAt: null,
          attempts: message.attempts,
            lastError: null,
          },
        ],
        1,
      ]);

      const leases = await sut.claimPending({
        now,
        leaseExpiresAt,
        leaseToken: "8df26d70-4cb4-44e8-bf2e-412878026d66",
        limit: 20,
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("FOR UPDATE SKIP LOCKED"),
        [now, 20, "8df26d70-4cb4-44e8-bf2e-412878026d66", leaseExpiresAt],
      );
      expect(leases).toEqual([
        {
          token: "8df26d70-4cb4-44e8-bf2e-412878026d66",
          message,
        },
      ]);
    });
  });
});
