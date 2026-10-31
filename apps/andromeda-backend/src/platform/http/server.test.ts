import type { AddressInfo } from "node:net";
import express from "express";
import type { Router } from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { HttpServer } from "./server";

interface MakeSutOptionsInterface {
  port?: number;
  routes?: readonly {
    prefix: string;
    router: Router;
  }[];
}

interface MakeSutInterface {
  sut: HttpServer;
}

const servers = new Set<HttpServer>();

const makeSut = (options: MakeSutOptionsInterface = {}): MakeSutInterface => {
  const sut = new HttpServer({
    host: "127.0.0.1",
    port: options.port ?? 0,
    routes: options.routes ?? [],
  });
  servers.add(sut);
  return {
    sut,
  };
};

afterEach(async () => {
  await Promise.all([...servers].map((server) => server.stop()));
  servers.clear();
});

describe("HttpServer", () => {
  describe("when starting with injected routes", () => {
    it("should listen on the configured loopback address and serve minimal health data", async () => {
      const { sut } = makeSut();

      await sut.start();
      const response = await request(sut.server).get("/health");

      expect(sut.server.address()).toMatchObject({
        address: "127.0.0.1",
        family: "IPv4",
      });
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.body).toEqual({
        error: false,
        data: {
          status: "ok",
        },
      });
    });

    it("should mount each supplied router at its prefix and parse JSON bodies", async () => {
      const first = express.Router();
      first.post("/echo", (req, res) =>
        res.json({
          received: req.body,
        }),
      );
      const second = express.Router();
      second.get("/ping", (_req, res) => res.status(204).end());
      const { sut } = makeSut({
        routes: [
          {
            prefix: "/first",
            router: first,
          },
          {
            prefix: "/second",
            router: second,
          },
        ],
      });

      await sut.start();
      const response = await request(sut.server).post("/first/echo").send({
        value: 42,
      });
      const secondResponse = await request(sut.server).get("/second/ping");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        received: {
          value: 42,
        },
      });
      expect(secondResponse.status).toBe(204);
      expect(
        (
          await request(sut.server).post("/echo").send({
            value: 42,
          })
        ).status,
      ).toBe(404);
    });

    it("should keep health independent from an injected fallback router", async () => {
      const router = express.Router();
      router.use((_req, res) =>
        res.json({
          privateData: "synthetic-business-data",
        }),
      );
      const { sut } = makeSut({
        routes: [
          {
            prefix: "/",
            router,
          },
        ],
      });

      await sut.start();
      const response = await request(sut.server).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        error: false,
        data: {
          status: "ok",
        },
      });
    });

    it("should leave the protected validation route absent unless explicitly injected", async () => {
      const { sut } = makeSut();

      await sut.start();
      const response = await request(sut.server)
        .post("/api/v1/authorization/validate-good-report")
        .send({
          machineId: "synthetic-machine",
        });

      expect(response.status).toBe(404);
    });

    it("should reuse one listener for concurrent or repeated starts", async () => {
      const { sut } = makeSut();

      await Promise.all([sut.start(), sut.start()]);
      const address = sut.server.address();
      await sut.start();

      expect(sut.server.address()).toEqual(address);
      expect((await request(sut.server).get("/health")).status).toBe(200);
    });
  });

  describe("when closing the server", () => {
    it("should resolve without opening a listener when it has never started", async () => {
      const { sut } = makeSut();

      await sut.stop();
      await sut.stop();

      expect(sut.server.listening).toBe(false);
      expect(sut.server.address()).toBeNull();
    });

    it("should release the configured port and tolerate concurrent or repeated closes", async () => {
      const { sut } = makeSut();
      await sut.start();
      const address = sut.server.address() as AddressInfo;

      await Promise.all([sut.stop(), sut.stop()]);
      await sut.stop();

      expect(sut.server.listening).toBe(false);
      expect(sut.server.address()).toBeNull();
      const { sut: replacement } = makeSut({
        port: address.port,
      });
      await replacement.start();
      expect(replacement.server.address()).toEqual(address);
    });

    it("should close a listener whose startup is still pending", async () => {
      const { sut } = makeSut();

      const starting = sut.start();
      const stopping = sut.stop();
      await Promise.all([starting, stopping]);

      expect(sut.server.listening).toBe(false);
      expect(sut.server.address()).toBeNull();
    });

    it("should finish an active request before close resolves", async () => {
      let finishResponse!: () => void;
      let notifyRequestStarted!: () => void;
      const requestStarted = new Promise<void>((resolve) => {
        notifyRequestStarted = resolve;
      });
      const router = express.Router();
      router.get("/slow", (_req, res) => {
        finishResponse = () =>
          res.json({
            completed: true,
          });
        notifyRequestStarted();
      });
      const { sut } = makeSut({
        routes: [
          {
            prefix: "/",
            router,
          },
        ],
      });
      await sut.start();
      const responsePromise = request(sut.server)
        .get("/slow")
        .then((response) => response);
      await requestStarted;
      let stopped = false;

      const stopping = sut.stop().then(() => {
        stopped = true;
      });
      await new Promise<void>((resolve) => setImmediate(resolve));
      const stoppedBeforeResponse = stopped;
      finishResponse();
      const response = await responsePromise;
      await stopping;

      expect(stoppedBeforeResponse).toBe(false);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        completed: true,
      });
      expect(sut.server.listening).toBe(false);
    });

    it("should start again after a completed close", async () => {
      const { sut } = makeSut();
      await sut.start();
      await sut.stop();

      await sut.start();

      expect((await request(sut.server).get("/health")).status).toBe(200);
    });
  });

  describe("when the configured port is occupied", () => {
    it("should reject startup without leaving a listener and allow retry after the port is released", async () => {
      const { sut: occupyingServer } = makeSut();
      await occupyingServer.start();
      const address = occupyingServer.server.address() as AddressInfo;
      const { sut } = makeSut({
        port: address.port,
      });

      const failure = await sut.start().catch((error: unknown) => error);
      await sut.stop();

      expect(failure).toBeInstanceOf(Error);
      expect(failure).toMatchObject({
        code: "EADDRINUSE",
        message: expect.stringContaining("EADDRINUSE"),
      });
      expect(sut.server.listening).toBe(false);
      expect(
        (await request(occupyingServer.server).get("/health")).status,
      ).toBe(200);
      await occupyingServer.stop();
      await sut.start();
      expect(sut.server.address()).toEqual(address);
      expect((await request(sut.server).get("/health")).status).toBe(200);
    });
  });

  describe("when the listener rejects its arguments synchronously", () => {
    it("should reject startup and remove temporary lifecycle listeners", async () => {
      const { sut } = makeSut({
        port: -1,
      });
      const errorListeners = sut.server.listenerCount("error");
      const listeningListeners = sut.server.listenerCount("listening");

      const failure = await sut.start().catch((error: unknown) => error);
      await sut.stop();

      expect(failure).toBeInstanceOf(RangeError);
      expect(failure).toMatchObject({
        code: "ERR_SOCKET_BAD_PORT",
        message: expect.stringContaining("Received type number (-1)"),
      });
      expect(sut.server.listening).toBe(false);
      expect(sut.server.listenerCount("error")).toBe(errorListeners);
      expect(sut.server.listenerCount("listening")).toBe(listeningListeners);
    });
  });
});
