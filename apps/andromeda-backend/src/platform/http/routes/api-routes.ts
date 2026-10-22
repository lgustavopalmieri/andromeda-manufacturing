import type { RouteDefinition } from "platform/http/server";
import type { AuthMiddlewaresInterface } from "platform/http/middlewares/auth/build-auth-middlewares";
import { HealthRouter } from "./health.routes";
import { ProtectedApiRouter } from "./protected-api.routes";

export const buildApiRoutes = (authentication: AuthMiddlewaresInterface): RouteDefinition[] => [
  { prefix: "/health", router: HealthRouter.build() },
  { prefix: "/api/v1", router: ProtectedApiRouter.build(authentication) },
];
