import { HttpServer } from "platform/http/server";
import { buildApiRoutes } from "platform/http/routes/api-routes";

const bootstrap = (): void => {
  const httpServer = new HttpServer({
    port: Number(process.env["PORT"] ?? 3000),
    routes: buildApiRoutes(),
  });

  httpServer.start();
};

bootstrap();
