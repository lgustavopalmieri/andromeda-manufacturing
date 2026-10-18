# Entidades TypeScript — catálogo, papéis e política

Estas entidades pertencem ao módulo `access-governance`. O catálogo é versão de produto; papéis
e política são isolados por tenant. Papel só agrupa permissões, nunca concede escopo sozinho.

```ts
import type { PermissionCode, TenantId, TenantMemberId } from "@shared/access/authorization.types";

export interface PermissionDefinitionEntityInterface {
  code: PermissionCode;
  domain: string;
  action: string;
  resourceTypes: readonly string[];
  delegable: boolean;
  sensitive: boolean;
  operational: boolean;
}

export const ROLE_STATUS = {
  DRAFT: "draft", PUBLISHED: "published", RETIRED: "retired",
} as const;
export type RoleStatus = (typeof ROLE_STATUS)[keyof typeof ROLE_STATUS];

export interface RoleDefinitionEntityInterface {
  id: string;
  tenantId: TenantId;
  code: string;
  displayName: string;
  origin: "base-template" | "tenant-custom";
  currentPublishedRevisionId?: string;
  createdByMemberId: TenantMemberId;
  createdAt: Date;
  retiredAt?: Date;
}

export interface RoleRevisionEntityInterface {
  id: string;
  tenantId: TenantId;
  roleDefinitionId: string;
  version: number;
  status: RoleStatus;
  permissionCodes: readonly PermissionCode[];
  changeReason: string;
  authoredByMemberId: TenantMemberId;
  reviewedByMemberId?: TenantMemberId;
  publishedAt?: Date;
  retiredAt?: Date;
}

export const POLICY_REVISION_STATUS = {
  DRAFT: "draft", EFFECTIVE: "effective", SUPERSEDED: "superseded",
} as const;
export type PolicyRevisionStatus =
  (typeof POLICY_REVISION_STATUS)[keyof typeof POLICY_REVISION_STATUS];

export interface SegregationRuleInterface {
  id: string;
  leftOperationCodes: readonly PermissionCode[];
  rightOperationCodes: readonly PermissionCode[];
  resourceTypes: readonly string[];
  requiresDistinctIdentity: boolean;
  requiresSecondApproval: boolean;
}

export interface OperationConditionRuleInterface {
  operationCodes: readonly PermissionCode[];
  requiresCompetency: boolean;
  requiresAssetAssignment: boolean;
  requiresReason: boolean;
  requiresHumanConfirmation: boolean;
}

export interface AccessPolicyRevisionEntityInterface {
  id: string;
  tenantId: TenantId;
  version: number;
  status: PolicyRevisionStatus;
  segregationRules: readonly SegregationRuleInterface[];
  operationConditionRules: readonly OperationConditionRuleInterface[];
  directGrantMaximumDurationHours: number;
  emergencyAccessMaximumDurationHours: number;
  reviewIntervalDays: number;
  effectiveFrom?: Date;
  authoredByMemberId: TenantMemberId;
  publishedByMemberId?: TenantMemberId;
  createdAt: Date;
}
```

O bootstrap cria cópias tenant-local dos papéis-base e da política neutra. Publicar exige revisão
segregada quando a alteração é crítica. O avaliador só lê revisões `PUBLISHED`/`EFFECTIVE`; uma
revisão publicada jamais é atualizada. Uma mudança intencional cria revisão nova e migra grants
de maneira explícita, com antes/depois na auditoria.
