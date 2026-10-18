import { Router } from "express";

export class HealthRouter {
  public static build(): Router {
    const router = Router();

    router.get("/", (_request, response) => {
      response.status(200).json({ status: "ok" });
    });

    return router;
  }
}
