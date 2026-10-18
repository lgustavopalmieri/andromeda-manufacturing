import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { buildApiRoutes } from "./routes/api-routes";
import { HttpServer } from "./server";

describe("HttpServer", () => {
  it("serves the health endpoint and logs the completed request", async () => {
    const logger = { info: vi.fn() };
    const httpServer = new HttpServer({
      logger,
      port: 3000,
      routes: buildApiRoutes(),
    });

    const response = await request(httpServer.createApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        path: "/health",
        statusCode: 200,
      }),
      "HTTP request completed",
    );
  });
});
