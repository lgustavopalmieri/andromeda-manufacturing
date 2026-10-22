import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { TokenVerifierInterface } from "platform/auth/interfaces";
import { AuthenticationMiddleware } from "./authentication.middleware.js";

interface MakeSutInterface {
  app: express.Express;
  logger: { warn: ReturnType<typeof vi.fn> };
}

const makeSut = (tokenVerifier: TokenVerifierInterface): MakeSutInterface => {
  const logger = { warn: vi.fn() };
  const app = express();
  app.use(new AuthenticationMiddleware(tokenVerifier, logger).handle);
  app.get("/protected", (request, response) => {
    response.status(200).json({ identity: request.authenticatedIdentity });
  });

  return { app, logger };
};

describe("AuthenticationMiddleware", () => {
  describe("when a bearer token is verified", () => {
    it("should attach the authenticated identity without assigning authorization", async () => {
      const tokenVerifier: TokenVerifierInterface = {
        verify: vi.fn(async () => ({
          providerSubjectId: "keycloak-subject-01",
          authenticatedAt: new Date("2026-10-22T12:00:00.000Z"),
        })),
      };
      const { app } = makeSut(tokenVerifier);

      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        identity: {
          providerSubjectId: "keycloak-subject-01",
          authenticatedAt: "2026-10-22T12:00:00.000Z",
        },
      });
      expect(tokenVerifier.verify).toHaveBeenCalledWith("valid-token");
    });
  });

  describe("when the authorization header is missing or malformed", () => {
    it.each([undefined, "Basic value", "Bearer", "Bearer first second", "Token value"])(
      "should reject header %s",
      async (authorization) => {
        const tokenVerifier: TokenVerifierInterface = { verify: vi.fn() };
        const { app, logger } = makeSut(tokenVerifier);
        const pendingRequest = request(app).get("/protected");
        const response = await (authorization === undefined
          ? pendingRequest
          : pendingRequest.set("Authorization", authorization));

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "unauthorized" });
        expect(tokenVerifier.verify).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
          expect.objectContaining({ errorName: "MissingBearerTokenError" }),
          "HTTP authentication failed",
        );
      },
    );
  });

  describe("when the token verifier rejects the bearer token", () => {
    it("should return a non-enumerating response", async () => {
      const tokenVerifier: TokenVerifierInterface = {
        verify: vi.fn(async () => {
          throw new Error("signature validation failed for kid sensitive-key-id");
        }),
      };
      const { app, logger } = makeSut(tokenVerifier);

      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "unauthorized" });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ errorName: "Error" }),
        "HTTP authentication failed",
      );
    });
  });
});
