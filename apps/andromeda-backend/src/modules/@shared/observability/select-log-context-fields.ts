import type { ObservabilityContextInterface } from "./observability";
import type { ObservabilityLogContextInterface } from "./observability-payload.interface";
import { LOG_CONTEXT_FIELDS } from "./log-context-fields";

const readContextFieldWithoutInvokingGetters = (source: unknown, field: string): unknown => {
  try {
    if (source === null || typeof source !== "object" || Array.isArray(source)) return undefined;
    return Object.getOwnPropertyDescriptor(source, field)?.value;
  } catch {
    return undefined;
  }
};

const isValidLogMetadataValue = (value: unknown): value is string =>
  typeof value === "string" && value.match(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/)?.[0] === value;

export const selectLogContextFields = (
  context: ObservabilityContextInterface | undefined,
): ObservabilityLogContextInterface => {
  const selected: ObservabilityLogContextInterface = {};

  for (const field of LOG_CONTEXT_FIELDS) {
    const value = readContextFieldWithoutInvokingGetters(context, field);
    if (isValidLogMetadataValue(value)) selected[field] = value;
  }

  const resource = readContextFieldWithoutInvokingGetters(context, "resource");
  const kind = readContextFieldWithoutInvokingGetters(resource, "kind");
  const id = readContextFieldWithoutInvokingGetters(resource, "id");
  if (isValidLogMetadataValue(kind) && isValidLogMetadataValue(id)) selected.resource = { kind, id };

  return selected;
};
