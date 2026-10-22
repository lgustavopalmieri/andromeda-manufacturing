import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { DataSource } from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";
import type { OutboxMessageInterface } from "@shared/events/outbox";
import { makeOutboxMessage } from "@shared/tests/factories/events/outbox-message.factory";
import { createDataSource, initializeDatabase } from "platform/database/postgres/data-source";
import { OutboxMessageOrmEntity } from "./entities/outbox-message.orm-entity.js";
import { TypeormOutboxMessageRepository } from "./outbox-message.typeorm-repository.js";

let container: StartedPostgreSqlContainer;
let dataSource: DataSource;

interface MakeSutInterface {
  sut: TypeormOutboxMessageRepository;
  outboxMessages: ReturnType<DataSource["getRepository"]>;
}

const makeSut = (): MakeSutInterface => ({
  sut: new TypeormOutboxMessageRepository(dataSource),
  outboxMessages: dataSource.getRepository(OutboxMessageOrmEntity),
});

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  dataSource = await initializeDatabase(
    createDataSource({
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      ssl: false,
      runMigrationsOnBoot: true,
    }),
  );
});

afterAll(async () => {
  await dataSource?.destroy();
  await container?.stop();
});

describe("TypeormOutboxMessageRepository (PostgreSQL)", () => {
  describe("when messages from different tenants are enqueued", () => {
    it("should preserve JSON payloads and return only the requested tenant's messages", async () => {
      const { sut, outboxMessages } = makeSut();
      const tenantMessage = makeOutboxMessage({
        id: randomUUID(),
        tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d",
        payload: {
          productionOrderId: "3f0df01f-d276-444e-9b53-527c17250133",
          operations: [{ code: "mix", sequence: 10 }],
          releasedBy: { kind: "agent", identityId: "9f22549d-f6c3-4c2b-a4de-006443d28602" },
        },
      });
      const foreignTenantMessage = makeOutboxMessage({
        id: randomUUID(),
        tenantId: "b8754ce1-f1a7-48ef-a26e-d806b1a9ed64",
      });

      await sut.enqueue(tenantMessage);
      await sut.enqueue(foreignTenantMessage);
      const tenantMessages = await outboxMessages.findBy({ tenantId: tenantMessage.tenantId });

      expect(tenantMessages).toEqual([
        expect.objectContaining({
          id: tenantMessage.id,
          tenantId: tenantMessage.tenantId,
          payload: tenantMessage.payload,
          publishedAt: null,
          attempts: 0,
        }),
      ]);
    });
  });

  describe("when a relay selects pending messages", () => {
    it("should exclude published messages and retain the configured availability order", async () => {
      const { sut, outboxMessages } = makeSut();
      const tenantId = "aa4f89dc-1cf5-49e2-91e3-af89f2aedf4e";
      const later = makeOutboxMessage({
        id: randomUUID(),
        tenantId,
        availableAt: new Date("2026-10-22T15:05:00.000Z"),
        occurredAt: new Date("2026-10-22T15:01:00.000Z"),
      });
      const earlier = makeOutboxMessage({
        id: randomUUID(),
        tenantId,
        availableAt: new Date("2026-10-22T15:00:00.000Z"),
        occurredAt: new Date("2026-10-22T15:00:00.000Z"),
      });
      const published = makeOutboxMessage({
        id: randomUUID(),
        tenantId,
        publishedAt: new Date("2026-10-22T15:00:01.000Z"),
      });

      await Promise.all([sut.enqueue(later), sut.enqueue(earlier), sut.enqueue(published)]);
      const pendingMessages = await outboxMessages
        .createQueryBuilder("outbox_message")
        .where("outbox_message.tenant_id = :tenantId", { tenantId })
        .andWhere("outbox_message.published_at IS NULL")
        .orderBy("outbox_message.available_at", "ASC")
        .addOrderBy("outbox_message.occurred_at", "ASC")
        .getMany();

      expect(pendingMessages.map((message) => message.id)).toEqual([earlier.id, later.id]);
    });
  });

  describe("when a message violates the attempts constraint", () => {
    it("should translate the PostgreSQL constraint failure to RepositoryError", async () => {
      const { sut, outboxMessages } = makeSut();
      const message = makeOutboxMessage({ id: randomUUID(), attempts: -1 });

      await expect(sut.enqueue(message)).rejects.toBeInstanceOf(RepositoryError);

      await expect(outboxMessages.findOneBy({ id: message.id })).resolves.toBeNull();
    });
  });
});
