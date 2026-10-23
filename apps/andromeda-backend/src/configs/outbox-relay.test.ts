import { describe, expect, it } from "vitest";
import { loadOutboxRelayConfig } from "./outbox-relay";

interface MakeSutInterface {
  sut: typeof loadOutboxRelayConfig;
}

const makeSut = (): MakeSutInterface => ({ sut: loadOutboxRelayConfig });

describe("loadOutboxRelayConfig", () => {
  describe("when SQS is not configured", () => {
    it("should disable the relay without requiring AWS configuration", () => {
      const { sut } = makeSut();

      expect(sut({})).toEqual({ enabled: false });
    });
  });

  describe("when SQS and the AWS region are configured", () => {
    it("should enable the relay with its bounded delivery settings", () => {
      const { sut } = makeSut();

      expect(
        sut({
          OUTBOX_SQS_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/123456789012/events.fifo",
          OUTBOX_AWS_REGION: "us-east-1",
          OUTBOX_RELAY_POLL_INTERVAL_MS: "2500",
          OUTBOX_RELAY_BATCH_SIZE: "30",
          OUTBOX_RELAY_LEASE_DURATION_MS: "45000",
          OUTBOX_RELAY_RETRY_BASE_DELAY_MS: "2000",
          OUTBOX_RELAY_RETRY_MAX_DELAY_MS: "180000",
        }),
      ).toEqual({
        enabled: true,
        queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789012/events.fifo",
        awsRegion: "us-east-1",
        pollIntervalMs: 2500,
        batchSize: 30,
        leaseDurationMs: 45000,
        retryBaseDelayMs: 2000,
        retryMaxDelayMs: 180000,
      });
    });
  });

  describe("when only part of the SQS configuration is present", () => {
    it("should reject the unsafe partial configuration", () => {
      const { sut } = makeSut();

      expect(() =>
        sut({ OUTBOX_SQS_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/123456789012/events" }),
      ).toThrow("OUTBOX_SQS_QUEUE_URL and OUTBOX_AWS_REGION must be configured together.");
    });
  });
});
