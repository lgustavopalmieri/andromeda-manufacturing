import { describe, expect, it, vi } from "vitest";
import { PinoObservability } from "./pino-observability";

interface MakeSutInterface {
  sut: PinoObservability;
  logger: { error: ReturnType<typeof vi.fn> };
}

const makeSut = (): MakeSutInterface => {
  const logger = { error: vi.fn() };
  return { sut: new PinoObservability(logger), logger };
};

describe("PinoObservability", () => {
  describe("when a feature captures an error", () => {
    it("should log the original error with its contextual fields", () => {
      const { sut, logger } = makeSut();
      const error = new Error("database connection refused");

      sut.capture(error, { feature: "tenant.request-onboarding", correlationId: "correlation-1" });

      expect(logger.error).toHaveBeenCalledWith(
        {
          err: error,
          feature: "tenant.request-onboarding",
          correlationId: "correlation-1",
        },
        "Unhandled feature error",
      );
    });
  });
});
