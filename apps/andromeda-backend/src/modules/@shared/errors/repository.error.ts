export class RepositoryError extends Error {
  public override readonly name: string = "RepositoryError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class RepositoryUnavailableError extends RepositoryError {
  public override readonly name = "RepositoryUnavailableError";
}
