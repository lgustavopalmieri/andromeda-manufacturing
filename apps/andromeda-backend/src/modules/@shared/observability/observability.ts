export interface ObservabilityContext {
  readonly [key: string]: unknown;
}

export interface ObservabilityInterface {
  capture(error: unknown, context?: ObservabilityContext): void;
}
