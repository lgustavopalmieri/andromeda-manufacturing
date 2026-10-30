import { createServer } from "node:http";
import type { Server } from "node:http";
import express from "express";
import type { Router } from "express";
import type { RuntimeConfigInterface } from "configs/runtimeconfig/interface";
import type { HttpSuccessResponseInterface } from "@shared/http/http-response";

export interface HttpRouteInterface {
  readonly prefix: string;
  readonly router: Router;
}

export interface HttpServerOptionsInterface {
  readonly host: RuntimeConfigInterface["http"]["host"];
  readonly port: RuntimeConfigInterface["http"]["port"];
  readonly routes: readonly HttpRouteInterface[];
}

export class HttpServer {
  readonly server: Server;
  private startPromise: Promise<void> | undefined;
  private stopPromise: Promise<void> | undefined;

  constructor(private readonly options: HttpServerOptionsInterface) {
    const app = express();
    app.get("/health", (_req, res) => {
      const response: HttpSuccessResponseInterface<{
        status: "ok";
      }> = {
        error: false,
        data: {
          status: "ok",
        },
      };
      res.json(response);
    });
    app.use(express.json());
    for (const route of options.routes) app.use(route.prefix, route.router);
    this.server = createServer(app);
  }

  async start(): Promise<void> {
    if (this.stopPromise) await this.stopPromise;
    if (this.server.listening) return;

    this.startPromise ??= new Promise<void>((resolve, reject) => {
      const onError = (error: unknown): void => {
        this.server.off("error", onError);
        this.server.off("listening", onListening);
        reject(error);
      };
      const onListening = (): void => {
        this.server.off("error", onError);
        resolve();
      };
      this.server.once("error", onError);
      this.server.once("listening", onListening);
      try {
        this.server.listen(this.options.port, this.options.host);
      } catch (error) {
        onError(error);
      }
    }).finally(() => { this.startPromise = undefined; });

    await this.startPromise;
  }

  async stop(): Promise<void> {
    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        return;
      }
    }
    if (this.stopPromise) return this.stopPromise;
    if (!this.server.listening) return;

    this.stopPromise = new Promise<void>((resolve, reject) => {
      this.server.close((error) => error ? reject(error) : resolve());
    }).finally(() => { this.stopPromise = undefined; });

    await this.stopPromise;
  }
}
