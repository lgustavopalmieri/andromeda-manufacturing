# Entidades TypeScript — delegação e acesso emergencial

Delegação e exceção não alteram `AccessGrant`. Elas são autoridades derivadas, temporárias e
auditáveis, avaliadas junto com a fonte em cada ato. Nenhuma delas cria papel persistente.

```ts
import type { PermissionCode, TenantId, TenantMemberId } from "@shared/access/authorization.types";
import type { GrantConstraintsInterface, ScopeSelectorInterface } from "modules/access-governance/entity/access-grant.interfaces";

export const DELEGATION_STATUS = {
  PROPOSED: "proposed", PENDING_ACCEPTANCE: "pending_acceptance", ACTIVE: "active",
  SUSPENDED: "suspended", EXPIRED: "expired", REVOKED: "revoked",
} as const;
export type DelegationStatus = (typeof DELEGATION_STATUS)[keyof typeof DELEGATION_STATUS];

export const DELEGATION_EXECUTION_MODE = {
  PROPOSE_ONLY: "propose_only", HUMAN_CONFIRMATION: "human_confirmation", LOW_RISK_AUTOMATIC: "low_risk_automatic",
} as const;
export type DelegationExecutionMode =
  (typeof DELEGATION_EXECUTION_MODE)[keyof typeof DELEGATION_EXECUTION_MODE];

export interface DelegationEntityInterface {
  id: string;
  tenantId: TenantId;
  sourceAccessGrantId: string;
  delegatorMemberId: TenantMemberId;
  delegateMemberId: TenantMemberId;
  permissionCodes: readonly PermissionCode[];
  scopes: readonly ScopeSelectorInterface[];
  constraints: GrantConstraintsInterface;
  executionMode: DelegationExecutionMode;
  status: DelegationStatus;
  requiresAcceptance: boolean;
  approvedByMemberId?: TenantMemberId;
  justification: string;
  validFrom: Date;
  validUntil: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export const EMERGENCY_ACCESS_STATUS = {
  REQUESTED: "requested", ACTIVE: "active", EXPIRED: "expired", REVOKED: "revoked", REVIEWED: "reviewed",
} as const;
export type EmergencyAccessStatus =
  (typeof EMERGENCY_ACCESS_STATUS)[keyof typeof EMERGENCY_ACCESS_STATUS];

export interface EmergencyAccessEntityInterface {
  id: string;
  tenantId: TenantId;
  subjectMemberId: TenantMemberId;
  permissionCodes: readonly PermissionCode[];
  scopes: readonly ScopeSelectorInterface[];
  constraints: GrantConstraintsInterface;
  status: EmergencyAccessStatus;
  requestedByMemberId: TenantMemberId;
  authorizedByMemberId: TenantMemberId;
  reviewerMemberId: TenantMemberId;
  incidentReference: string;
  justification: string;
  validFrom: Date;
  expiresAt: Date;
  revokedAt?: Date;
  reviewedAt?: Date;
  reviewOutcome?: string;
}
```

Na ativação, a feature verifica que os códigos e escopos de `Delegation` são subconjuntos do grant
fonte, que cada permissão é delegável e que o prazo não o excede. Owner, política de acesso,
credenciais, transferência de propriedade e aprovação do próprio conflito não são delegáveis.
Agentes só recebem estes mesmos objetos com modo explícito. Exceção exige notificações e revisão
posterior; expiração é automática e não admite renovação silenciosa.
