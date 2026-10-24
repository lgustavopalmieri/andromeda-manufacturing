import type {
  ObservabilityContext,
  ObservabilityInterface,
} from "@shared/observability/observability";

export class PinoObservability implements ObservabilityInterface {
  public constructor(
    private readonly logger: { error(bindings: Record<string, unknown>, message: string): void },
  ) {}

  public capture(error: unknown, context: ObservabilityContext = {}): void {
    this.logger.error({ err: error, ...context }, "Unhandled feature error");
  }
}
