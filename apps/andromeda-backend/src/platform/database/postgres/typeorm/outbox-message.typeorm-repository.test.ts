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
}

const makeSut = (): MakeSutInterface => {
  const repository = {
    insert: vi.fn(async (): Promise<void> => undefined),
  };
  const manager = {
    getRepository: vi.fn(() => repository),
  } as unknown as DataSource;

  return {
    sut: new TypeormOutboxMessageRepository(manager),
    manager,
    repository,
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
});
