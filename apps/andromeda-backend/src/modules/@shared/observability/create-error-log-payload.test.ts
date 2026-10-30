import { describe, expect, it } from "vitest";
import { RepositoryUnavailableError } from "@shared/errors/repository.error";
import { createErrorLogPayload } from "./create-error-log-payload";

interface MakeSutInterface {
  sut: typeof createErrorLogPayload;
}

const makeSut = (): MakeSutInterface => ({ sut: createErrorLogPayload });

describe("createErrorLogPayload", () => {
  describe("when preparing a classified error", () => {
    it("should combine its safe category and selected context without raw details", () => {
      const { sut } = makeSut();
      const error = new RepositoryUnavailableError("synthetic-storage-message");

      const payload = sut(error, { invocationId: "invocation-3", tenantId: "ta" });

      expect(payload).toEqual({
        event: "error.captured",
        errorCategory: "repository_unavailable",
        context: { invocationId: "invocation-3", tenantId: "ta" },
      });
      expect(JSON.stringify(payload)).not.toContain("synthetic-");
    });
  });
});
