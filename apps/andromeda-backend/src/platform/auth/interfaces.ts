import type { AuthenticatedIdentityInterface } from "@shared/access/access.types";

export interface TokenVerifierInterface {
  verify(token: string): Promise<AuthenticatedIdentityInterface>;
}
