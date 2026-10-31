import pino from "pino";
import type { DestinationStream, Logger } from "pino";
import { createErrorLogPayload } from "@shared/observability/create-error-log-payload";
import { createEventLogPayload } from "@shared/observability/create-event-log-payload";
import type {
  ObservabilityContextInterface,
  ObservabilityInterface,
} from "@shared/observability/observability";

export class PinoObservability implements ObservabilityInterface {
  private readonly logger: Logger;

  constructor(destination?: DestinationStream) {
    this.logger = pino(
      {
        base: null,
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      destination,
    );
  }

  event(name: string, context?: ObservabilityContextInterface): void {
    this.logger.info(createEventLogPayload(name, context));
  }

  capture(error: unknown, context?: ObservabilityContextInterface): void {
    this.logger.error(createErrorLogPayload(error, context));
  }
}
