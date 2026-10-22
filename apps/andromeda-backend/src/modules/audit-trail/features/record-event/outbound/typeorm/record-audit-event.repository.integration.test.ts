import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { DataSource } from "typeorm";
import {
  makeAuditEventEntity,
  makeRecordAuditEventInput,
} from "@shared/tests/factories/audit-trail/record-event.factory";
import { createDataSource, initializeDatabase } from "platform/database/postgres/data-source";
import { AuditEventOrmEntity } from "platform/database/postgres/typeorm/entities/audit-event.orm-entity";
import { OutboxMessageOrmEntity } from "platform/database/postgres/typeorm/entities/outbox-message.orm-entity";
import { RecordAuditEventWire } from "../../wire";

let container: StartedPostgreSqlContainer;
let dataSource: DataSource;

interface MakeSutInterface {
  usecase: ReturnType<typeof RecordAuditEventWire.provideUsecase>;
  auditEvents: ReturnType<DataSource["getRepository"]>;
  outboxMessages: ReturnType<DataSource["getRepository"]>;
}

const makeSut = (): MakeSutInterface => ({
  usecase: RecordAuditEventWire.provideUsecase(dataSource),
  auditEvents: dataSource.getRepository(AuditEventOrmEntity),
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

describe("RecordAuditEventWire (PostgreSQL)", () => {
  describe("when a valid audit event is recorded", () => {
    it("should persist the audit fact and its outbox message through the same transaction boundary", async () => {
      const { usecase, outboxMessages } = makeSut();

      const event = await usecase.execute(makeRecordAuditEventInput());
      const messages = await outboxMessages.findBy({
        aggregateId: event.id,
        tenantId: event.tenantId,
      });

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        tenantId: event.tenantId,
        aggregateId: event.id,
        correlationId: event.correlationId,
        eventName: "audit-event.recorded",
        publishedAt: null,
        attempts: 0,
      });
    });
  });

  describe("when an audit fact has been persisted", () => {
    it("should preserve the append-only audit history", async () => {
      const { auditEvents } = makeSut();
      const event = makeAuditEventEntity();

      await auditEvents.insert(event);

      await expect(auditEvents.update(event.id, { reason: "rewritten" })).rejects.toThrow(
        "audit_event is append-only",
      );
      await expect(auditEvents.delete(event.id)).rejects.toThrow("audit_event is append-only");
      const persistedEvent = await auditEvents.findOneBy({
        id: event.id,
        tenantId: event.tenantId,
      });
      expect(persistedEvent).toMatchObject(event);
    });
  });
});
