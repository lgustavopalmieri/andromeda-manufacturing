import { Router } from "express";
import type { AuthMiddlewaresInterface } from "platform/http/middlewares/auth/build-auth-middlewares";
import type { TenantContextMiddlewaresInterface } from "platform/http/middlewares/tenant-context/build-tenant-context-middleware";

export class ProtectedApiRouter {
  public static build(
    authentication: AuthMiddlewaresInterface,
    tenantContext: TenantContextMiddlewaresInterface,
  ): Router {
    const router = Router();
    router.use(authentication.authenticate);
    router.use(tenantContext.selectTenant);
    return router;
  }
}
