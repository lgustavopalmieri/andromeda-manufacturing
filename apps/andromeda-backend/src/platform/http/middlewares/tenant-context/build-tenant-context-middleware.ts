import type { RequestHandler } from "express";
import { TenantContextMiddleware } from "./tenant-context.middleware.js";

export interface TenantContextMiddlewaresInterface {
  selectTenant: RequestHandler;
}

export const buildTenantContextMiddlewares = (): TenantContextMiddlewaresInterface => {
  const tenantContext = new TenantContextMiddleware();
  return { selectTenant: tenantContext.handle };
};
