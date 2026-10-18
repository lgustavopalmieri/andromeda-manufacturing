# Entidades TypeScript — competência, turno e designação

Estes módulos secundários existem para que a autorização de ativo seja verificável desde o começo.
Eles não concedem permissão; apenas satisfazem ou falham condições de uma concessão e da política.

```ts
import type { TenantId, TenantMemberId, TopologyNodeId } from "@shared/access/authorization.types";

export const COMPETENCY_STATUS = {
  PENDING: "pending", VALID: "valid", EXPIRED: "expired", REVOKED: "revoked",
} as const;
export type CompetencyStatus = (typeof COMPETENCY_STATUS)[keyof typeof COMPETENCY_STATUS];

export interface CompetencyEvidenceEntityInterface {
  id: string;
  tenantId: TenantId;
  tenantMemberId: TenantMemberId;
  competencyCode: string;
  status: CompetencyStatus;
  validatedByMemberId: TenantMemberId;
  sourceReference: string;
  validFrom: Date;
  validUntil?: Date;
  revokedAt?: Date;
}

export interface ShiftTemplateEntityInterface {
  id: string;
  tenantId: TenantId;
  siteNodeId: TopologyNodeId;
  code: string;
  localStartTime: string;
  localEndTime: string;
  timeZone: string;
  operationalDatePolicy: "start-date" | "end-date";
  activeFrom: Date;
  activeUntil?: Date;
}

export interface ShiftOccurrenceEntityInterface {
  id: string;
  tenantId: TenantId;
  shiftTemplateId: string;
  siteNodeId: TopologyNodeId;
  operationalDate: string;
  startedAt: Date;
  endedAt: Date;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
}

export const ASSET_ASSIGNMENT_PURPOSE = {
  OPERATE: "operate", SETUP: "setup", MAINTAIN: "maintain", INSPECT: "inspect", SUPERVISE: "supervise",
} as const;
export type AssetAssignmentPurpose =
  (typeof ASSET_ASSIGNMENT_PURPOSE)[keyof typeof ASSET_ASSIGNMENT_PURPOSE];

export const ASSET_ASSIGNMENT_STATUS = {
  SCHEDULED: "scheduled", ACTIVE: "active", SUSPENDED: "suspended", ENDED: "ended",
} as const;
export type AssetAssignmentStatus =
  (typeof ASSET_ASSIGNMENT_STATUS)[keyof typeof ASSET_ASSIGNMENT_STATUS];

export interface AssetAssignmentEntityInterface {
  id: string;
  tenantId: TenantId;
  tenantMemberId: TenantMemberId;
  assetNodeId: TopologyNodeId;
  shiftTemplateId?: string;
  purpose: AssetAssignmentPurpose;
  status: AssetAssignmentStatus;
  validFrom: Date;
  validUntil?: Date;
  assignedByMemberId: TenantMemberId;
  reason: string;
  createdAt: Date;
  endedAt?: Date;
}
```

O avaliador busca turno materializado pelo instante, não pelo relógio do navegador. Para ação em
ativo exige permissão, escopo, atribuição com propósito compatível e competência exigida pelo ativo
ou grant, quando a política assim determinar. Suspender qualquer uma dessas evidências afeta a
próxima ação, mas preserva fatos já registrados.
