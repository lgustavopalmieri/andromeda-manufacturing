export class RuntimeConfigurationError extends Error {
  constructor(fields: string[]) {
    super(`Invalid runtime configuration: ${[...new Set(fields)].join(", ")}.`);
    this.name = "RuntimeConfigurationError";
  }
}
