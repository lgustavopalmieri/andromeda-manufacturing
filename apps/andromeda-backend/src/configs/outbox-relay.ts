import { z } from "zod";

const outboxRelayEnvironmentSchema = z
  .object({
    OUTBOX_SQS_QUEUE_URL: z.url().optional(),
    OUTBOX_AWS_REGION: z.string().trim().min(1).optional(),
    OUTBOX_AWS_ENDPOINT_URL: z.url().optional(),
    OUTBOX_RELAY_POLL_INTERVAL_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),
    OUTBOX_RELAY_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(20),
    OUTBOX_RELAY_LEASE_DURATION_MS: z.coerce.number().int().min(1_000).max(300_000).default(30_000),
    OUTBOX_RELAY_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(100).max(60_000).default(1_000),
    OUTBOX_RELAY_RETRY_MAX_DELAY_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(300_000),
  })
  .superRefine((value, context) => {
    if (Boolean(value.OUTBOX_SQS_QUEUE_URL) !== Boolean(value.OUTBOX_AWS_REGION)) {
      context.addIssue({
        code: "custom",
        message: "OUTBOX_SQS_QUEUE_URL and OUTBOX_AWS_REGION must be configured together.",
      });
    }

    if (value.OUTBOX_RELAY_RETRY_BASE_DELAY_MS > value.OUTBOX_RELAY_RETRY_MAX_DELAY_MS) {
      context.addIssue({
        code: "custom",
        message: "OUTBOX_RELAY_RETRY_BASE_DELAY_MS cannot exceed OUTBOX_RELAY_RETRY_MAX_DELAY_MS.",
      });
    }
  });

export interface DisabledOutboxRelayConfigInterface {
  enabled: false;
}

export interface EnabledOutboxRelayConfigInterface {
  enabled: true;
  queueUrl: string;
  awsRegion: string;
  awsEndpointUrl?: string;
  pollIntervalMs: number;
  batchSize: number;
  leaseDurationMs: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
}

export type OutboxRelayConfigInterface =
  | DisabledOutboxRelayConfigInterface
  | EnabledOutboxRelayConfigInterface;

export const loadOutboxRelayConfig = (
  environment: Record<string, string | undefined> = process.env,
): OutboxRelayConfigInterface => {
  const parsedEnvironment = outboxRelayEnvironmentSchema.parse(environment);

  if (!parsedEnvironment.OUTBOX_SQS_QUEUE_URL || !parsedEnvironment.OUTBOX_AWS_REGION) {
    return { enabled: false };
  }

  return {
    enabled: true,
    queueUrl: parsedEnvironment.OUTBOX_SQS_QUEUE_URL,
    awsRegion: parsedEnvironment.OUTBOX_AWS_REGION,
    ...(parsedEnvironment.OUTBOX_AWS_ENDPOINT_URL
      ? { awsEndpointUrl: parsedEnvironment.OUTBOX_AWS_ENDPOINT_URL }
      : {}),
    pollIntervalMs: parsedEnvironment.OUTBOX_RELAY_POLL_INTERVAL_MS,
    batchSize: parsedEnvironment.OUTBOX_RELAY_BATCH_SIZE,
    leaseDurationMs: parsedEnvironment.OUTBOX_RELAY_LEASE_DURATION_MS,
    retryBaseDelayMs: parsedEnvironment.OUTBOX_RELAY_RETRY_BASE_DELAY_MS,
    retryMaxDelayMs: parsedEnvironment.OUTBOX_RELAY_RETRY_MAX_DELAY_MS,
  };
};
