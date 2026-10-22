import type { RouteDefinition } from "platform/http/server";
import type { AuthMiddlewaresInterface } from "platform/http/middlewares/auth/build-auth-middlewares";
import type { TenantContextMiddlewaresInterface } from "platform/http/middlewares/tenant-context/build-tenant-context-middleware";
import { HealthRouter } from "./health.routes";
import { ProtectedApiRouter } from "./protected-api.routes";

export const buildApiRoutes = (
  authentication: AuthMiddlewaresInterface,
  tenantContext: TenantContextMiddlewaresInterface,
): RouteDefinition[] => [
  { prefix: "/health", router: HealthRouter.build() },
  { prefix: "/api/v1", router: ProtectedApiRouter.build(authentication, tenantContext) },
];
