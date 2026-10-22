import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { TenantContextMiddleware } from "./tenant-context.middleware.js";

interface MakeSutInterface {
  sut: express.Express;
}

const makeSut = (): MakeSutInterface => {
  const app = express();
  const middleware = new TenantContextMiddleware();
  app.use(middleware.handle);
  app.get("/tenant", (request, response) => response.status(200).json({ tenantId: request.tenantId }));
  return { sut: app };
};

describe("TenantContextMiddleware", () => {
  describe("when the tenant selection is a UUID", () => {
    it("should expose it without treating it as authorization", async () => {
      const { sut } = makeSut();

      const response = await request(sut)
        .get("/tenant")
        .set("X-Tenant-Id", "75c5630e-56bb-4e5d-b1f5-ded0c15b931d");

      expect(response).toMatchObject({
        status: 200,
        body: { tenantId: "75c5630e-56bb-4e5d-b1f5-ded0c15b931d" },
      });
    });
  });

  describe("when the tenant selection is missing or malformed", () => {
    it("should reject it without revealing tenant existence", async () => {
      const { sut } = makeSut();

      await expect(request(sut).get("/tenant")).resolves.toMatchObject({
        status: 400,
        body: { error: "invalid_tenant_context" },
      });
      await expect(request(sut).get("/tenant").set("X-Tenant-Id", "tenant-foreign")).resolves.toMatchObject({
        status: 400,
        body: { error: "invalid_tenant_context" },
      });
    });
  });
});
