import { z } from "zod";

const keycloakEnvironmentSchema = z.object({
  KEYCLOAK_ISSUER_URL: z.url(),
  KEYCLOAK_AUDIENCE: z.string().trim().min(1),
  KEYCLOAK_JWKS_URL: z.url().optional(),
});

export interface KeycloakJwtVerificationConfigInterface {
  issuer: string;
  audience: string;
  jwksUrl: string;
  algorithms: readonly ["RS256"];
}

export const loadKeycloakJwtVerificationConfig = (
  environment: Record<string, string | undefined> = process.env,
): KeycloakJwtVerificationConfigInterface => {
  const parsedEnvironment = keycloakEnvironmentSchema.parse(environment);
  const issuer = parsedEnvironment.KEYCLOAK_ISSUER_URL.replace(/\/$/, "");

  return {
    issuer,
    audience: parsedEnvironment.KEYCLOAK_AUDIENCE,
    jwksUrl:
      parsedEnvironment.KEYCLOAK_JWKS_URL ?? `${issuer}/protocol/openid-connect/certs`,
    algorithms: ["RS256"],
  };
};
