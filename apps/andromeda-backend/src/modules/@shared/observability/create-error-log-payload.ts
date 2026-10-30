import type { ObservabilityContextInterface } from "./observability";
import type { ObservabilityErrorLogPayloadInterface } from "./observability-payload.interface";
import { selectLogContextFields } from "./select-log-context-fields";
import { mapErrorToLogCategory } from "./observability-error-mapper";

export const createErrorLogPayload = (
  error: unknown,
  context?: ObservabilityContextInterface,
): ObservabilityErrorLogPayloadInterface => ({
  event: "error.captured",
  errorCategory: mapErrorToLogCategory(error),
  context: selectLogContextFields(context),
});
