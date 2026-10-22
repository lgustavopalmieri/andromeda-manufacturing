import request from "supertest";
import type { RequestHandler } from "express";
import { describe, expect, it, vi } from "vitest";
import type { AuthMiddlewaresInterface } from "./middlewares/auth/build-auth-middlewares";
import type { TenantContextMiddlewaresInterface } from "./middlewares/tenant-context/build-tenant-context-middleware";
import { buildApiRoutes } from "./routes/api-routes";
import { HttpServer } from "./server";

interface MakeSutInterface {
  sut: HttpServer;
  logger: { info: ReturnType<typeof vi.fn> };
}

const makeSut = (
  authentication: AuthMiddlewaresInterface = {
    authenticate: ((_request, _response, next) => next()) satisfies RequestHandler,
  },
): MakeSutInterface => {
  const logger = { info: vi.fn() };
  return {
    sut: new HttpServer({
      logger,
      port: 3000,
      routes: buildApiRoutes(authentication, {
        selectTenant: ((_request, _response, next) => next()) satisfies RequestHandler,
      } satisfies TenantContextMiddlewaresInterface),
    }),
    logger,
  };
};

describe("HttpServer", () => {
  describe("when serving the public health endpoint", () => {
    it("should respond and log the completed request", async () => {
      const { sut, logger } = makeSut();

      const response = await request(sut.createApp()).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          path: "/health",
          statusCode: 200,
        }),
        "HTTP request completed",
      );
    });
  });

  describe("when serving a protected API route", () => {
    it("should keep health public and authenticate the API route first", async () => {
      const authenticate = vi.fn(((_request, _response, next) => next()) satisfies RequestHandler);
      const { sut } = makeSut({ authenticate });

      await expect(request(sut.createApp()).get("/health")).resolves.toMatchObject({
        status: 200,
      });
      await expect(request(sut.createApp()).get("/api/v1/not-yet-implemented")).resolves.toMatchObject({
        status: 404,
      });
      expect(authenticate).toHaveBeenCalledTimes(1);
    });
  });
});
