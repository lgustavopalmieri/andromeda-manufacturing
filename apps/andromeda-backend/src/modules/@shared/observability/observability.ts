export interface ObservabilityContextInterface {
  readonly [key: string]: unknown;
}

export interface ObservabilityInterface {
  event(name: string, context?: ObservabilityContextInterface): void;
  capture(error: unknown, context?: ObservabilityContextInterface): void;
}
