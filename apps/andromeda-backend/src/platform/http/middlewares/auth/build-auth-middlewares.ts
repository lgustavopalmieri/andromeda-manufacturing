import pino from "pino";
import type { RequestHandler } from "express";
import { loadKeycloakJwtVerificationConfig } from "configs/keycloak";
import { KeycloakJwtTokenVerifier } from "platform/keycloak/keycloak-jwt-token-verifier";
import type { TokenVerifierInterface } from "platform/auth/interfaces";
import {
  AuthenticationMiddleware,
  type AuthenticationLoggerInterface,
} from "./authentication.middleware.js";

export interface AuthMiddlewaresInterface {
  authenticate: RequestHandler;
}

export interface BuildAuthMiddlewaresOptionsInterface {
  tokenVerifier?: TokenVerifierInterface;
  logger?: AuthenticationLoggerInterface;
}

export const buildAuthMiddlewares = (
  options: BuildAuthMiddlewaresOptionsInterface = {},
): AuthMiddlewaresInterface => {
  const tokenVerifier =
    options.tokenVerifier ?? new KeycloakJwtTokenVerifier(loadKeycloakJwtVerificationConfig());
  const logger = options.logger ?? pino();
  const authentication = new AuthenticationMiddleware(tokenVerifier, logger);

  return { authenticate: authentication.handle };
};
