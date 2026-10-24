import express, { type Express } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { RepositoryError } from "@shared/errors/repository.error";
import { makeObservabilityMock } from "@shared/observability/observability.mock";
import {
  makeRequestOnboardingBody,
  makeTenantOnboardingRequest,
} from "@shared/tests/factories/tenant/request-onboarding.factory";
import {
  OnboardingOrganizationNameRequiredError,
} from "../../domain/errors.js";
import type { RequestOnboardingInputProps, RequestOnboardingOutputProps } from "../../domain/types.js";
import type { RequestOnboardingUsecaseInterface } from "../../application/interfaces.js";
import { RequestOnboardingHandler } from "./http-handler.js";

class RequestOnboardingUsecaseStub implements RequestOnboardingUsecaseInterface {
  public readonly execute = vi.fn(
    async (_input: RequestOnboardingInputProps): Promise<RequestOnboardingOutputProps> =>
      makeTenantOnboardingRequest(),
  );
}

interface MakeSutInterface {
  app: Express;
  usecase: RequestOnboardingUsecaseStub;
  observability: ReturnType<typeof makeObservabilityMock>;
}

const makeSut = (): MakeSutInterface => {
  const usecase = new RequestOnboardingUsecaseStub();
  const observability = makeObservabilityMock();
  const handler = new RequestOnboardingHandler(usecase, observability);
  const app = express();
  app.use(express.json());
  app.post("/onboarding/requests", handler.handle.bind(handler));
  return { app, usecase, observability };
};

describe("RequestOnboardingHandler", () => {
  describe("when the public request has a valid body and correlation header", () => {
    it("should accept the request without requiring a bearer token", async () => {
      const { app, usecase } = makeSut();

      const response = await request(app)
        .post("/onboarding/requests")
        .set("x-correlation-id", "a0cf0d99-7306-4cda-8418-963e831033d4")
        .send(makeRequestOnboardingBody());

      expect(response).toMatchObject({
        status: 202,
        body: { error: false, data: expect.objectContaining({ status: "pending_activation" }) },
      });
      expect(usecase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: "a0cf0d99-7306-4cda-8418-963e831033d4" }),
      );
      expect(usecase.execute).toHaveBeenCalledWith(
        expect.not.objectContaining({ tenantId: expect.anything(), status: expect.anything() }),
      );
    });
  });

  describe("when the public request shape is invalid", () => {
    it.each([
      [undefined, makeRequestOnboardingBody()],
      ["not-a-uuid", makeRequestOnboardingBody()],
      ["a0cf0d99-7306-4cda-8418-963e831033d4", { ...makeRequestOnboardingBody(), settings: null }],
      [
        "a0cf0d99-7306-4cda-8418-963e831033d4",
        { ...makeRequestOnboardingBody(), tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d" },
      ],
      [
        "a0cf0d99-7306-4cda-8418-963e831033d4",
        { ...makeRequestOnboardingBody(), settings: { ...makeRequestOnboardingBody().settings, status: "active" } },
      ],
    ])("should reject the request before invoking the usecase", async (correlationId, body) => {
      const { app, usecase } = makeSut();

      const response = await request(app)
        .post("/onboarding/requests")
        .set("x-correlation-id", correlationId ?? "")
        .send(body);

      expect(response).toMatchObject({
        status: 400,
        body: { error: true, message: "Invalid onboarding request." },
      });
      expect(usecase.execute).not.toHaveBeenCalled();
    });

    it("should not capture a rejected shape as a usecase failure", async () => {
      const { app, observability } = makeSut();

      await request(app).post("/onboarding/requests").send(makeRequestOnboardingBody());

      expect(observability.capture).not.toHaveBeenCalled();
    });
  });

  describe("when the usecase rejects the request", () => {
    it.each([
      [new OnboardingOrganizationNameRequiredError(), 422, "Organization name is required."],
      [new RepositoryError("connection string leaked"), 500, "Internal server error"],
      [new Error("secret internal detail"), 500, "Internal server error"],
    ])("should capture the original error and return the safe mapped response", async (error, status, message) => {
      const { app, usecase, observability } = makeSut();
      usecase.execute.mockRejectedValue(error);

      const response = await request(app)
        .post("/onboarding/requests")
        .set("x-correlation-id", "a0cf0d99-7306-4cda-8418-963e831033d4")
        .send(makeRequestOnboardingBody());

      expect(response).toMatchObject({
        status,
        body: { error: true, message },
      });
      expect(observability.capture).toHaveBeenCalledTimes(1);
      expect(observability.capture).toHaveBeenCalledWith(error, {
        feature: "tenant.request-onboarding",
        correlationId: "a0cf0d99-7306-4cda-8418-963e831033d4",
      });
    });
  });
});
