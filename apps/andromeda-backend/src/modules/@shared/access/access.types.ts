export type TenantId = string;
export type IdentityId = string;
export type TenantMemberId = string;
export type ResourceId = string;
export type TopologyNodeId = string;
export type PermissionCode = string;
export type OperationCode = PermissionCode;

export const IDENTITY_KIND = {
  HUMAN: "human",
  SERVICE: "service",
  DEVICE: "device",
  AGENT: "agent",
} as const;

export type IdentityKind = (typeof IDENTITY_KIND)[keyof typeof IDENTITY_KIND];

export const AUTHORIZATION_DECISION = {
  PERMIT: "permit",
  DENY: "deny",
  CONFIRMATION_REQUIRED: "confirmation_required",
} as const;

export type AuthorizationDecision =
  (typeof AUTHORIZATION_DECISION)[keyof typeof AUTHORIZATION_DECISION];

export interface AuthenticatedIdentityInterface {
  providerSubjectId: string;
  authenticatedAt: Date;
  authenticationMethod?: string;
}

export interface AuthorizationSubjectInterface {
  identityId: IdentityId;
  tenantId: TenantId;
  tenantMemberId: TenantMemberId;
  kind: IdentityKind;
}

export interface ResourceContextInterface {
  tenantId: TenantId;
  resourceType: string;
  resourceId: ResourceId;
  topologyNodeIds: readonly TopologyNodeId[];
  functionalObjectRefs: readonly string[];
  lifecycleState?: string;
  versionId?: string;
  assetId?: TopologyNodeId;
  productFamilyId?: string;
  hmiActionCode?: string;
}

export interface AuthorizationHistoryFactInterface {
  operation: OperationCode;
  effectiveIdentityId: IdentityId;
  versionId?: string;
}

export interface AuthorizationRequestInterface {
  subject: AuthorizationSubjectInterface;
  operation: OperationCode;
  resource: ResourceContextInterface;
  history: readonly AuthorizationHistoryFactInterface[];
  occurredAt: Date;
  correlationId: string;
  reason?: string;
}

export interface AuthorizationObligationInterface {
  code: "audit" | "reason" | "human-confirmation" | "signature" | "second-approver";
  parameters?: Readonly<Record<string, string>>;
}

export interface AuthorizationDecisionInterface {
  decision: AuthorizationDecision;
  denialCode?: string;
  grantIds: readonly string[];
  policyRevisionId: string;
  obligations: readonly AuthorizationObligationInterface[];
}
