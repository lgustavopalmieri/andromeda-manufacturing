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
  leaseToken?: string;
  leaseExpiresAt?: Date;
  attempts: number;
  lastError?: string;
}

export interface OutboxMessageEnqueuerInterface {
  enqueue(message: OutboxMessageInterface): Promise<void>;
}

export interface OutboxMessageLeaseInterface {
  message: OutboxMessageInterface;
  token: string;
}

export interface ClaimPendingOutboxMessagesInputInterface {
  now: Date;
  leaseExpiresAt: Date;
  leaseToken: string;
  limit: number;
}

export interface RescheduleOutboxMessageInputInterface {
  lease: OutboxMessageLeaseInterface;
  now: Date;
  availableAt: Date;
  lastError: string;
}

export interface OutboxMessageRelayStoreInterface {
  claimPending(input: ClaimPendingOutboxMessagesInputInterface): Promise<OutboxMessageLeaseInterface[]>;
  markPublished(lease: OutboxMessageLeaseInterface, publishedAt: Date): Promise<boolean>;
  rescheduleFailed(input: RescheduleOutboxMessageInputInterface): Promise<boolean>;
}

export interface OutboxMessagePublisherInterface {
  publish(message: OutboxMessageInterface): Promise<void>;
}

export interface TransactionalOutboxContextInterface {
  outbox: OutboxMessageEnqueuerInterface;
}
