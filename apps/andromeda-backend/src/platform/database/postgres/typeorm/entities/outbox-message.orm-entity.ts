import { EntitySchema } from "typeorm";
import type { OutboxMessageInterface } from "@shared/events/outbox";

export const OUTBOX_MESSAGE_TABLE_NAME = "outbox_message";

export const OutboxMessageOrmEntity = new EntitySchema<OutboxMessageInterface>({
  name: "OutboxMessage",
  tableName: OUTBOX_MESSAGE_TABLE_NAME,
  columns: {
    id: { type: "uuid", primary: true },
    tenantId: { name: "tenant_id", type: "uuid" },
    eventName: { name: "event_name", type: "varchar", length: 180 },
    aggregateType: { name: "aggregate_type", type: "varchar", length: 100 },
    aggregateId: { name: "aggregate_id", type: "uuid" },
    correlationId: { name: "correlation_id", type: "uuid" },
    payload: { type: "jsonb" },
    occurredAt: { name: "occurred_at", type: "timestamp with time zone" },
    availableAt: { name: "available_at", type: "timestamp with time zone" },
    publishedAt: { name: "published_at", type: "timestamp with time zone", nullable: true },
    leaseToken: { name: "lease_token", type: "uuid", nullable: true },
    leaseExpiresAt: { name: "lease_expires_at", type: "timestamp with time zone", nullable: true },
    attempts: { type: "integer", default: 0 },
    lastError: { name: "last_error", type: "text", nullable: true },
  },
});
