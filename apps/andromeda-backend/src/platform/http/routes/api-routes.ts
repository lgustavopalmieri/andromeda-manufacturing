import type { RouteDefinition } from "platform/http/server";
import { HealthRouter } from "./health.routes";

export const buildApiRoutes = (): RouteDefinition[] => [
  { prefix: "/health", router: HealthRouter.build() },
];
