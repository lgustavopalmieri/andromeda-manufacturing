import type { DataSource, EntityManager } from "typeorm";
import { RepositoryError } from "@shared/errors/repository.error";
import type {
  ClaimPendingOutboxMessagesInputInterface,
  OutboxMessageEnqueuerInterface,
  OutboxMessageInterface,
  OutboxMessageLeaseInterface,
  OutboxMessageRelayStoreInterface,
  RescheduleOutboxMessageInputInterface,
} from "@shared/events/outbox";
import { OutboxMessageOrmEntity } from "./entities/outbox-message.orm-entity";

type TypeormManager = DataSource | EntityManager;

interface OutboxMessagePersistenceRowInterface {
  id: string;
  tenantId: string;
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  payload: object;
  occurredAt: Date | string;
  availableAt: Date | string;
  publishedAt: Date | string | null;
  attempts: number;
  lastError: string | null;
}

export class TypeormOutboxMessageRepository
  implements OutboxMessageEnqueuerInterface, OutboxMessageRelayStoreInterface
{
  public constructor(private readonly manager: TypeormManager) {}

  public async enqueue(message: OutboxMessageInterface): Promise<void> {
    try {
      await this.manager.getRepository(OutboxMessageOrmEntity).insert(message);
    } catch (error) {
      throw new RepositoryError("Failed to enqueue outbox message.", { cause: error });
    }
  }

  public async claimPending(
    input: ClaimPendingOutboxMessagesInputInterface,
  ): Promise<OutboxMessageLeaseInterface[]> {
    try {
      const [rows] = await this.manager.query<[OutboxMessagePersistenceRowInterface[], number]>(
        `WITH candidates AS (
          SELECT id
          FROM outbox_message
          WHERE published_at IS NULL
            AND available_at <= $1
            AND (lease_expires_at IS NULL OR lease_expires_at <= $1)
          ORDER BY available_at ASC, occurred_at ASC
          LIMIT $2
          FOR UPDATE SKIP LOCKED
        )
        UPDATE outbox_message AS message
        SET lease_token = $3, lease_expires_at = $4
        FROM candidates
        WHERE message.id = candidates.id
        RETURNING
          message.id AS "id",
          message.tenant_id AS "tenantId",
          message.event_name AS "eventName",
          message.aggregate_type AS "aggregateType",
          message.aggregate_id AS "aggregateId",
          message.correlation_id AS "correlationId",
          message.payload AS "payload",
          message.occurred_at AS "occurredAt",
          message.available_at AS "availableAt",
          message.published_at AS "publishedAt",
          message.attempts AS "attempts",
          message.last_error AS "lastError"`,
        [input.now, input.limit, input.leaseToken, input.leaseExpiresAt],
      );

      return (rows ?? []).map((row) => ({
        token: input.leaseToken,
        message: this.toOutboxMessage(row),
      }));
    } catch (error) {
      throw new RepositoryError("Failed to claim pending outbox messages.", { cause: error });
    }
  }

  public async markPublished(lease: OutboxMessageLeaseInterface, publishedAt: Date): Promise<boolean> {
    try {
      const [rows] = await this.manager.query<[{ id: string }[], number]>(
        `UPDATE outbox_message
        SET published_at = $3, lease_token = NULL, lease_expires_at = NULL, last_error = NULL
        WHERE id = $1
          AND lease_token = $2
          AND published_at IS NULL
          AND lease_expires_at > $3
        RETURNING id`,
        [lease.message.id, lease.token, publishedAt],
      );
      return (rows ?? []).length === 1;
    } catch (error) {
      throw new RepositoryError("Failed to mark outbox message as published.", { cause: error });
    }
  }

  public async rescheduleFailed(input: RescheduleOutboxMessageInputInterface): Promise<boolean> {
    try {
      const [rows] = await this.manager.query<[{ id: string }[], number]>(
        `UPDATE outbox_message
        SET attempts = attempts + 1,
            last_error = $3,
            available_at = $4,
            lease_token = NULL,
            lease_expires_at = NULL
        WHERE id = $1
          AND lease_token = $2
          AND published_at IS NULL
          AND lease_expires_at > $5
        RETURNING id`,
        [input.lease.message.id, input.lease.token, input.lastError, input.availableAt, input.now],
      );
      return (rows ?? []).length === 1;
    } catch (error) {
      throw new RepositoryError("Failed to reschedule outbox message.", { cause: error });
    }
  }

  private toOutboxMessage(row: OutboxMessagePersistenceRowInterface): OutboxMessageInterface {
    return {
      id: row.id,
      tenantId: row.tenantId,
      eventName: row.eventName,
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      correlationId: row.correlationId,
      payload: row.payload,
      occurredAt: new Date(row.occurredAt),
      availableAt: new Date(row.availableAt),
      ...(row.publishedAt ? { publishedAt: new Date(row.publishedAt) } : {}),
      attempts: row.attempts,
      ...(row.lastError ? { lastError: row.lastError } : {}),
    };
  }
}
