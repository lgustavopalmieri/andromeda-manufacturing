import type {
  AuditActorInterface,
  AuditDecision,
  AuditResourceInterface,
} from "../../../entity/audit-event.entity";

export interface RecordAuditEventInputProps {
  tenantId: string;
  operationCode: string;
  decision: AuditDecision;
  effectiveActor: AuditActorInterface;
  sponsoringActor?: AuditActorInterface;
  resource: AuditResourceInterface;
  correlationId: string;
  causationId?: string;
  accessGrantIds: readonly string[];
  policyRevisionId?: string;
  delegationId?: string;
  emergencyAccessId?: string;
  credentialId?: string;
  reason?: string;
  denialCode?: string;
  beforeDigest?: string;
  afterDigest?: string;
  resultReference?: string;
  origin: "http" | "hmi" | "integration" | "agent" | "worker";
}
