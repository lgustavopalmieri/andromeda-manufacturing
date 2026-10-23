import { describe, expect, it } from "vitest";
import {
  LOCALSTACK_SQS_DEFAULT_CREDENTIALS,
  LOCALSTACK_SQS_DEFAULT_REGION,
  createLocalStackSqsClientConfig,
} from "./setup-sqs";

interface MakeSutInterface {
  sut: typeof createLocalStackSqsClientConfig;
}

const makeSut = (): MakeSutInterface => ({ sut: createLocalStackSqsClientConfig });

describe("createLocalStackSqsClientConfig", () => {
  describe("when only a LocalStack endpoint is provided", () => {
    it("should configure the reusable SQS client with deterministic local credentials", () => {
      const { sut } = makeSut();

      const config = sut({ endpoint: "http://127.0.0.1:4566" });

      expect(config).toEqual({
        endpoint: "http://127.0.0.1:4566",
        region: LOCALSTACK_SQS_DEFAULT_REGION,
        credentials: LOCALSTACK_SQS_DEFAULT_CREDENTIALS,
      });
    });
  });

  describe("when a test needs a non-default AWS identity or region", () => {
    it("should preserve the supplied connection settings", () => {
      const { sut } = makeSut();
      const credentials = { accessKeyId: "integration", secretAccessKey: "secret" };

      const config = sut({
        endpoint: "http://localstack.internal:4566",
        region: "sa-east-1",
        credentials,
      });

      expect(config).toEqual({
        endpoint: "http://localstack.internal:4566",
        region: "sa-east-1",
        credentials,
      });
    });
  });
});
