import { describe, expect, it } from "vitest";
import { loadKeycloakJwtVerificationConfig } from "./keycloak.js";

interface MakeSutInterface {
  sut: typeof loadKeycloakJwtVerificationConfig;
}

const makeSut = (): MakeSutInterface => ({ sut: loadKeycloakJwtVerificationConfig });

describe("loadKeycloakJwtVerificationConfig", () => {
  describe("when the Keycloak realm endpoint is configured without a JWKS endpoint", () => {
    it("should derive the Keycloak JWKS endpoint and permit only RS256", () => {
      const { sut } = makeSut();

      expect(
        sut({
          KEYCLOAK_ISSUER_URL: "https://identity.example.com/realms/andromeda/",
          KEYCLOAK_AUDIENCE: "andromeda-backend",
        }),
      ).toEqual({
        issuer: "https://identity.example.com/realms/andromeda",
        audience: "andromeda-backend",
        jwksUrl: "https://identity.example.com/realms/andromeda/protocol/openid-connect/certs",
        algorithms: ["RS256"],
      });
    });
  });

  describe("when a Keycloak JWKS endpoint is explicitly configured", () => {
    it("should use the configured endpoint", () => {
      const { sut } = makeSut();

      expect(
        sut({
          KEYCLOAK_ISSUER_URL: "https://identity.example.com/realms/andromeda",
          KEYCLOAK_AUDIENCE: "andromeda-backend",
          KEYCLOAK_JWKS_URL: "https://keys.example.com/key-set",
        }).jwksUrl,
      ).toBe("https://keys.example.com/key-set");
    });
  });

  describe("when the Keycloak configuration is incomplete or invalid", () => {
    it("should reject it", () => {
      const { sut } = makeSut();

      expect(() => sut({ KEYCLOAK_AUDIENCE: "andromeda-backend" })).toThrow();
      expect(() =>
        sut({
          KEYCLOAK_ISSUER_URL: "not-a-url",
          KEYCLOAK_AUDIENCE: "andromeda-backend",
        }),
      ).toThrow();
    });
  });
});
