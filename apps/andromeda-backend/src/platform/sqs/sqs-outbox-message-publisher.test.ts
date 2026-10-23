import { SendMessageCommand, type SQSClient } from "@aws-sdk/client-sqs";
import { describe, expect, it, vi } from "vitest";
import { makeOutboxMessage } from "@shared/tests/factories/events/outbox-message.factory";
import { SqsOutboxMessagePublisher } from "./sqs-outbox-message-publisher";

interface MakeSutInterface {
  sut: SqsOutboxMessagePublisher;
  client: Pick<SQSClient, "send">;
  sentCommands: SendMessageCommand[];
}

const makeSut = (queueUrl = "https://sqs.us-east-1.amazonaws.com/123456789012/events.fifo"): MakeSutInterface => {
  const sentCommands: SendMessageCommand[] = [];
  const client = {
    send: vi.fn(async (command: SendMessageCommand) => {
      sentCommands.push(command);
      return {};
    }),
  } as unknown as Pick<SQSClient, "send">;
  return { sut: new SqsOutboxMessagePublisher(client, { queueUrl }), client, sentCommands };
};

describe("SqsOutboxMessagePublisher", () => {
  describe("when publishing to a FIFO queue", () => {
    it("should expose the immutable event id for consumer idempotency and broker deduplication", async () => {
      const { sut, client, sentCommands } = makeSut();
      const message = makeOutboxMessage();

      await sut.publish(message);

      expect(client.send).toHaveBeenCalledWith(expect.any(SendMessageCommand));
      const command = sentCommands[0];
      expect(command).toBeInstanceOf(SendMessageCommand);
      expect(command?.input).toMatchObject({
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/123456789012/events.fifo",
        MessageDeduplicationId: message.id,
        MessageGroupId: message.tenantId,
        MessageAttributes: {
          eventId: { DataType: "String", StringValue: message.id },
          eventName: { DataType: "String", StringValue: message.eventName },
          tenantId: { DataType: "String", StringValue: message.tenantId },
        },
      });
      expect(JSON.parse(command?.input.MessageBody ?? "{}")).toEqual({
        eventId: message.id,
        tenantId: message.tenantId,
        eventName: message.eventName,
        aggregateType: message.aggregateType,
        aggregateId: message.aggregateId,
        correlationId: message.correlationId,
        payload: message.payload,
        occurredAt: message.occurredAt.toISOString(),
      });
    });
  });

  describe("when publishing to a standard queue", () => {
    it("should retain the event id without requiring FIFO-only fields", async () => {
      const { sut, sentCommands } = makeSut("https://sqs.us-east-1.amazonaws.com/123456789012/events");

      await sut.publish(makeOutboxMessage());

      const command = sentCommands[0];
      expect(command?.input).not.toHaveProperty("MessageDeduplicationId");
      expect(command?.input).not.toHaveProperty("MessageGroupId");
      expect(command?.input.MessageAttributes?.["eventId"]?.StringValue).toBe(
        "6e52e58b-aa3e-463e-b7b2-3f12c3d17774",
      );
    });
  });
});
