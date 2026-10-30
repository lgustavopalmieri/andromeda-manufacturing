import type { LogErrorCategory } from "./observability-error-mapper";

export interface ObservabilityLogResourceInterface {
  kind: string;
  id: string;
}

export interface ObservabilityLogContextInterface {
  invocationId?: string;
  actorId?: string;
  tenantId?: string;
  action?: string;
  result?: string;
  outcome?: string;
  reasonCategory?: string;
  occurredAt?: string;
  policyVersion?: string;
  scenarioVersion?: string;
  resource?: ObservabilityLogResourceInterface;
}

export interface ObservabilityEventLogPayloadInterface {
  event: string;
  context: ObservabilityLogContextInterface;
}

export interface ObservabilityErrorLogPayloadInterface extends ObservabilityEventLogPayloadInterface {
  event: "error.captured";
  errorCategory: LogErrorCategory;
}
