import type { ObservabilityContextInterface } from "./observability";
import type { ObservabilityEventLogPayloadInterface } from "./observability-payload.interface";
import { selectLogContextFields } from "./select-log-context-fields";

export const createEventLogPayload = (
  name: string,
  context?: ObservabilityContextInterface,
): ObservabilityEventLogPayloadInterface => {
  const validName = typeof name === "string" && name.match(/^[a-z][a-z0-9_.]{0,127}$/)?.[0] === name;
  return {
    event: validName ? name : "observability.event",
    context: selectLogContextFields(context),
  };
};
