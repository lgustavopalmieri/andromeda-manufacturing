import type { RouteDefinition } from "platform/http/server";
import type { AuthMiddlewaresInterface } from "platform/http/middlewares/auth/build-auth-middlewares";
import type { TenantContextMiddlewaresInterface } from "platform/http/middlewares/tenant-context/build-tenant-context-middleware";
import type { DataSource } from "typeorm";
import { HealthRouter } from "./health.routes";
import { PublicOnboardingRouter } from "./public-onboarding.routes";
import { ProtectedApiRouter } from "./protected-api.routes";

export const buildApiRoutes = (
  authentication: AuthMiddlewaresInterface,
  tenantContext: TenantContextMiddlewaresInterface,
  dataSource?: DataSource,
): RouteDefinition[] => [
  { prefix: "/health", router: HealthRouter.build() },
  ...(dataSource === undefined
    ? []
    : [{ prefix: "/api/v1/onboarding", router: PublicOnboardingRouter.build(dataSource) }]),
  { prefix: "/api/v1", router: ProtectedApiRouter.build(authentication, tenantContext) },
];
