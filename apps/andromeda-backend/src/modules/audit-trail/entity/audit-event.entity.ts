export type AuditEventId = string;
export type AuditTenantId = string;
export type AuditIdentityId = string;
export type AuditTenantMemberId = string;
export type AuditResourceId = string;
export type AuditTopologyNodeId = string;
export type AuditPermissionCode = string;

export const AUDIT_DECISION = {
  PERMITTED: "permitted",
  DENIED: "denied",
  FAILED: "failed",
  CHANGED: "changed",
} as const;

export type AuditDecision = (typeof AUDIT_DECISION)[keyof typeof AUDIT_DECISION];

export interface AuditActorInterface {
  identityId: AuditIdentityId;
  tenantMemberId?: AuditTenantMemberId;
  identityKind: "human" | "service" | "device" | "agent";
}

export interface AuditResourceInterface {
  resourceType: string;
  resourceId: AuditResourceId;
  topologyNodeIds: readonly AuditTopologyNodeId[];
  functionalObjectRefs: readonly string[];
  assetId?: AuditTopologyNodeId;
  lifecycleState?: string;
  versionId?: string;
}

export interface AuditEventEntityInterface {
  id: AuditEventId;
  tenantId: AuditTenantId;
  occurredAt: Date;
  operationCode: AuditPermissionCode;
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
