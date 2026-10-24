import { Router } from "express";
import type { DataSource } from "typeorm";
import { RequestOnboardingWire } from "modules/tenant/features/request-onboarding/wire";

export class PublicOnboardingRouter {
  public static build(dataSource: DataSource): Router {
    const router = Router();
    router.post("/requests", RequestOnboardingWire.provideHttpHandler(dataSource));
    return router;
  }
}
