import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
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

beforeEach(async () => {
  await dataSource.query("TRUNCATE TABLE outbox_message");
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

  describe("when two relays claim the same available message", () => {
    it("should lease it to only one relay and retain it for idempotent retry until acknowledgement", async () => {
      const { sut, outboxMessages } = makeSut();
      const message = makeOutboxMessage({
        id: randomUUID(),
        tenantId: "3c0b6330-6d95-4436-8f89-d4d08bf40804",
        availableAt: new Date("2026-10-01T12:00:00.000Z"),
      });
      const now = new Date("2026-10-23T12:00:01.000Z");
      const leaseExpiresAt = new Date("2026-10-23T12:00:31.000Z");

      await sut.enqueue(message);
      await expect(outboxMessages.findOneByOrFail({ id: message.id })).resolves.toEqual(
        expect.objectContaining({ publishedAt: null, availableAt: message.availableAt }),
      );
      const [firstRelay, secondRelay] = await Promise.all([
        sut.claimPending({ now, leaseExpiresAt, leaseToken: randomUUID(), limit: 1 }),
        sut.claimPending({ now, leaseExpiresAt, leaseToken: randomUUID(), limit: 1 }),
      ]);
      const claimedLeases = [...firstRelay, ...secondRelay].filter(
        (lease) => lease.message.id === message.id,
      );

      expect([...firstRelay, ...secondRelay]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.objectContaining({ id: message.id }) }),
        ]),
      );
      expect(claimedLeases).toHaveLength(1);
      expect(claimedLeases[0]).toEqual(
        expect.objectContaining({ message: expect.objectContaining({ id: message.id }) }),
      );

      const lease = claimedLeases[0];
      expect(lease).toBeDefined();
      await expect(sut.markPublished(lease!, new Date("2026-10-23T12:00:02.000Z"))).resolves.toBe(true);

      await expect(outboxMessages.findOneByOrFail({ id: message.id })).resolves.toEqual(
        expect.objectContaining({
          publishedAt: new Date("2026-10-23T12:00:02.000Z"),
          leaseToken: null,
          leaseExpiresAt: null,
        }),
      );
    });
  });

  describe("when a broker failure is recorded before the lease expires", () => {
    it("should defer the same tenant-scoped event until its retry availability and retain its idempotency data", async () => {
      const { sut } = makeSut();
      const message = makeOutboxMessage({
        id: randomUUID(),
        tenantId: "3a9bf7b8-8030-4125-bd5d-d56faeb61451",
        correlationId: "03b45689-24a2-4997-94c3-e9e0c66c41c8",
        availableAt: new Date("2026-10-23T12:00:00.000Z"),
      });
      const claimedAt = new Date("2026-10-23T12:00:10.000Z");
      const retryAt = new Date("2026-10-23T12:01:10.000Z");

      await sut.enqueue(message);
      const [lease] = await sut.claimPending({
        now: claimedAt,
        leaseExpiresAt: new Date("2026-10-23T12:00:40.000Z"),
        leaseToken: randomUUID(),
        limit: 1,
      });

      await expect(
        sut.rescheduleFailed({
          lease: lease!,
          now: new Date("2026-10-23T12:00:20.000Z"),
          availableAt: retryAt,
          lastError: "broker unavailable",
        }),
      ).resolves.toBe(true);
      await expect(
        sut.claimPending({
          now: new Date("2026-10-23T12:01:09.000Z"),
          leaseExpiresAt: new Date("2026-10-23T12:01:39.000Z"),
          leaseToken: randomUUID(),
          limit: 1,
        }),
      ).resolves.toEqual([]);

      const [retryLease] = await sut.claimPending({
        now: retryAt,
        leaseExpiresAt: new Date("2026-10-23T12:01:40.000Z"),
        leaseToken: randomUUID(),
        limit: 1,
      });

      expect(retryLease).toEqual(
        expect.objectContaining({
          message: expect.objectContaining({
            id: message.id,
            tenantId: message.tenantId,
            correlationId: message.correlationId,
            attempts: 1,
            lastError: "broker unavailable",
            availableAt: retryAt,
          }),
        }),
      );
    });
  });

  describe("when a relay loses its lease before recording a failure", () => {
    it("should refuse the stale retry and let another relay claim the event without changing its attempt history", async () => {
      const { sut } = makeSut();
      const message = makeOutboxMessage({
        id: randomUUID(),
        tenantId: "11b77655-d74a-4d6e-afd3-8bdb84f73c2b",
        availableAt: new Date("2026-10-23T12:00:00.000Z"),
      });
      const firstLeaseToken = randomUUID();

      await sut.enqueue(message);
      const [firstLease] = await sut.claimPending({
        now: new Date("2026-10-23T12:00:10.000Z"),
        leaseExpiresAt: new Date("2026-10-23T12:00:20.000Z"),
        leaseToken: firstLeaseToken,
        limit: 1,
      });

      await expect(
        sut.rescheduleFailed({
          lease: firstLease!,
          now: new Date("2026-10-23T12:00:20.000Z"),
          availableAt: new Date("2026-10-23T12:01:00.000Z"),
          lastError: "late worker failure",
        }),
      ).resolves.toBe(false);

      const [successorLease] = await sut.claimPending({
        now: new Date("2026-10-23T12:00:21.000Z"),
        leaseExpiresAt: new Date("2026-10-23T12:00:51.000Z"),
        leaseToken: randomUUID(),
        limit: 1,
      });

      expect(successorLease).toEqual(
        expect.objectContaining({
          message: expect.objectContaining({
            id: message.id,
            attempts: 0,
            availableAt: message.availableAt,
          }),
        }),
      );
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
