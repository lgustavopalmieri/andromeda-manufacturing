import type { TenantId } from "../../tenant/entity/tenant.entity";

export interface PermissionDefinitionEntityInterface {
  code: string;
  domain: string;
  action: string;
  resourceTypes: readonly string[];
  delegable: boolean;
  sensitive: boolean;
  operational: boolean;
}

export interface RoleDefinitionEntityInterface {
  id: string;
  tenantId: TenantId;
  code: string;
  displayName: string;
  origin: "base-template" | "tenant-custom";
  currentPublishedRevisionId: string;
  createdAt: Date;
}

export interface RoleRevisionEntityInterface {
  id: string;
  tenantId: TenantId;
  roleDefinitionId: string;
  version: number;
  status: "published";
  permissionCodes: readonly string[];
  changeReason: string;
  authoredBy: "system";
  publishedAt: Date;
}

export interface AccessPolicyRevisionEntityInterface {
  id: string;
  tenantId: TenantId;
  version: number;
  status: "effective";
  segregationRules: readonly object[];
  operationConditionRules: readonly object[];
  directGrantMaximumDurationHours: number;
  emergencyAccessMaximumDurationHours: number;
  reviewIntervalDays: number;
  effectiveFrom: Date;
  authoredBy: "system";
  publishedBy: "system";
  createdAt: Date;
}
