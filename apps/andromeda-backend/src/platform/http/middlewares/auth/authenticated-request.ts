import type { AuthenticatedIdentityInterface } from "@shared/access/access.types";

declare global {
  namespace Express {
    interface Request {
      authenticatedIdentity?: AuthenticatedIdentityInterface;
    }
  }
}

export {};
