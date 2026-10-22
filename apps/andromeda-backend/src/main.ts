import "dotenv/config";
import { HttpServer } from "platform/http/server";
import { buildAuthMiddlewares } from "platform/http/middlewares/auth/build-auth-middlewares";
import { buildApiRoutes } from "platform/http/routes/api-routes";

const bootstrap = (): void => {
  const httpServer = new HttpServer({
    port: Number(process.env["PORT"] ?? 3000),
    routes: buildApiRoutes(buildAuthMiddlewares()),
  });

  httpServer.start();
};

bootstrap();
