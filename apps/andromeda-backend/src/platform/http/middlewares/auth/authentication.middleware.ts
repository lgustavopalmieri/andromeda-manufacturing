import type { NextFunction, Request, RequestHandler, Response } from "express";
import { MissingBearerTokenError } from "../../../auth/errors.js";
import type { TokenVerifierInterface } from "../../../auth/interfaces.js";

export interface AuthenticationLoggerInterface {
  warn(bindings: Record<string, unknown>, message: string): void;
}

export class AuthenticationMiddleware {
  public constructor(
    private readonly tokenVerifier: TokenVerifierInterface,
    private readonly logger: AuthenticationLoggerInterface,
  ) {}

  public readonly handle: RequestHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = this.extractBearerToken(request);
      request.authenticatedIdentity = await this.tokenVerifier.verify(token);
      next();
    } catch (error) {
      this.logger.warn(
        {
          errorName: error instanceof Error ? error.name : "UnknownAuthenticationError",
          method: request.method,
          path: new URL(request.originalUrl, "http://localhost").pathname,
        },
        "HTTP authentication failed",
      );
      response.status(401).json({ error: "unauthorized" });
    }
  };

  private extractBearerToken(request: Request): string {
    const authorization = request.header("authorization");

    if (!authorization) throw new MissingBearerTokenError();

    const match = /^Bearer ([^\s]+)$/i.exec(authorization.trim());

    if (!match?.[1]) throw new MissingBearerTokenError();
    return match[1];
  }
}
