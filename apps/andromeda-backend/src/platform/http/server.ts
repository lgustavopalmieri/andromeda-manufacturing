import express from "express";
import type { Express, Router } from "express";
import type { Server } from "node:http";
import pino from "pino";
import {
  createRequestLoggerMiddleware,
  type HttpLoggerInterface,
} from "./middlewares/request-logger.middleware";

export interface RouteDefinition {
  prefix: string;
  router: Router;
}

export interface HttpServerOptions {
  port: number;
  routes: RouteDefinition[];
  logger?: HttpLoggerInterface;
}

export class HttpServer {
  private readonly app: Express;
  private server: Server | undefined;

  public constructor(private readonly options: HttpServerOptions) {
    this.app = express();
    this.app.use(express.json());
    this.app.use(createRequestLoggerMiddleware(options.logger ?? pino()));

    for (const { prefix, router } of options.routes) {
      this.app.use(prefix, router);
    }
  }

  public start(): void {
    this.server = this.app.listen(this.options.port, () => {
      console.log(`andromeda-backend listening on port ${this.options.port}`);
    });
  }

  public async stop(): Promise<void> {
    if (!this.server) return;

    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => (error ? reject(error) : resolve()));
    });
  }

  public createApp(): Express {
    return this.app;
  }
}
