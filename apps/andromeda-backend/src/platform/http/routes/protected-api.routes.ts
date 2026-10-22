import { Router } from "express";
import type { AuthMiddlewaresInterface } from "platform/http/middlewares/auth/build-auth-middlewares";

export class ProtectedApiRouter {
  public static build(authentication: AuthMiddlewaresInterface): Router {
    const router = Router();
    router.use(authentication.authenticate);
    return router;
  }
}
