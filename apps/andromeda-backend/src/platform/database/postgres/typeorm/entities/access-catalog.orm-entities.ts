import { EntitySchema } from "typeorm";
import type {
  AccessPolicyRevisionEntityInterface,
  PermissionDefinitionEntityInterface,
  RoleDefinitionEntityInterface,
  RoleRevisionEntityInterface,
} from "modules/access-governance/entity/access-catalog.entity";

export const PermissionDefinitionOrmEntity = new EntitySchema<PermissionDefinitionEntityInterface>({
  name: "PermissionDefinition",
  tableName: "permission_definition",
  columns: {
    code: { type: "varchar", length: 180, primary: true },
    domain: { type: "varchar", length: 80 },
    action: { type: "varchar", length: 100 },
    resourceTypes: { name: "resource_types", type: "jsonb" },
    delegable: { type: "boolean" },
    sensitive: { type: "boolean" },
    operational: { type: "boolean" },
  },
});

export const RoleDefinitionOrmEntity = new EntitySchema<RoleDefinitionEntityInterface>({
  name: "RoleDefinition",
  tableName: "role_definition",
  columns: {
    id: { type: "uuid", primary: true },
    tenantId: { name: "tenant_id", type: "uuid" },
    code: { type: "varchar", length: 120 },
    displayName: { name: "display_name", type: "varchar", length: 180 },
    origin: { type: "varchar", length: 32 },
    currentPublishedRevisionId: { name: "current_published_revision_id", type: "uuid" },
    createdAt: { name: "created_at", type: "timestamp with time zone" },
  },
});

export const RoleRevisionOrmEntity = new EntitySchema<RoleRevisionEntityInterface>({
  name: "RoleRevision",
  tableName: "role_revision",
  columns: {
    id: { type: "uuid", primary: true },
    tenantId: { name: "tenant_id", type: "uuid" },
    roleDefinitionId: { name: "role_definition_id", type: "uuid" },
    version: { type: "integer" },
    status: { type: "varchar", length: 32 },
    permissionCodes: { name: "permission_codes", type: "jsonb" },
    changeReason: { name: "change_reason", type: "varchar", length: 2_000 },
    authoredBy: { name: "authored_by", type: "varchar", length: 32 },
    publishedAt: { name: "published_at", type: "timestamp with time zone" },
  },
});

export const AccessPolicyRevisionOrmEntity = new EntitySchema<AccessPolicyRevisionEntityInterface>({
  name: "AccessPolicyRevision",
  tableName: "access_policy_revision",
  columns: {
    id: { type: "uuid", primary: true },
    tenantId: { name: "tenant_id", type: "uuid" },
    version: { type: "integer" },
    status: { type: "varchar", length: 32 },
    segregationRules: { name: "segregation_rules", type: "jsonb" },
    operationConditionRules: { name: "operation_condition_rules", type: "jsonb" },
    directGrantMaximumDurationHours: { name: "direct_grant_maximum_duration_hours", type: "integer" },
    emergencyAccessMaximumDurationHours: {
      name: "emergency_access_maximum_duration_hours",
      type: "integer",
    },
    reviewIntervalDays: { name: "review_interval_days", type: "integer" },
    effectiveFrom: { name: "effective_from", type: "timestamp with time zone" },
    authoredBy: { name: "authored_by", type: "varchar", length: 32 },
    publishedBy: { name: "published_by", type: "varchar", length: 32 },
    createdAt: { name: "created_at", type: "timestamp with time zone" },
  },
});
