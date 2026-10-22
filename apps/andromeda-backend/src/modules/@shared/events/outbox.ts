export type OutboxMessageId = string;
export type OutboxPayload = object;

export interface OutboxMessageInterface<TPayload extends OutboxPayload = OutboxPayload> {
  id: OutboxMessageId;
  tenantId: string;
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  payload: TPayload;
  occurredAt: Date;
  availableAt: Date;
  publishedAt?: Date;
  attempts: number;
  lastError?: string;
}

export interface OutboxMessageEnqueuerInterface {
  enqueue(message: OutboxMessageInterface): Promise<void>;
}

export interface TransactionalOutboxContextInterface {
  outbox: OutboxMessageEnqueuerInterface;
}
