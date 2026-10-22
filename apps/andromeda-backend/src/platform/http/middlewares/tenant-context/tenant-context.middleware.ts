import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { TenantId } from "@shared/access/access.types";

export const TENANT_CONTEXT_HEADER = "x-tenant-id";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TenantContextMiddleware {
  public readonly handle: RequestHandler = (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const tenantId = request.header(TENANT_CONTEXT_HEADER);

    if (!tenantId || !UUID_PATTERN.test(tenantId)) {
      response.status(400).json({ error: "invalid_tenant_context" });
      return;
    }

    request.tenantId = tenantId;
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: TenantId;
    }
  }
}
