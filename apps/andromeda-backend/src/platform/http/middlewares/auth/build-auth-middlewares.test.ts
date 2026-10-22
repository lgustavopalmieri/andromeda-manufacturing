import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { TokenVerifierInterface } from "platform/auth/interfaces";
import { makeAuthenticatedIdentity } from "../../../../modules/@shared/tests/factories/access/access.factory";
import { HttpServer } from "../../server";
import { buildApiRoutes } from "../../routes/api-routes";
import { buildTenantContextMiddlewares } from "../tenant-context/build-tenant-context-middleware";
import type { AuthenticationLoggerInterface } from "./authentication.middleware";
import { buildAuthMiddlewares } from "./build-auth-middlewares";

interface MakeSutInterface {
  sut: HttpServer;
  tokenVerifier: TokenVerifierInterface;
  authenticationLogger: AuthenticationLoggerInterface;
}

const makeSut = (): MakeSutInterface => {
  const tokenVerifier: TokenVerifierInterface = {
    verify: vi.fn(async (_token: string) => makeAuthenticatedIdentity()),
  };
  const authenticationLogger: AuthenticationLoggerInterface = { warn: vi.fn() };
  const authentication = buildAuthMiddlewares({ tokenVerifier, logger: authenticationLogger });

  return {
    sut: new HttpServer({
      logger: { info: vi.fn() },
      port: 3000,
      routes: buildApiRoutes(authentication, buildTenantContextMiddlewares()),
    }),
    tokenVerifier,
    authenticationLogger,
  };
};

describe("buildAuthMiddlewares", () => {
  describe("when composed with the API routes", () => {
    it("should keep health public and reject an API request without a bearer token", async () => {
      const { sut, tokenVerifier, authenticationLogger } = makeSut();

      const healthResponse = await request(sut.createApp()).get("/health");
      const apiResponse = await request(sut.createApp()).get("/api/v1/not-yet-implemented");

      expect(healthResponse.status).toBe(200);
      expect(apiResponse).toMatchObject({ status: 401, body: { error: "unauthorized" } });
      expect(tokenVerifier.verify).not.toHaveBeenCalled();
      expect(authenticationLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ errorName: "MissingBearerTokenError" }),
        "HTTP authentication failed",
      );
    });

    it("should verify a bearer token before allowing the protected router to handle the request", async () => {
      const { sut, tokenVerifier } = makeSut();

      const response = await request(sut.createApp())
        .get("/api/v1/not-yet-implemented")
        .set("Authorization", "Bearer valid-token")
        .set("X-Tenant-Id", "75c5630e-56bb-4e5d-b1f5-ded0c15b931d");

      expect(response.status).toBe(404);
      expect(tokenVerifier.verify).toHaveBeenCalledWith("valid-token");
    });
  });
});
