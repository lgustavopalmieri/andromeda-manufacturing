import { EntitySchema } from "typeorm";
import type { AuditEventEntityInterface } from "modules/audit-trail/entity/audit-event.entity";

export const AUDIT_EVENT_TABLE_NAME = "audit_event";

export const AuditEventOrmEntity = new EntitySchema<AuditEventEntityInterface>({
  name: "AuditEvent",
  tableName: AUDIT_EVENT_TABLE_NAME,
  columns: {
    id: { type: "uuid", primary: true },
    tenantId: { name: "tenant_id", type: "uuid" },
    occurredAt: { name: "occurred_at", type: "timestamp with time zone" },
    operationCode: { name: "operation_code", type: "varchar", length: 180 },
    decision: { type: "varchar", length: 16 },
    effectiveActor: { name: "effective_actor", type: "jsonb" },
    sponsoringActor: { name: "sponsoring_actor", type: "jsonb", nullable: true },
    resource: { type: "jsonb" },
    correlationId: { name: "correlation_id", type: "uuid" },
    causationId: { name: "causation_id", type: "uuid", nullable: true },
    accessGrantIds: { name: "access_grant_ids", type: "uuid", array: true },
    policyRevisionId: { name: "policy_revision_id", type: "uuid", nullable: true },
    delegationId: { name: "delegation_id", type: "uuid", nullable: true },
    emergencyAccessId: { name: "emergency_access_id", type: "uuid", nullable: true },
    credentialId: { name: "credential_id", type: "uuid", nullable: true },
    reason: { type: "varchar", length: 2_000, nullable: true },
    denialCode: { name: "denial_code", type: "varchar", length: 160, nullable: true },
    beforeDigest: { name: "before_digest", type: "varchar", length: 128, nullable: true },
    afterDigest: { name: "after_digest", type: "varchar", length: 128, nullable: true },
    resultReference: { name: "result_reference", type: "varchar", length: 500, nullable: true },
    origin: { type: "varchar", length: 16 },
  },
});
