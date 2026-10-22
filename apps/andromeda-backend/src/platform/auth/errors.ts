export class AuthenticationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class MissingBearerTokenError extends AuthenticationError {
  public constructor() {
    super("A bearer token is required.");
    this.name = "MissingBearerTokenError";
  }
}

export class InvalidAccessTokenError extends AuthenticationError {
  public constructor() {
    super("The access token is invalid or expired.");
    this.name = "InvalidAccessTokenError";
  }
}
