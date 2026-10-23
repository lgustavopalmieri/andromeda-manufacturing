import { randomUUID } from "node:crypto";
import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from "@aws-sdk/client-sqs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeOutboxMessage } from "@shared/tests/factories/events/outbox-message.factory";
import {
  startLocalStackSqs,
  type LocalStackSqsTestContainerInterface,
} from "@shared/tests/testcontainers/setup-sqs";
import { SqsOutboxMessagePublisher } from "./sqs-outbox-message-publisher";

interface SqsOutboxEventEnvelopeInterface {
  eventId: string;
  tenantId: string;
  eventName: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  payload: object;
  occurredAt: string;
}

class InMemoryProcessedEventStore {
  private readonly eventIds = new Set<string>();

  public recordIfNew(eventId: string): boolean {
    if (this.eventIds.has(eventId)) return false;
    this.eventIds.add(eventId);
    return true;
  }
}

class IdempotentSqsTestConsumer {
  public readonly processedEvents: SqsOutboxEventEnvelopeInterface[] = [];

  public constructor(private readonly processedEventStore: InMemoryProcessedEventStore) {}

  public process(message: Message): boolean {
    if (!message.Body) throw new Error("SQS delivery must contain a message body.");

    const event = JSON.parse(message.Body) as SqsOutboxEventEnvelopeInterface;
    if (!this.processedEventStore.recordIfNew(event.eventId)) return false;

    this.processedEvents.push(event);
    return true;
  }
}

interface MakeSutInterface {
  client: SQSClient;
  queueUrl: string;
  publisher: SqsOutboxMessagePublisher;
}

let sqs: LocalStackSqsTestContainerInterface;

const receiveOne = async (client: SQSClient, queueUrl: string): Promise<Message> => {
  const received = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      MessageAttributeNames: ["All"],
      WaitTimeSeconds: 1,
    }),
  );
  const [message] = received.Messages ?? [];

  if (!message) throw new Error("Expected LocalStack SQS to deliver an outbox message.");
  return message;
};

const makeSut = async (): Promise<MakeSutInterface> => {
  const queue = await sqs.createFifoQueue({ queueName: `andromeda-outbox-${randomUUID()}` });

  return {
    client: sqs.client,
    queueUrl: queue.queueUrl,
    publisher: new SqsOutboxMessagePublisher(sqs.client, { queueUrl: queue.queueUrl }),
  };
};

beforeAll(async () => {
  sqs = await startLocalStackSqs();
}, 180_000);

afterAll(async () => {
  await sqs?.stop();
});

describe("SqsOutboxMessagePublisher (LocalStack SQS)", () => {
  describe("when a tenant-scoped event is sent to a FIFO queue", () => {
    it("should deliver the immutable event id, tenant and correlation envelope to the consumer", async () => {
      const { client, queueUrl, publisher } = await makeSut();
      const message = makeOutboxMessage({
        id: randomUUID(),
        tenantId: "fe84f3d5-6dac-4ac7-a9e1-42e6b4d15c99",
        correlationId: "3483b7cd-4f46-4f80-b3cc-b5d9f050eac3",
      });

      await publisher.publish(message);
      const delivery = await receiveOne(client, queueUrl);
      const consumer = new IdempotentSqsTestConsumer(new InMemoryProcessedEventStore());

      expect(consumer.process(delivery)).toBe(true);
      expect(delivery.MessageAttributes).toMatchObject({
        eventId: { DataType: "String", StringValue: message.id },
        eventName: { DataType: "String", StringValue: message.eventName },
        tenantId: { DataType: "String", StringValue: message.tenantId },
      });
      expect(consumer.processedEvents).toEqual([
        {
          eventId: message.id,
          tenantId: message.tenantId,
          eventName: message.eventName,
          aggregateType: message.aggregateType,
          aggregateId: message.aggregateId,
          correlationId: message.correlationId,
          payload: message.payload,
          occurredAt: message.occurredAt.toISOString(),
        },
      ]);

      if (delivery.ReceiptHandle) {
        await client.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: delivery.ReceiptHandle }));
      }
    });
  });

  describe("when SQS redelivers an event whose acknowledgement was uncertain", () => {
    it("should let an idempotent consumer process its event id only once", async () => {
      const { client, queueUrl, publisher } = await makeSut();
      const message = makeOutboxMessage({ id: randomUUID() });
      const consumer = new IdempotentSqsTestConsumer(new InMemoryProcessedEventStore());

      await publisher.publish(message);
      const firstDelivery = await receiveOne(client, queueUrl);
      expect(consumer.process(firstDelivery)).toBe(true);

      if (!firstDelivery.ReceiptHandle) throw new Error("SQS delivery must include a receipt handle.");
      await client.send(
        new ChangeMessageVisibilityCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: firstDelivery.ReceiptHandle,
          VisibilityTimeout: 0,
        }),
      );
      const redelivery = await receiveOne(client, queueUrl);

      expect(consumer.process(redelivery)).toBe(false);
      expect(consumer.processedEvents).toEqual([
        expect.objectContaining({
          eventId: message.id,
          tenantId: message.tenantId,
          correlationId: message.correlationId,
        }),
      ]);

      if (redelivery.ReceiptHandle) {
        await client.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: redelivery.ReceiptHandle }));
      }
    });
  });

  describe("when the relay retries the same FIFO event id", () => {
    it("should let SQS deduplicate the duplicate broker publication", async () => {
      const { client, queueUrl, publisher } = await makeSut();
      const message = makeOutboxMessage({ id: randomUUID() });

      await publisher.publish(message);
      await publisher.publish(message);
      const delivery = await receiveOne(client, queueUrl);
      const secondReceive = await client.send(
        new ReceiveMessageCommand({ QueueUrl: queueUrl, MaxNumberOfMessages: 1, WaitTimeSeconds: 1 }),
      );

      expect(JSON.parse(delivery.Body ?? "{}")).toEqual(expect.objectContaining({ eventId: message.id }));
      expect(secondReceive.Messages ?? []).toEqual([]);

      if (delivery.ReceiptHandle) {
        await client.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: delivery.ReceiptHandle }));
      }
    });
  });
});
