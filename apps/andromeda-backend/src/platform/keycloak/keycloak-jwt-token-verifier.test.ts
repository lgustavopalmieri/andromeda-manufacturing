import { generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import type { KeycloakJwtVerificationConfigInterface } from "configs/keycloak";
import { InvalidAccessTokenError } from "../auth/errors.js";
import { KeycloakJwtTokenVerifier } from "./keycloak-jwt-token-verifier.js";

const keycloakConfig: KeycloakJwtVerificationConfigInterface = {
  issuer: "https://identity.example.com/realms/andromeda",
  audience: "andromeda-backend",
  jwksUrl: "https://identity.example.com/realms/andromeda/protocol/openid-connect/certs",
  algorithms: ["RS256"],
};

interface MakeSutInterface {
  sut: KeycloakJwtTokenVerifier;
}

const makeSut = (verificationKey: CryptoKey): MakeSutInterface => ({
  sut: new KeycloakJwtTokenVerifier(keycloakConfig, verificationKey),
});

const createAccessToken = async (
  privateKey: CryptoKey,
  claims: Record<string, unknown> = {},
): Promise<string> =>
  await new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(keycloakConfig.issuer)
    .setAudience(keycloakConfig.audience)
    .setSubject("keycloak-subject-01")
    .setIssuedAt(1_792_000_000)
    .setExpirationTime("5m")
    .sign(privateKey);

describe("KeycloakJwtTokenVerifier", () => {
  describe("when a valid Keycloak access token includes roles and scopes", () => {
    it("should return only the authenticated identity contract", async () => {
      const { privateKey, publicKey } = await generateKeyPair("RS256");
      const token = await createAccessToken(privateKey, {
        auth_time: 1_791_999_000,
        realm_access: { roles: ["tenant-owner", "machine-operator"] },
        resource_access: { "andromeda-backend": { roles: ["devices:write"] } },
        scope: "openid profile devices:write",
        amr: ["pwd", "otp"],
      });
      const { sut } = makeSut(publicKey);

      await expect(sut.verify(token)).resolves.toEqual({
        providerSubjectId: "keycloak-subject-01",
        authenticatedAt: new Date("2026-10-14T17:30:00.000Z"),
        authenticationMethod: "pwd",
      });
    });
  });

  describe("when the access token violates a verification invariant", () => {
    it("should reject a token issued for another audience", async () => {
      const { privateKey, publicKey } = await generateKeyPair("RS256");
      const token = await new SignJWT()
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer(keycloakConfig.issuer)
        .setAudience("another-service")
        .setSubject("keycloak-subject-01")
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(privateKey);
      const { sut } = makeSut(publicKey);

      await expect(sut.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
    });

    it("should reject a token issued by another Keycloak realm", async () => {
      const { privateKey, publicKey } = await generateKeyPair("RS256");
      const token = await new SignJWT()
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer("https://identity.example.com/realms/another-realm")
        .setAudience(keycloakConfig.audience)
        .setSubject("keycloak-subject-01")
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(privateKey);
      const { sut } = makeSut(publicKey);

      await expect(sut.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
    });

    it("should reject a token with no provider subject even when its signature is valid", async () => {
      const { privateKey, publicKey } = await generateKeyPair("RS256");
      const token = await new SignJWT()
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer(keycloakConfig.issuer)
        .setAudience(keycloakConfig.audience)
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(privateKey);
      const { sut } = makeSut(publicKey);

      await expect(sut.verify(token)).rejects.toBeInstanceOf(InvalidAccessTokenError);
    });

    it("should reject expired or unsigned tokens without exposing verifier details", async () => {
      const { privateKey, publicKey } = await generateKeyPair("RS256");
      const expiredToken = await new SignJWT()
        .setProtectedHeader({ alg: "RS256" })
        .setIssuer(keycloakConfig.issuer)
        .setAudience(keycloakConfig.audience)
        .setSubject("keycloak-subject-01")
        .setIssuedAt(1)
        .setExpirationTime(2)
        .sign(privateKey);
      const { sut } = makeSut(publicKey);

      await expect(sut.verify(expiredToken)).rejects.toEqual(new InvalidAccessTokenError());
      await expect(sut.verify("not-a-jwt")).rejects.toEqual(new InvalidAccessTokenError());
    });
  });
});
