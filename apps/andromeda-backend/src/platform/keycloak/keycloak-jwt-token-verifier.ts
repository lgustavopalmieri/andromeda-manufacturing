import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTVerifyGetKey, KeyInput } from "jose";
import type { AuthenticatedIdentityInterface } from "@shared/access/access.types";
import type { KeycloakJwtVerificationConfigInterface } from "configs/keycloak";
import { InvalidAccessTokenError } from "../auth/errors.js";
import type { TokenVerifierInterface } from "../auth/interfaces.js";

type VerificationKey = KeyInput | JWTVerifyGetKey;

export class KeycloakJwtTokenVerifier implements TokenVerifierInterface {
  private readonly verificationKey: VerificationKey;

  public constructor(
    private readonly config: KeycloakJwtVerificationConfigInterface,
    verificationKey?: VerificationKey,
  ) {
    this.verificationKey = verificationKey ?? createRemoteJWKSet(new URL(config.jwksUrl));
  }

  public async verify(token: string): Promise<AuthenticatedIdentityInterface> {
    try {
      const { payload } = await this.verifyJwt(token);

      if (typeof payload.sub !== "string" || payload.sub.length === 0) {
        throw new InvalidAccessTokenError();
      }

      const authenticationMethod = this.authenticationMethodOf(payload.amr);

      return {
        providerSubjectId: payload.sub,
        authenticatedAt: this.resolveAuthenticatedAt(payload.auth_time, payload.iat),
        ...(authenticationMethod === undefined ? {} : { authenticationMethod }),
      };
    } catch (error) {
      if (error instanceof InvalidAccessTokenError) throw error;
      throw new InvalidAccessTokenError();
    }
  }

  private async verifyJwt(token: string) {
    return await jwtVerify(token, this.verificationKey, {
      algorithms: [...this.config.algorithms],
      audience: this.config.audience,
      issuer: this.config.issuer,
    });
  }

  private resolveAuthenticatedAt(authTime: unknown, issuedAt: unknown): Date {
    const timestamp = typeof authTime === "number" ? authTime : issuedAt;

    if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
      throw new InvalidAccessTokenError();
    }

    const authenticatedAt = new Date(timestamp * 1000);

    if (Number.isNaN(authenticatedAt.getTime())) {
      throw new InvalidAccessTokenError();
    }

    return authenticatedAt;
  }

  private authenticationMethodOf(value: unknown): string | undefined {
    if (!Array.isArray(value) || typeof value[0] !== "string") return undefined;
    return value[0];
  }
}
