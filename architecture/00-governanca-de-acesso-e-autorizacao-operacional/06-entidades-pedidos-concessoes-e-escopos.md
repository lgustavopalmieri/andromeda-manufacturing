# Entidades TypeScript — pedidos, concessões e escopos

`AccessRequest` separa patrocinar/aprovar de provisionar. `AccessGrant` é a autoridade efetiva.
Ambos pertencem a `access-governance` e sempre pertencem a um único tenant.

```ts
import type { PermissionCode, TenantId, TenantMemberId, TopologyNodeId } from "@shared/access/authorization.types";

export interface ScopeSelectorInterface {
  anchorKind: "tenant" | "topology-node" | "functional-object";
  anchorReference: TenantId | TopologyNodeId | string;
  includesDescendants: boolean;
  excludedTopologyNodeIds: readonly TopologyNodeId[];
}

export interface GrantConstraintsInterface {
  shiftTemplateIds: readonly string[];
  productFamilyIds: readonly string[];
  assetIds: readonly TopologyNodeId[];
  hmiActionCodes: readonly string[];
  requiredCompetencyCodes: readonly string[];
}

export const ACCESS_REQUEST_STATUS = {
  PROPOSED: "proposed", APPROVED: "approved", REJECTED: "rejected", FULFILLED: "fulfilled",
  CANCELLED: "cancelled",
} as const;
export type AccessRequestStatus =
  (typeof ACCESS_REQUEST_STATUS)[keyof typeof ACCESS_REQUEST_STATUS];

export interface AccessRequestEntityInterface {
  id: string;
  tenantId: TenantId;
  subjectMemberId: TenantMemberId;
  requestedRoleRevisionId?: string;
  requestedPermissionCodes: readonly PermissionCode[];
  scopes: readonly ScopeSelectorInterface[];
  constraints: GrantConstraintsInterface;
  validFrom: Date;
  validUntil?: Date;
  sponsoredByMemberId: TenantMemberId;
  approvedByMemberId?: TenantMemberId;
  status: AccessRequestStatus;
  justification: string;
  createdAt: Date;
  decidedAt?: Date;
}

export const ACCESS_GRANT_STATUS = {
  SCHEDULED: "scheduled", ACTIVE: "active", SUSPENDED: "suspended", EXPIRED: "expired",
  REVOKED: "revoked",
} as const;
export type AccessGrantStatus =
  (typeof ACCESS_GRANT_STATUS)[keyof typeof ACCESS_GRANT_STATUS];

export interface AccessGrantEntityInterface {
  id: string;
  tenantId: TenantId;
  subjectMemberId: TenantMemberId;
  source: "role-revision" | "direct-exception";
  roleRevisionId?: string;
  directPermissionCodes: readonly PermissionCode[];
  scopes: readonly ScopeSelectorInterface[];
  constraints: GrantConstraintsInterface;
  delegablePermissionCodes: readonly PermissionCode[];
  status: AccessGrantStatus;
  validFrom: Date;
  validUntil?: Date;
  nextReviewAt?: Date;
  grantedByMemberId: TenantMemberId;
  approvedByMemberId?: TenantMemberId;
  requestId?: string;
  justification: string;
  suspendedReason?: string;
  revokedReason?: string;
  createdAt: Date;
  endedAt?: Date;
}

export const ACCESS_REVIEW_STATUS = {
  PENDING: "pending", CONFIRMED: "confirmed", REDUCED: "reduced", REVOKED: "revoked", OVERDUE: "overdue",
} as const;
export type AccessReviewStatus = (typeof ACCESS_REVIEW_STATUS)[keyof typeof ACCESS_REVIEW_STATUS];

export interface AccessReviewTaskEntityInterface {
  id: string;
  tenantId: TenantId;
  accessGrantId: string;
  reviewerMemberId: TenantMemberId;
  dueAt: Date;
  status: AccessReviewStatus;
  decisionReason?: string;
  decidedAt?: Date;
}
```

Uma concessão é ativada somente quando membro, tenant, vigência, revisão do papel e condições estão válidos.
Permissão direta usa `source: "direct-exception"`, exige aprovador, razão e fim; ela nunca vira papel informal.
Escopo amplo não inventa permissão, escopo de ativo não revela irmãos e restrição vazia não amplia poder.
