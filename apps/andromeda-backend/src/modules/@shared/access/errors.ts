import type { AuthorizationObligationInterface } from "./access.types.js";

export class ContextualAuthorizationDeniedError extends Error {
  public constructor() {
    super("The requested operation is not permitted.");
    this.name = "ContextualAuthorizationDeniedError";
  }
}

export class AuthorizationObligationRequiredError extends Error {
  public constructor(public readonly obligations: readonly AuthorizationObligationInterface[]) {
    super("Additional authorization requirements must be completed.");
    this.name = "AuthorizationObligationRequiredError";
  }
}
