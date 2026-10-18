import type { NextFunction, Request, RequestHandler, Response } from "express";

export interface HttpLoggerInterface {
  info(bindings: Record<string, unknown>, message: string): void;
}

export const createRequestLoggerMiddleware = (logger: HttpLoggerInterface): RequestHandler =>
  (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = performance.now();
    const path = new URL(request.originalUrl, "http://localhost").pathname;

    response.on("finish", () => {
      logger.info(
        {
          durationMs: Math.round(performance.now() - startedAt),
          method: request.method,
          path,
          statusCode: response.statusCode,
        },
        "HTTP request completed",
      );
    });

    next();
  };
