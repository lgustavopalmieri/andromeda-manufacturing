import { SendMessageCommand, type SQSClient } from "@aws-sdk/client-sqs";
import type { OutboxMessageInterface, OutboxMessagePublisherInterface } from "@shared/events/outbox";

export interface SqsOutboxMessagePublisherOptionsInterface {
  queueUrl: string;
}

export class SqsOutboxMessagePublisher implements OutboxMessagePublisherInterface {
  public constructor(
    private readonly client: Pick<SQSClient, "send">,
    private readonly options: SqsOutboxMessagePublisherOptionsInterface,
  ) {}

  public async publish(message: OutboxMessageInterface): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.options.queueUrl,
        MessageBody: JSON.stringify({
          eventId: message.id,
          tenantId: message.tenantId,
          eventName: message.eventName,
          aggregateType: message.aggregateType,
          aggregateId: message.aggregateId,
          correlationId: message.correlationId,
          payload: message.payload,
          occurredAt: message.occurredAt.toISOString(),
        }),
        MessageAttributes: {
          eventId: { DataType: "String", StringValue: message.id },
          eventName: { DataType: "String", StringValue: message.eventName },
          tenantId: { DataType: "String", StringValue: message.tenantId },
        },
        ...(this.isFifoQueue()
          ? {
              MessageDeduplicationId: message.id,
              MessageGroupId: message.tenantId,
            }
          : {}),
      }),
    );
  }

  private isFifoQueue(): boolean {
    return this.options.queueUrl.endsWith(".fifo");
  }
}
